import { spawn } from 'child_process'
import { MongoMemoryReplSet } from 'mongodb-memory-server'
import http from 'http'

let serverProcess = null
let memoryDB = null

export async function setup() {
  console.log('Starting memory DB and server for integration tests...')

  memoryDB = await MongoMemoryReplSet.create({
    replSet: {
      count: 3,
      dbName: 'payloadmemory',
    },
  })
  const databaseUri = `${memoryDB.getUri()}&retryWrites=true`
  process.env.DATABASE_URI = databaseUri

  serverProcess = spawn('pnpm', ['dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PAYLOAD_PUBLIC_SERVER_URL: 'http://localhost:3000',
      PORT: '3000',
      DATABASE_URI: databaseUri
    }
  })

  console.log('Waiting for Next.js server to be ready on port 3000...')
  await new Promise((resolve, reject) => {
    let retries = 0
    const interval = setInterval(() => {
      http.get('http://localhost:3000/api/graphql', (res) => {
        clearInterval(interval)
        resolve()
      }).on('error', (err) => {
        retries++
        if (retries > 60) {
          clearInterval(interval)
          reject(new Error('Server failed to start in time'))
        }
      })
    }, 1000)
  })
  console.log('Server is ready for tests')
}

export async function teardown() {
  if (serverProcess) {
    console.log('Stopping server...')
    serverProcess.kill('SIGTERM')
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  if (memoryDB) {
    await memoryDB.stop()
  }
}