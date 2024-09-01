import { Server } from 'http'
import mongoose from 'mongoose'
import payload from 'payload'
import { start } from './src/server'
import fs from 'fs'
import { promises as fsPromises } from 'fs'

describe('Plugin tests', () => {
  let server: Server
  let id: number | string

  beforeAll(async () => {
    if (!server) {
      console.log('Before all: Starting server')
      server = await start()
      await new Promise(resolve => setTimeout(resolve, 70000))
      console.log('Before all: Server started')
    }
  }, 90000)

  afterAll(async () => {
    console.log('After all: Cleaning up')
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    server.close()
    await fsPromises.rmdir('./src/media')
    await fsPromises.rm('./src/videos', { recursive: true })
    await fsPromises.rmdir('./src/override-segments')
    console.log('After all: Cleanup complete')
  })

  it('input media collection uploads videos', async () => {
    const testVideoBuffer = await fsPromises.readFile('./src/mocks/testVideo.mp4')

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
    await new Promise(resolve => setTimeout(resolve, 50000))
    expect(createdMedia).toBeTruthy()
    expect(createdMedia.id).toBeDefined()
    expect(createdMedia.filename).toBe('testVideo.mp4')
    expect(createdMedia.mimeType).toBe('video/mp4')
    expect(createdMedia.filesize).toBe(testVideoBuffer.byteLength)
    expect(createdMedia.alt).toBe('Ligma Test')
  }, 70000)

  it('standard video outputs are present', () => {
    const resolutions = [144, 240, 360, 480, 720]
    const exceptedNumSegments = 13
    for (let i = 0; i < resolutions.length; i++) {
      for (let j = 0; j < exceptedNumSegments; j++) {
        expect(
          fs.existsSync(`src/override-segments/testVideo-${resolutions[i]}p-segment${j}.ts`),
        ).toBe(true)
      }
    }
  })

  it('default resolution manifest playlists are present', () => {
    const resolutions = [144, 240, 360, 480, 720]
    for (let i = 0; i < resolutions.length; i++) {
      expect(
        fs.existsSync(`./src/override-segments/testVideo-${resolutions[i]}p-playlist.m3u8`),
      ).toBe(true)
    }
  })

  it('saves master manifest into collection source video was upload too', async () => {
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

  it('deletes orginal file on config', async () => {
    const res = await payload.find({
      collection: 'media',
      where: {
        filename: {
          equals: 'testVideo.mp4',
        },
      },
    })
    expect(res.docs.length).toBe(0)
  })

  it('video input collection uploads videos', async () => {
    const testVideoBuffer = await fsPromises.readFile('./src/mocks/testVideo2.mp4')

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
    await new Promise(resolve => setTimeout(resolve, 40000))
    expect(createdMedia).toBeTruthy()
    expect(createdMedia.id).toBeDefined()
    expect(createdMedia.filename).toBe('testVideo2.mp4')
    expect(createdMedia.mimeType).toBe('video/mp4')
    expect(createdMedia.filesize).toBe(testVideoBuffer.byteLength)
    expect(createdMedia.alt).toBe('Ligma Test')
  }, 60000)

  it('custom video outputs are present', () => {
    const resolutions = [144, 240, 300]
    const exceptedNumSegments = 12
    for (let i = 0; i < resolutions.length; i++) {
      for (let j = 0; j < exceptedNumSegments; j++) {
        expect(
          fs.existsSync(`./src/override-segments/testVideo2-${resolutions[i]}p-segment${j}.ts`),
        ).toBe(true)
      }
    }
  })

  it('custom resolution manifest playlists are present', () => {
    const resolutions = [144, 240, 300]
    for (let i = 0; i < resolutions.length; i++) {
      expect(
        fs.existsSync(`./src/override-segments/testVideo2-${resolutions[i]}p-playlist.m3u8`),
      ).toBe(true)
    }
  })

  it('saves master manifest into custom collection source video was upload too', async () => {
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
      id,
    })
    await new Promise(resolve => setTimeout(resolve, 3000))

    const resolutions = [144, 240, 360, 480, 720]
    const exceptedNumSegments = 13
    for (let i = 0; i < resolutions.length; i++) {
      for (let j = 0; j < exceptedNumSegments; j++) {
        expect(
          fs.existsSync(`src/override-segments/testVideo-${resolutions[i]}p-segment${j}.ts`),
        ).toBe(false)
      }
    }
    for (let i = 0; i < resolutions.length; i++) {
      expect(
        fs.existsSync(`./src/override-segments/testVideo-${resolutions[i]}p-playlist.m3u8`),
      ).toBe(false)
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
    await new Promise(resolve => setTimeout(resolve, 3000))

    const resolutions = [144, 240, 300]
    const exceptedNumSegments = 12
    for (let i = 0; i < resolutions.length; i++) {
      for (let j = 0; j < exceptedNumSegments; j++) {
        expect(
          fs.existsSync(`src/override-segments/testVideo2-${resolutions[i]}p-segment${j}.ts`),
        ).toBe(false)
      }
    }
    for (let i = 0; i < resolutions.length; i++) {
      expect(
        fs.existsSync(`./src/override-segments/testVideo2-${resolutions[i]}p-playlist.m3u8`),
      ).toBe(false)
    }
  })
})
