import { CollectionConfig, TypeWithID } from 'payload/types'

/**
 * Configuration options for the plugin.
 */
export interface PluginOptions {
  /**
   * Enable or disable the plugin.
   * @default false
   */
  enabled?: boolean

  /**
   * Object with keys set to the slug of collections you want to enable the plugin for,
   * and values set to collection-specific options.
   */
  collections: Record<string, CollectionOptions>

  /**
   * Object that overrides the default collection used to store reference to the output segments.
   * @default SegmentOverrideDefault
   */
  segmentsOverrides?: Partial<CollectionConfig>
}

/**
 * Options specific to each collection.
 */
export interface CollectionOptions {
  /**
   * Whether to keep the original source file after processing.
   */
  keepOriginal: boolean

  /**
   * Custom resolutions for the plugin to output segment videos to.
   * @default ResolutionsDefault
   */
  resolutions?: Resolution[]

  /**
   * The output segment length in seconds for each resolution output.
   * @default 2
   */
  segmentDuration?: number
}

export interface GetAfterOperationHookParams extends Required<CollectionOptions> {
  outputCollectionSlug: string
}

export interface ProcessVideoParams extends GetAfterOperationHookParams {
  inputCollectionSlug: string
  inputPath: string
  baseURL: string
  originalID: string
  originalData: Record<string, any>
}

export interface Resolution {
  size: number
  bitrate: number
}

export interface NewCollectionTypes {
  title: string
}

export interface Segment {
  index: number
  path: string
  duration: number
}
export interface VideoInfo {
  playlists: PlaylistInfo[]
  orientation: string
  maxResolution: number
  duration: number
  aspectRatio: number
  frameRate: number
}

export interface PlaylistInfo {
  segments: Segment[]
  resolution: number
  bitrate: number
  width: number
  height: number
}

export type PossibleResolutions = number[]

export type PossibleBitrates = Record<number, number>

export type UploadBufferFunc = (
  data: Buffer,
  mimetype: string,
  name: string,
  size: number,
  orginalData?: Record<string, any>,
) => Promise<TypeWithID & Record<string, unknown>>

export type UploadPathFunc = (path: string) => Promise<TypeWithID & Record<string, unknown>>
