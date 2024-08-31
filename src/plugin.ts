import type { Config, Plugin } from 'payload/config'

import type { PluginOptions } from './types'
import { generateSegmentsCollection } from './collections/Segments'
import { getAfterOperationHook } from './hooks/afterOperation'
import processVideo from './endpoints/ProcessVideo'
import { extendWebpackConfig } from './webpack'

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
    (pluginOptions: PluginOptions): Plugin =>
    incomingConfig => {
        let config = { ...incomingConfig }
        const { collections: allCollectionOptions, enabled } = pluginOptions

        // If the plugin is disabled, return the config without modifying it
        // The order of this check is important, we still want any webpack extensions to be applied even if the plugin is disabled
        if (enabled === false) {
            return config
        }
        const webpack = extendWebpackConfig(incomingConfig)
        config.admin = {
            ...(config.admin || {}),
            webpack,
        }
        config.collections = [
            ...(config.collections || []).map(existingCollection => {
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
                                outputCollectionSlug:
                                    pluginOptions?.segmentsOverrides?.slug || 'segments',
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
                path: '/process-video',
                method: 'post',
                handler: processVideo,
            },
            // Add additional endpoints here
        ]

        return config
    }
