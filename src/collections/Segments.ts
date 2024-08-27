import type { CollectionConfig } from 'payload/types'

import type { PluginOptions } from '../types'

export const generateSegmentsCollection = (pluginOptions: PluginOptions): CollectionConfig => {
    const newConfig: CollectionConfig = {
        ...(pluginOptions?.segmentsOverrides || {}),
        slug: pluginOptions?.segmentsOverrides?.slug || 'segments',
        access: {
            read: () => true,
            update: () => false,
            ...(pluginOptions?.segmentsOverrides?.access || {}),
        },
        admin: {
            ...(pluginOptions?.segmentsOverrides?.admin || {}),
        },
        fields: [...(pluginOptions?.segmentsOverrides?.fields || [])],
        hooks: {
            ...(pluginOptions?.segmentsOverrides?.hooks || {}),
        },
        upload: true,
    }

    return newConfig
}
