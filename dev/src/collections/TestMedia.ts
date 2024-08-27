import type { CollectionConfig } from 'payload/types'

export const TestMedia: CollectionConfig = {
    slug: 'test-media',
    access: {
        read: () => true,
        update: () => true,
        create: () => true,
        delete: () => true,
    },
    fields: [
        {
            name: 'alt',
            type: 'text',
            required: true,
        },
    ],
    upload: true,
}
