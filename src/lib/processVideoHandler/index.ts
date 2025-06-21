import { BasePayload } from 'payload'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createMasterManifest, createPlaylistManifests } from './utils/manifestUtils.js'
import { sliceVideo } from './service/sliceVideo.js'
import { PossibleBitrates, PossibleResolutions, ProcessVideoParams } from '../../types.js'
import { getUploadBuffer } from './utils/fileUploadUtils.js'

export type ProcessVideoResult = { success: true } | { success: false; error: any }

const processVideoHandler = async (
  payload: BasePayload,
  params: ProcessVideoParams,
): Promise<ProcessVideoResult> => {
  try {
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
    } = params as ProcessVideoParams

    console.log('base data in processing', inputPath)
    const decodedInputPath = decodeURIComponent(baseURL + inputPath)

    const videoName = path.basename(decodedInputPath, path.extname(decodedInputPath))
    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    const tempDir = path.join(currentDir, 'temp')
    const tempOutputDir = path.join(tempDir, videoName)

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

    const uploadBufferToOutputCollection = getUploadBuffer(payload, outputCollectionSlug)
    const uploadBufferToInputCollection = getUploadBuffer(payload, inputCollectionSlug)

    const videoInfo = await sliceVideo(
      videoName,
      inputPath,
      tempOutputDir,
      possibleResolutions,
      possibleBitrates,
      baseURL,
      segmentDuration,
      uploadBufferToOutputCollection,
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
      payload.delete({
        collection: inputCollectionSlug,
        id: originalID,
      })
    }
    console.log('Video processing done')
    return { success: true }
  } catch (error: any) {
    console.error('Error in processing video:', error)
    return { success: false, error: error.message }
  }
}

export default processVideoHandler
