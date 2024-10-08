import express from 'express'
import payload from 'payload'
import { InitOptions } from 'payload/config'

require('dotenv').config()
const app = express()

app.get('/', (_, res) => {
    res.redirect('/admin')
})

const PORT = 3000
export const start = async (args?: Partial<InitOptions>) => {
    await payload.init({
        secret: process.env.PAYLOAD_SECRET,
        express: app,
        onInit: async () => {
            payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`)
        },
        ...(args || {}),
    })

    return app.listen(PORT)
}

if (require.main === module) {
    start()
}
