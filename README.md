# Payload Adaptive Bitrate Videos Plugin
This plugin extends Payload CMS to provide Adaptive Bitrate (ABR) streaming capabilities for uploaded video files. It automatically processes video uploads, creates segment playlists for multiple resolution versions, generates HLS manifests, and updates the collection with the master manifest file location.

### Features

- Automatic video processing on upload
- Multiple resolution transcoding (144p to 4K, define custom sizes/bitrates)
- HLS playlist and master manifest generation
- Flexible storage integration (Local, AWS S3, Google Cloud Storage, Azure Blob Storage)

## Installation

`yarn add plugin-adaptive-bitrate-videos` or `npm install plugin-adaptive-bitrate-videos`

## Usage

Add this package into your dependencies executing this code in your command line:

`yarn add plugin-adaptive-bitrate-videos`

Now install this plugin within your Payload as follows:

```ts
//payload.config.ts
import { buildConfig } from 'payload/config'
import path from 'path'
import { adaptiveBirateVideos } from 'plugin-adaptive-bitrate-videos`'

export default buildConfig({
	serverUrl: 'https://example.com' // Must be set to use pluggin
	plugins: [
		adaptiveBirateVideos({
			  collections: {
				  'my-collection-slug': {keepOrginal: true} 
			  }
		})
	]
  // The rest of your config goes here
})
```

See [Payload config options](https://payloadcms.com/docs/configuration/overview#options) for documentation on setting serverUrl in Payload config.

### Cloud Storage Plugin
This plugin can be used with the Payload Cloud Storage Plugin to store you segments and manifest files.  `cloudStorage` is [CollectionOptions](https://github.com/payloadcms/plugin-cloud-storage/blob/c4a492a62abc2f21b4cd6a7c97778acd8e831212/src/types.ts#L48) object from [Payload Cloud Plugin Collection specific options.](https://github.com/payloadcms/payload/tree/main/packages/plugin-cloud-storage#plugin-options)

```ts
//payload.config.ts
import { buildConfig } from 'payload/config'
import path from 'path'
import { adaptiveBirateVideos } from 'plugin-adaptive-bitrate-videos'
import { gcsAdapter } from '@payloadcms/plugin-cloud-storage/gcs'

const adapter = gcsAdapter({
  options: {
    // you can choose any method for authentication, and authorization which is being provided by `@google-cloud/storage`
    keyFilename: './gcs-credentials.json',
    //OR
    credentials: JSON.parse(process.env.GCS_CREDENTIALS || '{}'), // this env variable will have stringify version of your credentials.json file
  },
  bucket: process.env.GCS_BUCKET,
})
// Now you can pass this adapter to the plugin

export default buildConfig({
	serverUrl: 'https://example.com' // Must be set to use pluggin
	plugins: [
    adaptiveBirateVideos({
			  collections: {
				  'my-collection-slug': {keepOrginal: true} 
			  }
			  cloudStorage: {
				  adapter: adapter
			  }
		})
		cloudStorage({ // Cloud storage plugin must come after plugin
	      collections: {
	        'my-collection-slug': {
            // see docs for the adapter you want to use
	          adapter: adapter, 
	        },
          'segments': { //the output collection created by the plugin
	          adapter: adapter, 
	        },
	      },
	    }),
		
	]
  // The rest of your config goes here
})
```

### Custom Sizes And Bitrates
If not resolutions array is provide, the plugin will use the default resolutions and bit rates. `size` specifies the pixel size of the short side of the video so the aspect ratio of any input video is maintained. 

For Example: if you input a 4k 16:9 video (The standard landscape video aspect ratio), the plugin will change the video's height to and allow the width to proportionally change. 

For the 1080 output the resulting video will be 1080p x 1920p, the standard 1080p pixel size.

The principle is followed for square and portrait videos.

_Note: The plugin will only output segments for resolutions that are less than or equal to the short side of the video. Meaning no upscaling is conducted. Example: a 1080p video will only produce output segments at resolutions that are specifed less than or eqaul to 1080._

```ts
//payload.config.ts
import { buildConfig } from 'payload/config'
import path from 'path'
import { adaptiveBirateVideos } from 'plugin-adaptive-bitrate-videos`'

