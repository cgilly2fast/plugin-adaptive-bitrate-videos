export const getUploadFileURL = (baseURL: string, collectionSlug: string, filename: string) => {
  return `${baseURL}/api/${collectionSlug}/file/${filename}`
}
