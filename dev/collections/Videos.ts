import type { CollectionConfig } from 'payload'

export const Videos: CollectionConfig = {
    slug: 'videos',
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
        },
    ],
    upload: true,
}
