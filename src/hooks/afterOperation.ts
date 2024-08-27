import { CollectionAfterOperationHook } from 'payload/types'
import { GetAfterOperationHookParams } from '../types'

export const getAfterOperationHook =
    ({
        keepOriginal,
        resolutions,
        segmentDuration,
        outputCollectionSlug,
    }: GetAfterOperationHookParams): CollectionAfterOperationHook =>
    async ({ operation, result, req, collection }) => {
        console.log('operations', operation)
        if (operation === 'create') {
            const { id, filename, mimeType, url, createdAt, updatedAt, ...data } = result as any
            if (!mimeType.startsWith('video/')) {
                return result
            }

            const baseURL = req.payload.config.serverURL.replace(/\/$/, '')
            setTimeout(async () => {
                console.log('Processing video url:', url)
                fetch(`${baseURL}/api/process-video`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        baseURL,
                        inputPath: url,
                        keepOriginal,
                        originalID: id,
                        originalData: data,
                        resolutions,
                        segmentDuration,
                        inputCollectionSlug: collection.slug,
                        outputCollectionSlug,
                    }),
                })
            }, 1000)
            return result
        }
        if (operation === 'deleteByID') {
            const { filename, mimeType } = result as any
            if (!mimeType.startsWith('application/x-mpegURL')) {
                return result
            }

            const videoName = filename.split('.')[0]

            req.payload.delete({
                collection: outputCollectionSlug,
                where: {
                    filename: {
                        contains: videoName,
                    },
                },
            })
            return result
        }

        if (operation === 'delete') {
            const { docs } = result as any
            for (let i = 0; i < docs.length; i++) {
                const { filename, mimeType } = docs[i]
                if (!mimeType.startsWith('application/x-mpegURL')) {
                    continue
                }

                const videoName = filename.split('.')[0]

                req.payload.delete({
                    collection: outputCollectionSlug,
                    where: {
                        filename: {
                            contains: videoName,
                        },
                    },
                })
            }
            return result
        }
        return result
    }
