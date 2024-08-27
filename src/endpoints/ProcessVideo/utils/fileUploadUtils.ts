import { Payload } from 'payload/dist/payload'
import { UploadBufferFunc, UploadPathFunc } from '../../../types'

export const getUploadPath =
    (payload: Payload, outputCollectionSlug: string): UploadPathFunc =>
    async (path: string) => {
        return await payload.create({ collection: outputCollectionSlug, filePath: path, data: {} })
    }

export const getUploadBuffer =
    (payload: Payload, outputCollectionSlug: string): UploadBufferFunc =>
    async (
        data: Buffer,
        mimetype: string,
        name: string,
        size: number,
        originalData?: Record<string, any>,
    ) => {
        const file = { data, mimetype, name, size }
        return await payload.create({
            collection: outputCollectionSlug,
            file,
            data: originalData ?? {},
        })
    }
