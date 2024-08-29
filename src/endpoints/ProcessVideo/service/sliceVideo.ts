import ffmpeg, { FfprobeStream } from 'fluent-ffmpeg'
import http from 'http'
import https from 'https'
import { URL } from 'url'
import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'
import {
    PlaylistInfo,
    PossibleBitrates,
    PossibleResolutions,
    Segment,
    UploadBufferFunc,
    VideoInfo,
} from '../../../types'
import { calcDimensions, getFrameRate } from '../utils/ffmpegUtils'

export async function sliceVideo(
    videoName: string,
    inputPath: string,
    tempOutputDir: string,
    possibleResolutions: PossibleResolutions,
    possibleBitrates: PossibleBitrates,
    baseURL: string,
    segmentDuration: number,
    uploadBuffer: UploadBufferFunc,
    outputCollectionSlug: string,
): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(inputPath, async (err, metadata) => {
            if (err) return reject(err)

            const duration = metadata.format.duration
            if (!duration) {
                reject(`Video does not have a duration ${inputPath}`)
                return
            }

            const videoMetadata = metadata.streams.find(
                (stream: FfprobeStream) => stream.codec_type === 'video',
            )
            if (!videoMetadata) {
                reject(`Could not find a video stream on input file ${inputPath}`)
                return
            }

            const { width, height } = videoMetadata
            if (!width || !height) {
                reject(`Video metadata does not have a width or height ${inputPath}`)
                return
            }

            const aspectRatio = width / height
            let orientation = ''
            let maxResolution = 0

            if (width < height) {
                orientation = 'x'
                maxResolution = width
            } else {
                orientation = 'y'
                maxResolution = height
            }

            let playlists: PlaylistInfo[] = []
            const resolutions = possibleResolutions.filter(
                resolution => resolution <= maxResolution,
            )

            const copiedVideoPath = path.join(tempOutputDir, `${path.basename(inputPath)}`)
            await new Promise<void>((resolveCopy, rejectCopy) => {
                const file = fs.createWriteStream(copiedVideoPath)
                const protocol = copiedVideoPath.toLowerCase().startsWith('https:') ? https : http
                protocol.get(inputPath, resp => {
                    resp.pipe(file)

                    file.on('finish', () => {
                        file.close()
                        resolveCopy()
                    })
                    file.on('error', err => {
                        rejectCopy(err)
                    })
                })
            })
            for (const resolution of resolutions) {
                const outResolutionDir = path.join(tempOutputDir, `${resolution}`)
                if (!fs.existsSync(outResolutionDir)) {
                    fs.mkdirSync(outResolutionDir, { recursive: true })
                }

                const segmentFilePattern = path.join(
                    outResolutionDir,
                    `${videoName}-${resolution}p-segment%d.ts`,
                )

                let sizeParam = ''
                if (orientation === 'x') {
                    sizeParam = `${resolution}x?`
                } else {
                    sizeParam = `?x${resolution}`
                }

                console.log(inputPath, resolution, orientation)
                await new Promise<void>((resolveSegment, rejectSegment) => {
                    ffmpeg(copiedVideoPath)
                        .size(sizeParam)
                        .outputOptions([
                            '-map 0',
                            '-profile:v baseline',
                            '-level 3.0',
                            '-c:v libx264',
                            '-b:v 500k',
                            `-force_key_frames expr:gte(t,n_forced*${segmentDuration})`,
                            '-c:a aac',
                            '-b:a 128k',
                            '-hls_list_size 0',
                            '-start_number 0',
                            '-hls_init_time 0',
                            `-hls_time ${segmentDuration}`,
                            `-hls_segment_filename ${segmentFilePattern}`,
                            '-f hls',
                        ])
                        .output(path.join(outResolutionDir, `playlist.m3u8`))
                        .on('end', () => {
                            resolveSegment()
                        })
                        .on('error', function (err: any) {
                            console.log(err)
                            rejectSegment(err)
                        })
                        .run()
                })

                const numSegments = Math.ceil(duration / segmentDuration)
                let segments: Segment[] = []
                let promises = []
                for (let i = 0; i < numSegments; i++) {
                    const segmentName = `${videoName}-${resolution}p-segment${i}.ts`
                    const segmentPath = path.join(outResolutionDir, segmentName)

                    let computedDuration = segmentDuration
                    if (i === numSegments - 1) {
                        computedDuration = duration % segmentDuration
                    }
                    const buffer = await fsPromises.readFile(segmentPath)

                    promises.push(
                        uploadBuffer(buffer, 'video/mp2t', segmentName, buffer.byteLength),
                    )

                    segments.push({
                        index: i,
                        path: `${baseURL}/${outputCollectionSlug}/${segmentName}`,
                        duration: computedDuration,
                    })
                }

                const res = await Promise.all(promises)
                const bitrate = possibleBitrates[resolution] / 1000

                playlists.push({
                    resolution,
                    bitrate,
                    segments,
                    ...calcDimensions(aspectRatio, orientation, resolution),
                })
            }

            resolve({
                playlists,
                orientation,
                maxResolution,
                duration,
                aspectRatio,
                frameRate: getFrameRate(videoMetadata),
            })
        })
    })
}
