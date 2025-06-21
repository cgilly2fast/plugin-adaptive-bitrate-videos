import { FfprobeStream } from 'fluent-ffmpeg'

export function calcDimensions(aspectRatio: number, orientation: string, resolution: number) {
    let width: number, height: number

    if (orientation === 'y') {
        width = resolution
        height = Math.round(width / aspectRatio)
    } else {
        height = resolution
        width = Math.round(height / aspectRatio)
    }

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
