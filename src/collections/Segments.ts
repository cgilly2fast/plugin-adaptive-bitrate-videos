import type { CollectionConfig } from 'payload'
import { ABROptions } from '../types.js'

export const generateSegmentsCollection = (pluginOptions: ABROptions): CollectionConfig => {
  const newConfig: CollectionConfig = {
    ...(pluginOptions?.segmentsOverrides || {}),
    slug: pluginOptions?.segmentsOverrides?.slug || 'segments',
    access: {
      read: () => true,
      update: () => false,
      ...(pluginOptions?.segmentsOverrides?.access || {}),
    },
    admin: {
      // hidden: true,
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
