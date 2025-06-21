import type { CollectionConfig } from 'payload'

export const OverrideSegments: CollectionConfig = {
  slug: 'override-segments',
  access: {
    read: () => true,
    update: () => true,
    create: () => true,
    delete: () => true,
  },
  fields: [
    {
      name: 'ligma',
      type: 'text',
    },
  ],
  upload: true,
}
