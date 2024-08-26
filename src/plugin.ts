import type { Config, Plugin } from 'payload/config'

import type { PluginOptions } from './types'
import { generateSegmentsCollection } from './collections/Segments'
import { getAfterOperationHook } from './hooks/afterOperation'

type PluginType = (pluginOptions: PluginOptions) => Plugin

export const samplePlugin =
  (pluginOptions: PluginOptions): Plugin =>
  incomingConfig => {
    let config = { ...incomingConfig }
    const { collections: allCollectionOptions, enabled } = pluginOptions

    // If the plugin is disabled, return the config without modifying it
    // The order of this check is important, we still want any webpack extensions to be applied even if the plugin is disabled
    if (enabled === false) {
      return config
    }

    config.collections = [
      ...(config.collections || []).map(existingCollection => {
        const options = allCollectionOptions[existingCollection.slug]
        return {
          ...existingCollection,
          hooks: {
            ...(existingCollection.hooks || {}),
            afterOperation: [
              ...(existingCollection.hooks?.afterOperation || []),
              getAfterOperationHook({ keepOriginal: true, resolutions: [] }),
            ],
          },
        }
      }),
      generateSegmentsCollection(pluginOptions),
    ]

    config.endpoints = [
      ...(config.endpoints || []),
      {
        path: '/process-video',
        method: 'post',
        handler: (req, res): void => {
          res.json({ message: 'Here is a custom endpoint' })
        },
      },
      // Add additional endpoints here
    ]

    return config
  }
