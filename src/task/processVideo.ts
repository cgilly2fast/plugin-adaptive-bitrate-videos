import { TaskConfig } from 'payload'
import processVideoHandler from '../lib/processVideoHandler/index.js'
import { TaskConfigurationOptions, ProcessVideoParams } from '../types.js'

export const getProcessVideoTask = async (options: TaskConfigurationOptions) => {
  const processVideoConfig: TaskConfig = {
    slug: 'processVideo',
    label: 'Process video for adaptive bitrate playback',
    retries: 1,
    inputSchema: [
      {
        name: 'baseURL',
        type: 'text',
        required: true,
      },
      {
        name: 'inputPath',
        type: 'text',
        required: true,
      },
      {
        name: 'keepOriginal',
        type: 'checkbox',
        required: true,
      },
      {
        name: 'originalID',
        type: 'text',
        required: true,
      },
      {
        name: 'originalData',
        type: 'json',
        required: true,
      },
      {
        name: 'resolutions',
        type: 'array',
        required: true,
        fields: [
          { name: 'size', type: 'number', required: true },
          { name: 'bitrate', type: 'number', required: true },
        ],
      },
      {
        name: 'segmentDuration',
        type: 'number',
        required: true,
      },
      {
        name: 'inputCollectionSlug',
        type: 'text',
        required: true,
      },
      {
        name: 'outputCollectionSlug',
        type: 'text',
        required: true,
      },
    ],
    outputSchema: [
      {
        name: 'success',
        type: 'checkbox',
        required: true,
      },
      {
        name: 'error',
        type: 'json',
      },
    ],
    onFail: async () => {
      fetch(`${options.serverURL}/api/run-next-process-video`, { method: 'GET' })
    },
    onSuccess: async () => {
      fetch(`${options.serverURL}/api/run-next-process-video`, { method: 'GET' })
    },
    handler: async ({ input, req }) => {
      const { payload } = req

      console.log('input', input)
      if (!input) {
        return {
          output: {},
        }
      }

      const output = await processVideoHandler(payload, input as ProcessVideoParams)

      return {
        output,
      }
    },
  }
  return processVideoConfig
}
