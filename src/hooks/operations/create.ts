        export function create() {
        { id, filename, mimeType, url, createdAt, updatedAt, ...data } = result as any
        if (!mimeType.startsWith('video/')) {
            return result
        }

        const baseURL = req.payload.config.serverURL.replace(/\/$/, '')
        setTimeout(async () => {
            console.log('Processing video url:', url)
            fetch(`${baseURL}/api/process-video`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    baseURL,
                    inputPath: url,
                    keepOriginal,
                    originalID: id,
                    originalData: data,
                    resolutions,
                    segmentDuration,
                    inputCollectionSlug: collection.slug,
                    outputCollectionSlug,
                }),
            })
        }, 1000)
        }
