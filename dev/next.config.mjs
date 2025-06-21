import { withPayload } from '@payloadcms/next/withPayload'
import { fileURLToPath } from 'url'
import path from 'path'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    // Externalize ffmpeg packages to avoid bundling issues
    webpackConfig.externals = webpackConfig.externals || []
    webpackConfig.externals.push({
      '@ffmpeg-installer/ffmpeg': 'commonjs @ffmpeg-installer/ffmpeg',
      'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
    })

    return webpackConfig
  },
  serverExternalPackages: ['mongodb-memory-server', '@ffmpeg-installer/ffmpeg', 'fluent-ffmpeg'],
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
