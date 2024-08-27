import { PayloadHandler } from 'payload/config'
import fs from 'fs'
import path from 'path'
import { createMasterManifest, createPlaylistManifests } from './utils/manifestUtils'
import { sliceVideo } from './service/sliceVideo'
import { PayloadRequest } from 'payload/types'
import { PossibleBitrates, PossibleResolutions, ProcessVideoParams } from '../../types'
import { getUploadBuffer, getUploadPath } from './utils/fileUploadUtils'

const processVideo: PayloadHandler = async (req: PayloadRequest, res, next) => {
    try {
        console.log('req.body', req.body)
        const {
            inputPath,
            baseURL,
            keepOriginal,
            resolutions,
            originalID,
            originalData,
            segmentDuration,
            inputCollectionSlug,
            outputCollectionSlug,
        } = req.body as ProcessVideoParams

        const decodedInputPath = decodeURIComponent(baseURL + inputPath)
        console.log(inputPath)

        const videoName = path.basename(decodedInputPath, path.extname(decodedInputPath))
        console.log('videoName', videoName)
        const tempDir = path.join(__dirname, 'temp')
        console.log('tempDir', tempDir)
        const tempOutputDir = path.join(tempDir, videoName)
        console.log('outDir', tempOutputDir)

        if (!fs.existsSync(tempOutputDir)) {
            fs.mkdirSync(tempOutputDir, { recursive: true })
        }
        let possibleBitrates: PossibleBitrates = {}
        let possibleResolutions: PossibleResolutions = []
        for (let i = 0; i < resolutions.length; i++) {
            const { size, bitrate } = resolutions[i]
            possibleBitrates[size] = bitrate
            possibleResolutions.push(size)
        }

        const uploadPathToOutputCollection = getUploadPath(req.payload, outputCollectionSlug)
        const uploadBufferToOutputCollection = getUploadBuffer(req.payload, outputCollectionSlug)
        const uploadBufferToInputCollection = getUploadBuffer(req.payload, inputCollectionSlug)

        const videoInfo = await sliceVideo(
            videoName,
            inputPath,
            tempOutputDir,
            possibleResolutions,
            possibleBitrates,
            baseURL,
            segmentDuration,
            uploadPathToOutputCollection,
            outputCollectionSlug,
        )
        await createPlaylistManifests(
            videoName,
            videoInfo.playlists,
            segmentDuration,
            uploadBufferToOutputCollection,
        )
        await createMasterManifest(
            videoName,
            videoInfo,
            possibleBitrates,
            baseURL,
            uploadBufferToInputCollection,
            outputCollectionSlug,
            originalData,
        )

        fs.rmSync(tempDir, { recursive: true, force: true })

        if (!keepOriginal) {
            //delete orginal from payload
        }

        return res.json({ success: true })
    } catch (error: any) {
        console.error('Error in processing video:', error)
        return res.json({ success: false, error: error.message })
    }
}

export default processVideo
