import { PayloadHandler, PayloadRequest } from 'payload'

export const getRunNextProcessVideoJob =
  (queueName: string, maxJobs: number): PayloadHandler =>
  async (req: PayloadRequest) => {
    const { payload } = req
    const { totalDocs: totalRunningJobs } = await payload.count({
      collection: 'payload-jobs',
      where: {
        queue: {
          equals: queueName,
        },
        processing: {
          equals: true,
        },
        hasError: {
          equals: false,
        },
      },
      overrideAccess: true,
    })

    if (totalRunningJobs < maxJobs) {
      payload.jobs.run({
        queue: queueName,
        limit: 1,
        overrideAccess: true,
      })
    }

    return Response.json({})
  }
