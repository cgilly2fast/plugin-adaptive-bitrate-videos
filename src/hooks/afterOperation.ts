import { CollectionAfterOperationHook } from 'payload/types'
import { CollectionOptions } from '../types'

export const getAfterOperationHook =
  ({ keepOriginal, resolutions }: CollectionOptions): CollectionAfterOperationHook =>
  async ({ operation, result, req }) => {
    if (operation === 'create' || operation === 'update') {
      const { mimeType, url } = result as any
      console.log('Mime Type', mimeType)
      if (mimeType.startsWith('video/')) {
        setTimeout(async () => {
          try {
            console.log('Processing video and url is', url)
            const response = await fetch(`/api/process-video`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                inputPath: req.payload.config.serverURL + url,
                keepOriginal,
                resolutions,
              }),
            })
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            const result = await response.text()
            console.log('Result', result)
          } catch (error) {
            console.error('Error processing video', error)
          }
        }, 1000)
      }
    }
    return result
  }