export default buildConfig({
	serverUrl: 'https://example.com' // Must be set to use pluggin
	plugins: [
		adaptiveBirateVideos({
			  collections: {
				'my-collection-slug': 
					{ 
						keepOrginal: true,
						resolutions: [
							{
								size: 1080 // pixel size 
								bitrate: 8000000 // kilobits per second
							},
							// ...more custom resolutions
							]
					} 
			  }
		})
	]
  // The rest of your config goes here
})
```

### Conditionally Enabling/Disabling

The proper way to conditionally enable/disable this plugin is to use the `enabled` property.

```ts
//payload.config.ts
adaptiveBirateVideos({
  enabled: process.env.MY_CONDITION === 'true',
  collections: {
	  'media': {keepOrginal: true}
  }
}),
```
If the code is included _in any way in your config_ but conditionally disabled in another fashion, you may run into issues such as `Webpack Build Error: Can't Resolve 'fs' and 'stream'` or similar because the plugin must be run at all times in order to properly extend the webpack config.

### Segments Collection Override
Override anything on the `segments` collection by sending a [Payload Collection Config](https://payloadcms.com/docs/configuration/collections) to the `segmentsOverrides` property.

```ts
// payload.config.ts
adaptiveBirateVideos({
	// ...
	segementOverrides: {
		slug: "contact-forms",
		access: {
			read: () => true,
			update: () => false,
		},
		fields: [
			{
			name: "custom-field",
			type: "text"
			}]
		}
})
```

### Custom Segment Length
Optionally set the length of the segments the source video will be divided into. Default length is 2 seconds. The property takes in an number representing seconds.

```ts
// payload.config.ts
adaptiveBirateVideos({
	// ...
	segmentLength: 5 //seconds. Default is 2 seconds.
})
```

## Plugin options

This plugin is configurable to work across many different Payload collections. A `*` denotes that the property is required.

| Option              | Type                                                                                                                                          | Description                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `collections`*      | Records<string,[CollectionOptions]()>                                                                                                         | Object with keys set to the slug of collections you want to enable the plugin for, and values set to collection-specific options. |
| `cloudStorage`      | [StorageCollectionOptions](https://github.com/payloadcms/plugin-cloud-storage/blob/c4a492a62abc2f21b4cd6a7c97778acd8e831212/src/types.ts#L48) | Object with values set to storage options defining upload behavior.                                                               |
| `enabled`           | `boolean`                                                                                                                                     | Conditionally enable/disable plugin. Default: true.<br>                                                                           |
| `segmentLength`     | `number`                                                                                                                                      | Set the output segment length in seconds for each resolution output. Default: 2                                                   |
| `segementOverrides` | [PayloadCollectionConfig](https://payloadcms.com/docs/configuration/collections)                                                              | Object that overrides the default collection used to store reference to the output segments. Default: SegmentOverrideDefault      |

**Collection-specific options:**

| Option         | Type                | Description                                                                                    |
| -------------- | ------------------- | ---------------------------------------------------------------------------------------------- |
| `keepOrginal`* | `boolean`           | Conditionally set to keep the original source file after processing.                           |
| `resolutions`  | `Array<Resolution>` | Set custom resolutions for the plugin to output segment videos to. Default: ResolutionsDefault |

#### SegmentOverrideDefault

```ts
const SegmentOverrideDefault = {
	slug: "segments",
	labels: { singular: 'ABR Segment', plural: 'ABR Segments' },
	access: {
		read: () => true,
		update: () => false,
	},
	upload: true,
	fields: []
}
```

#### ResolutionsDefault
```ts
const ResolutionsDefault = [
	{
		size: 144,
		bitrate: 500000
	},
	{
		size: 240,
		bitrate: 800000
	},
	{
		size: 360,
		bitrate: 1000000
	},
	{
		size: 480,
		bitrate: 2500000
	},
	{
		size: 720,
		bitrate: 5000000
	},
	{
		size: 1080,
		bitrate: 8000000
	},
	{
		size: 1440,
		bitrate: 16000000
	},
	{
		size: 2160,
		bitrate: 35000000
	},
]
```

## Memory Considerations
To run the this plugin, you will need to run your Payload server on a machine that can comfortably storage 2x the max video upload size. 

This is required because the source video needs to be temporally stored and the output segments need to be temporally stored before being saved in your final destination.

See Payload Documentation on [upload limits here](https://payloadcms.com/docs/upload/overview#payload-wide-upload-options).

## Questions

Please open an issue on this repo with any questions or issues about using this plugin.
