import { buildConfig, Plugin } from 'payload'
import path from 'path'
import Users from './collections/Users.js'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { testEmailAdapter } from './helpers/testEmailAdapter.js'

import { abrVideos } from '../src/index.js'
import { Media } from './collections/Media.js'
import { Videos } from './collections/Videos.js'
// import { gcsStorage } from '@payloadcms/storage-gcs'
import { OverrideSegments } from './collections/OverrideSegments.js'

const sanitizePrivateKey = (key: any) => {
  if (typeof key !== 'string') return ''

  return key.replace(/\\n/g, '\n')
}

export const serviceAccount = {
  type: process.env.SERVICE_ACCOUNT_TYPE!,
  projectId: process.env.SERVICE_ACCOUNT_PROJECT_ID,
  private_key_id: process.env.SERVICE_ACCOUNT_PRIVATE_KEY_ID,
  private_key: sanitizePrivateKey(process.env.SERVICE_ACCOUNT_PRIVATE_KEY),
  client_email: process.env.SERVICE_ACCOUNT_CLIENT_EMAIL,
  client_id: process.env.SERVICE_ACCOUNT_CLIENT_ID,
  auth_uri: process.env.SERVICE_ACCOUNT_AUTH_URL,
  token_uri: process.env.SERVICE_ACCOUNT_TOKEN_URL,
  auth_provider_x509_cert_url: process.env.SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.SERVICE_ACCOUNT_CLIENT_X509_CERT_URL,
  universe_domain: process.env.SERVICE_ACCOUNT_UNIVERSE_DOMAIN,
}

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (!process.env.ROOT_DIR) {
  process.env.ROOT_DIR = dirname
}

const buildConfigWithMemoryDB = async () => {
  if (process.env.NODE_ENV === 'test' && !process.env.DATABASE_URI) {
    const memoryDB = await MongoMemoryReplSet.create({
      replSet: {
        count: 3,
        dbName: 'payloadmemory',
      },
    })

    process.env.DATABASE_URI = `${memoryDB.getUri()}&retryWrites=true`
  }
  return buildConfig({
    admin: {
      user: Users.slug,
    },
    cors: '*',
    serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
    editor: lexicalEditor(),
    collections: [Users, Media, Videos],

    db: mongooseAdapter({
      url: process.env.DATABASE_URI!,
      transactionOptions: process.env.NODE_ENV === 'test' ? false : undefined,
    }),
    email: testEmailAdapter,
    plugins: [
      abrVideos({
        enabled: true,
        collections: {
          media: {
            keepOriginal: true,
            resolutions: [
              { size: 480, bitrate: 1000 },
              { size: 720, bitrate: 1500 },
              { size: 1080, bitrate: 4000 },
              { size: 1440, bitrate: 6000 },
              { size: 2160, bitrate: 10000 },
            ],
            segmentDuration: 2,
          },
          videos: {
            keepOriginal: true,
            resolutions: [
              { size: 144, bitrate: 150 },
              { size: 240, bitrate: 250 },
              { size: 300, bitrate: 500 },
            ],
            segmentDuration: 1,
          },
        },
        segmentsOverrides: OverrideSegments,
      }),
      // gcsStorage({
      //   options: {
      //     credentials: serviceAccount,
      //   },
      //   bucket: process.env.PAYLOAD_PUBLIC_FB_SB!,
      //   collections: {
      //     media: {
      //       prefix: 'media',
      //       disableLocalStorage: true,
      //     },
      //     segments: {
      //       prefix: 'segments',
      //       disableLocalStorage: true,
      //     },
      //   },
      // }),
    ],
    upload: {
      limits: {
        fileSize: 50000000, // 500MB, written in bytes
      },
    },
    secret: process.env.PAYLOAD_SECRET || '',
    sharp,
    typescript: {
      outputFile: path.resolve(dirname, 'payload-types.ts'),
    },
  })
}

export default buildConfigWithMemoryDB()
