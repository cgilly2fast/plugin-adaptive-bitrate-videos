import type { FfprobeStream } from 'fluent-ffmpeg'

export function calcDimensions(aspectRatio: number, orientation: string, resolution: number) {
    let width: number, height: number

    if (orientation === 'x') {
        width = resolution
        height = Math.round(width / aspectRatio)
    } else {
        height = resolution
        width = Math.round(height * aspectRatio)
    }
    
    // Ensure even dimensions for H264
    width = width % 2 === 0 ? width : width + 1
    height = height % 2 === 0 ? height : height + 1

    return { width, height }
}

export function getFrameRate(videoMetadata: FfprobeStream) {
    if (videoMetadata.avg_frame_rate) {
        const [numerator, denominator] = videoMetadata.avg_frame_rate.split('/')
        return parseInt(numerator) / parseInt(denominator)
    } else if (videoMetadata.r_frame_rate) {
        const [numerator, denominator] = videoMetadata.r_frame_rate.split('/')
        return parseInt(numerator) / parseInt(denominator)
    } else {
        console.warn('Could not determine frame rate, defaulting to 30fps')
        return 30
    }
}
