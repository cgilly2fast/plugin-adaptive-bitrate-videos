import type { Config, Plugin } from 'payload/config'

import { onInitExtension } from './onInitExtension'
import type { PluginOptions } from './types'
import { extendWebpackConfig } from './webpack'
import AfterDashboard from './components/AfterDashboard'
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
        path: '/custom-endpoint',
        method: 'get',
        root: true,
        handler: (req, res): void => {
          res.json({ message: 'Here is a custom endpoint' })
        },
      },
      // Add additional endpoints here
    ]

    config.globals = [
      ...(config.globals || []),
      // Add additional globals here
    ]

    config.hooks = {
      ...(config.hooks || {}),
      // Add additional hooks here
    }

    config.onInit = async payload => {
      if (incomingConfig.onInit) await incomingConfig.onInit(payload)
      // Add additional onInit code by using the onInitExtension function
      onInitExtension(pluginOptions, payload)
    }

    return config
  }
