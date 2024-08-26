import { CollectionConfig } from 'payload/types'

export interface PluginOptions {
  /**
   * Enable or disable plugin
   * @default false
   */
  enabled?: boolean
  collections: Record<string, CollectionOptions>
  segmentLength?: number
  segmentsOverrides?: Partial<CollectionConfig>
}

export interface CollectionOptions {
  keepOriginal: boolean
  resolutions?: Resolution[]
}

export interface Resolution {
  size: number
  bitrate: number
}

export interface NewCollectionTypes {
  title: string
}
