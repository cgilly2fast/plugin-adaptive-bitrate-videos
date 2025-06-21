import { spawn } from 'child_process'

let serverProcess = null

export async function setup() {
  console.log('Starting server for integration tests...')
  
  // Start the server
  serverProcess = spawn('pnpm', ['dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PAYLOAD_PUBLIC_SERVER_URL: 'http://localhost:3000',
      PORT: '3000'
    }
  })

  // Wait for server to start
  console.log('Waiting for server to be ready...')
  await new Promise(resolve => setTimeout(resolve, 30000))
  console.log('Server should be ready for tests')
}

export async function teardown() {
  if (serverProcess) {
    console.log('Stopping server...')
    serverProcess.kill('SIGTERM')
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
}