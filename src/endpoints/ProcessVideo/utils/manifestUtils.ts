import { VideoInfo, PlaylistInfo, PossibleBitrates, UploadBufferFunc } from '../../../types'

export async function createMasterManifest(
    videoName: string,
    videoInfo: VideoInfo,
    possibleBitrates: PossibleBitrates,
    baseURL: string,
    uploadBuffer: UploadBufferFunc,
    outputCollectionSlug: string,
    originalData: Record<string, any>,
) {
    const { frameRate, playlists } = videoInfo
    const m3u8Content: string[] = ['#EXTM3U', '#EXT-X-VERSION:3']

    // Add variant playlists
    playlists.forEach(playlist => {
        const { resolution, width, height } = playlist
        const bitrate = possibleBitrates[resolution]
        m3u8Content.push(
            `#EXT-X-STREAM-INF:BANDWIDTH=${
                bitrate * 1000
            },RESOLUTION=${width}x${height},CODECS="mp4a.40.5,avc1.4d401e",FRAME-RATE-${frameRate}.0,CLOSED-CAPTIONS=NONE`,
            `${baseURL}/${outputCollectionSlug}/${videoName}-${resolution}p-playlist.m3u8`,
        )
    })
    const content = m3u8Content.join('\n')
    const buffer = Buffer.from(content, 'utf-8')
    uploadBuffer(
        buffer,
        'application/x-mpegURL',
        videoName + '.m3u8',
        buffer.byteLength,
        originalData,
    )
}
export async function createPlaylistManifests(
    videoName: string,
    playlists: PlaylistInfo[],
    segmentDuration: number,
    uploadBuffer: UploadBufferFunc,
) {
    for (const playlist of playlists) {
        const { segments, resolution } = playlist
        const playlistContent: string[] = [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            `#EXT-X-TARGETDURATION:${segmentDuration}`,
            '#EXT-X-MEDIA-SEQUENCE:0',
            '#EXT-X-PLAYLIST-TYPE:VOD',
        ]

        segments.forEach(segment => {
            playlistContent.push(`#EXTINF:${segment.duration},`, segment.path)
        })

        playlistContent.push('#EXT-X-ENDLIST')
        const content = playlistContent.join('\n')
        const buffer = Buffer.from(content, 'utf-8')

        uploadBuffer(
            buffer,
            'application/x-mpegURL',
            `${videoName}-${resolution}p-playlist.m3u8`,
            buffer.byteLength,
        )
    }
}
