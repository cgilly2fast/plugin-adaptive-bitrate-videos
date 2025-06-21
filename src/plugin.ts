import { type Config } from 'payload'

import type { ABROptions } from './types.js'
import { generateSegmentsCollection } from './collections/Segments.js'
import { getAfterOperationHook } from './hooks/afterOperation.js'
import { getProcessVideoTask } from './task/processVideo.js'
import { getRunNextProcessVideoJob } from './endpoints/runNextProcessVideoJob.js'

const DefaultResolution = [
  { size: 144, bitrate: 150 },
  { size: 240, bitrate: 250 },
  { size: 360, bitrate: 500 },
  { size: 480, bitrate: 1000 },
  { size: 720, bitrate: 1500 },
  { size: 1080, bitrate: 4000 },
  { size: 1440, bitrate: 6000 },
  { size: 2160, bitrate: 10000 },
]

export const abrVideos =
  (pluginOptions: ABROptions) =>
  async (config: Config): Promise<Config> => {
    let {
      collections: allCollectionOptions,
      enabled,
      queueName = 'process-abr-videos-queue',
      maxJobs = 1,
      taskOverride = getProcessVideoTask,
    } = pluginOptions
    const { serverURL } = config

    if (enabled === false) {
      return config
    }
    if (!serverURL) throw Error('ABR Video Plugin: Setting `serverURL` is required')

    config.jobs = { ...config.jobs, tasks: config.jobs?.tasks || [] }

    // prettier-ignore
    const taskConfig = typeof taskOverride === 'function' 
      ? await taskOverride({ queueName, maxJobs, serverURL })
      : taskOverride

    config.jobs.tasks!.push(taskConfig)

    config.collections = [
      ...(config.collections || []).map((existingCollection) => {
        const options = allCollectionOptions[existingCollection.slug]

        if (!options) return existingCollection

        const { keepOriginal, resolutions, segmentDuration } = options

        return {
          ...existingCollection,
          hooks: {
            ...(existingCollection.hooks || {}),
            afterOperation: [
              ...(existingCollection.hooks?.afterOperation || []),
              getAfterOperationHook({
                keepOriginal: keepOriginal ?? false,
                resolutions: resolutions ?? DefaultResolution,
                segmentDuration: segmentDuration ?? 2,
                outputCollectionSlug: pluginOptions.segmentsOverrides?.slug || 'segments',
                maxJobs: maxJobs,
                queueName: queueName,
                taskSlug: taskConfig.slug,
              }),
            ],
          },
        }
      }),
      generateSegmentsCollection(pluginOptions),
    ]

    config.endpoints = [
      ...(config.endpoints || []),
      {
        path: '/run-next-process-video',
        method: 'get',
        handler: getRunNextProcessVideoJob(queueName, maxJobs),
      },
    ]
    return config as Config
  }
