import { CollectionConfig, TypeWithID } from 'payload/types'

export interface PluginOptions {
    /**
     * Enable or disable plugin
     * @default false
     */
    enabled?: boolean
    collections: Record<string, CollectionOptions>
    segmentsOverrides?: Partial<CollectionConfig>
}

export interface CollectionOptions {
    keepOriginal: boolean
    resolutions?: Resolution[]
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
