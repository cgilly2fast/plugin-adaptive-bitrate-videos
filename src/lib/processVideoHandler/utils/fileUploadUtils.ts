import { BasePayload } from 'payload'
import { UploadBufferFunc, UploadPathFunc } from '../../../types.js'

export const getUploadPath =
  (payload: BasePayload, outputCollectionSlug: string): UploadPathFunc =>
  (path: string) => {
    return payload.create({ collection: outputCollectionSlug, filePath: path, data: {} })
  }

export const getUploadBuffer =
  (payload: BasePayload, outputCollectionSlug: string): UploadBufferFunc =>
  async (
    data: Buffer,
    mimetype: string,
    name: string,
    size: number,
    originalData?: Record<string, any>,
  ) => {
    const file = { data, mimetype, name, size }
    return payload.create({
      collection: outputCollectionSlug,
      file,
      data: originalData ?? {},
    })
  }
