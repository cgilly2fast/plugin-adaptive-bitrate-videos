import { buildConfig } from 'payload/config'
import path from 'path'
import Users from './collections/Users'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { webpackBundler } from '@payloadcms/bundler-webpack'
import { slateEditor } from '@payloadcms/richtext-slate'
import { samplePlugin } from '../../src/index'
import { Media } from './collections/Media'

export default buildConfig({
    admin: {
        user: Users.slug,
        bundler: webpackBundler(),
        webpack: config => {
            const newConfig = {
                ...config,
                resolve: {
                    ...config.resolve,
                    alias: {
                        ...(config?.resolve?.alias || {}),
                        react: path.join(__dirname, '../node_modules/react'),
                        'react-dom': path.join(__dirname, '../node_modules/react-dom'),
                        payload: path.join(__dirname, '../node_modules/payload'),
                    },
                },
            }
            return newConfig
        },
    },
    editor: slateEditor({}),
    collections: [Users, Media],
    serverURL: process.env.SERVER_URL,
    typescript: {
        outputFile: path.resolve(__dirname, 'payload-types.ts'),
    },
    graphQL: {
        schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
    },
    plugins: [samplePlugin({ enabled: true, collections: { media: { keepOriginal: true } } })],
    db: mongooseAdapter({
        url: process.env.DATABASE_URI!,
    }),
})
