import type { Payload } from 'payload'
import { getPayload } from 'payload'
import fs from 'fs'
import { promises as fsPromises } from 'fs'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const waitFor = async (assertion: () => Promise<void>, timeout = 120_000) => {
  const startedAt = Date.now()
  let lastError: unknown

  while (Date.now() - startedAt < timeout) {
    try {
      await assertion()
      return
    } catch (error) {
      lastError = error
      await wait(1000)
    }
  }

  throw lastError
}

describe.sequential('Plugin tests', () => {
  let payload: Payload
  let id: number | string

  beforeAll(async () => {
    console.log('Before all: Initializing Payload')
    const { default: config } = await import('./payload.config.ts')
    payload = await getPayload({ config })
    console.log('Before all: Payload initialized')
  }, 90000)

  afterAll(async () => {
    console.log('After all: Cleaning up')
    if (payload?.db?.destroy) {
      await payload.db.destroy()
    }
    try {
      await fsPromises.rm('./media', { recursive: true, force: true })
      await fsPromises.rm('./videos', { recursive: true, force: true })
      await fsPromises.rm('./override-segments', { recursive: true, force: true })
    } catch (error) {
      console.log('Cleanup error (expected):', error)
    }
    console.log('After all: Cleanup complete')
  })

  it('input media collection uploads videos', async () => {
    const testVideoBuffer = await fsPromises.readFile('./dev/mocks/testVideo.mp4')

    const createdMedia = await payload.create({
      collection: 'media',
      file: {
        data: testVideoBuffer,
        name: 'testVideo.mp4',
        mimetype: 'video/mp4',
        size: testVideoBuffer.byteLength,
      },
      data: { alt: 'Ligma Test' },
    })
    
    // Wait for hook setTimeout to fire before running jobs
    await wait(1500)
    await payload.jobs.run({
      queue: 'process-abr-videos-queue',
      limit: 1,
    })

    expect(createdMedia).toBeTruthy()
    expect(createdMedia.id).toBeDefined()
    expect(createdMedia.filename).toBe('testVideo.mp4')
    expect(createdMedia.mimeType).toBe('video/mp4')
    expect(createdMedia.filesize).toBe(testVideoBuffer.byteLength)
    expect(createdMedia.alt).toBe('Ligma Test')
  }, 80000)

  it('standard video outputs are present', async () => {
    const expectedNumSegments = 26
    
    await waitFor(async () => {
      const segments = await payload.find({
        collection: 'override-segments', // OverrideSegments alias
        where: {
          and: [
            { filename: { contains: 'testVideo-' } },
            { filename: { contains: '-segment' } },
          ],
        },
        limit: 0
      })
      expect(segments.totalDocs).toBe(expectedNumSegments)
    })
  })

  it('default resolution manifest playlists are present', async () => {
    const resolutions = [480]
    await waitFor(async () => {
      for (const res of resolutions) {
        const playlists = await payload.find({
          collection: 'override-segments',
          where: {
            filename: { contains: `testVideo-${res}p-playlist.m3u8` }
          }
        })
        expect(playlists.totalDocs).toBe(1)
      }
    })
  })

  it('saves master manifest into collection source video was upload too', async () => {
    await waitFor(async () => {
      const res = await payload.find({
        collection: 'media',
        where: {
          filename: {
            equals: 'testVideo.m3u8',
          },
        },
      })
      expect(res.docs.length).toBe(1)
      const retrievedMedia = res.docs[0]
      expect(retrievedMedia).toBeTruthy()
      expect(retrievedMedia.filename).toBe('testVideo.m3u8')
      id = retrievedMedia.id
    })
  })

  it('deletes orginal file on config', async () => {
    const res = await payload.find({
      collection: 'media',
      where: {
        filename: {
          equals: 'testVideo.mp4',
        },
      },
    })
    expect(res.docs.length).toBe(1) // media is configured to keepOriginal: true
  })

  it('video input collection uploads videos', async () => {
    const testVideoBuffer = await fsPromises.readFile('./dev/mocks/testVideo2.mp4')

    const createdMedia = await payload.create({
      collection: 'videos',
      file: {
        data: testVideoBuffer,
        name: 'testVideo2.mp4',
        mimetype: 'video/mp4',
        size: testVideoBuffer.byteLength,
      },
      data: { alt: 'Ligma Test' },
    })

    // Wait for hook setTimeout to fire before running jobs
    await wait(1500)
    // Process job
    await payload.jobs.run({
      queue: 'process-abr-videos-queue',
      limit: 1,
    })

    expect(createdMedia).toBeTruthy()
    expect(createdMedia.id).toBeDefined()
    expect(createdMedia.filename).toBe('testVideo2.mp4')
    expect(createdMedia.mimeType).toBe('video/mp4')
    expect(createdMedia.filesize).toBe(testVideoBuffer.byteLength)
    expect(createdMedia.alt).toBe('Ligma Test')
  }, 120000)

  it('custom video outputs are present', async () => {
    const resolutions = [144, 240, 300]
    const expectedNumSegments = 12
    await waitFor(async () => {
      for (const res of resolutions) {
        const segments = await payload.find({
          collection: 'override-segments',
          where: {
            filename: { contains: `testVideo2-${res}p-segment` }
          },
          limit: 0
        })
        expect(segments.totalDocs).toBe(expectedNumSegments)
      }
    })
  })

  it('custom resolution manifest playlists are present', async () => {
    const resolutions = [144, 240, 300]
    await waitFor(async () => {
      for (const res of resolutions) {
        const playlists = await payload.find({
          collection: 'override-segments',
          where: {
            filename: { contains: `testVideo2-${res}p-playlist.m3u8` }
          }
        })
        expect(playlists.totalDocs).toBe(1)
      }
    })
  })

  it('saves master manifest into custom collection source video was upload too', async () => {
    await waitFor(async () => {
      const res = await payload.find({
        collection: 'videos',
        where: {
          filename: {
            equals: 'testVideo2.m3u8',
          },
        },
      })
      expect(res.docs.length).toBe(1)
      const retrievedMedia = res.docs[0]
      expect(retrievedMedia).toBeTruthy()
      expect(retrievedMedia.filename).toBe('testVideo2.m3u8')
    })
  })

  it('keep orginal source file on config', async () => {
    const res = await payload.find({
      collection: 'videos',
      where: {
        filename: {
          equals: 'testVideo2.mp4',
        },
      },
    })
    expect(res.docs.length).toBe(1)
    const retrievedMedia = res.docs[0]
    expect(retrievedMedia).toBeTruthy()
    expect(retrievedMedia.filename).toBe('testVideo2.mp4')
  })

  it('deletes output segments when master manifest is deleted by ID', async () => {
    await payload.delete({
      collection: 'media',
      where: {
        id: {
          equals: id,
        },
      },
    })

    await waitFor(async () => {
      const deleted = await payload.find({
        collection: 'media',
        where: {
          id: {
            equals: id,
          },
        },
      })
      expect(deleted.totalDocs).toBe(0)
    })

    const resolutions = [144, 240, 360, 480, 720]
    for (const res of resolutions) {
      const segments = await payload.find({
        collection: 'override-segments',
        where: {
          filename: { contains: `testVideo-${res}p-segment` }
        },
        limit: 0
      })
      expect(segments.totalDocs).toBe(0)
      
      const playlists = await payload.find({
        collection: 'override-segments',
        where: {
          filename: { contains: `testVideo-${res}p-playlist.m3u8` }
        }
      })
      expect(playlists.totalDocs).toBe(0)
    }
  })

  it('deletes output segments when master manifest is deleted by bulk delete', async () => {
    await payload.delete({
      collection: 'videos',
      where: {
        filename: {
          equals: 'testVideo2.m3u8',
        },
      },
    })

    const resolutions = [144, 240, 300]
    for (const res of resolutions) {
      const segments = await payload.find({
        collection: 'override-segments',
        where: {
          filename: { contains: `testVideo2-${res}p-segment` }
        },
        limit: 0
      })
      expect(segments.totalDocs).toBe(0)

      const playlists = await payload.find({
        collection: 'override-segments',
        where: {
          filename: { contains: `testVideo2-${res}p-playlist.m3u8` }
        }
      })
      expect(playlists.totalDocs).toBe(0)
    }
  })
})
