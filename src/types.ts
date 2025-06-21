import { CollectionConfig, TaskConfig, TypeWithID } from 'payload'

/**
 * Configuration options for the plugin.
 */
export interface ABROptions {
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

  /**
   * The name of queue used in payload-jobs
   * @default 'process-abr-videos-queue'
   */
  queueName?: string

  /**
   * Max number of video processing jobs to allow to be run at once
   * @default 1
   */
  maxJobs?: number

  /**
   * Task config override for video processing jobs.
   *
   * By default, the plugin uses a built-in task (slug: 'processVideo') that wraps
   * `src/lib/processVideoHandler/index` to handle video segmentation and manifest creation.
   * Use this override to customize the processing task or run it on different compute resources.
   *
   * **Default Task Input Schema:**
   * - `baseURL` (text): Base URL for file access
   * - `inputPath` (text): Path to input video file
   * - `keepOriginal` (checkbox): Whether to keep original file
   * - `originalID` (text): ID of original video record
   * - `originalData` (json): Original video metadata
   * - `resolutions` (array): Target resolutions with size and bitrate
   * - `segmentDuration` (number): Segment length in seconds
   * - `inputCollectionSlug` (text): Source collection slug
   * - `outputCollectionSlug` (text): Target collection slug
   *
   * **Usage Patterns:**
   *
   * 1. **Static TaskConfig object:**
   * ```typescript
   * taskOverride: {
   *   slug: 'custom-video-processing',
   *   handler: async ({ input, req }) => {
   *     // Custom processing logic
   *     const result = await processVideoHandler(req.payload, input)
   *     return { output: result }
   *   },
   *   retries: 2
   * }
   * ```
   *
   * 2. **Dynamic function returning TaskConfig:**
   * ```typescript
   * taskOverride: (options) => ({
   *   slug: 'dynamic-video-processing',
   *   handler: async ({ input, req }) => {
   *     // Access sanitized config for environment settings
   *     const customEndpoint = config.custom?.processingEndpoint
   *     if (customEndpoint) {
   *       // Delegate to external service
   *       const response = await fetch(`${customEndpoint}/process`, {
   *         method: 'POST',
   *         body: JSON.stringify(input)
   *       })
   *       return await response.json()
   *     }
   *     // Fallback to default processing
   *     return { output: await processVideoHandler(req.payload, input) }
   *   }
   * })
   * ```
   *
   * If not provided, uses the default task from `src/task/processVideo.ts`.
   *
   * @see https://payloadcms.com/docs/jobs/overview for TaskConfig documentation
   */
  taskOverride?:
    | TaskConfig
    | ((options: TaskConfigurationOptions) => TaskConfig | Promise<TaskConfig>)
}

export interface TaskConfigurationOptions {
  queueName: string
  maxJobs: number
  serverURL: string
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
  queueName: string
  maxJobs: number
  taskSlug: string
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
