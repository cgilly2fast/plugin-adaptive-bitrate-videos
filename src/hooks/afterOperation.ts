import { CollectionAfterOperationHook } from 'payload'
import { GetAfterOperationHookParams } from '../types.js'

export const getAfterOperationHook =
  ({
    keepOriginal,
    resolutions,
    segmentDuration,
    outputCollectionSlug,
    maxJobs,
    queueName,
    taskSlug,
  }: GetAfterOperationHookParams): CollectionAfterOperationHook =>
  async ({ operation, result, req: { payload }, collection }) => {
    console.log('after operation')
    if (operation === 'create') {
      const { id, filename, mimeType, url, createdAt, updatedAt, ...data } = result as any
      if (!mimeType.startsWith('video/')) {
        return result
      }
      const baseURL = payload.config.serverURL.replace(/\/$/, '')
      console.log('base url', baseURL)
      // const docs = await payload.delete({
      //   collection: 'payload-jobs',
      //   where: {},
      // })
      // console.log('deleet done', docs)
      // return result
      setTimeout(async () => {
        const [{ totalDocs: totalRunningJobs }, job] = await Promise.all([
          payload.count({
            collection: 'payload-jobs',
            where: {
              queue: {
                equals: queueName,
              },
              processing: {
                equals: true,
              },
              hasError: {
                equals: false,
              },
            },
          }),
          payload.jobs.queue({
            queue: queueName,
            task: taskSlug,
            input: {
              baseURL,
              inputPath: url,
              keepOriginal,
              originalID: id,
              originalData: data,
              resolutions,
              segmentDuration,
              inputCollectionSlug: collection.slug,
              outputCollectionSlug,
            },
          }),
        ])

        console.log('total runnnign job', totalRunningJobs, job)

        if (totalRunningJobs < maxJobs) {
          payload.jobs.run({
            queue: queueName,
            limit: 1,
          })
        }
      }, 1000)
      return result
    }
    if (operation === 'deleteByID') {
      const { filename, mimeType } = result as any
      if (!mimeType.startsWith('application/x-mpegURL')) {
        return result
      }

      const videoName = filename.split('.')[0]

      payload.delete({
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

        payload.delete({
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
