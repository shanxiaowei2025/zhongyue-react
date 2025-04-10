/**
 * 获取 MinIO 文件的完整访问 URL
 * @param path 文件路径
 * @returns 完整的文件访问 URL
 */
export const getMinioUrl = (path: string): string => {
  if (!path) return ''

  // 如果已经是完整的 URL，直接返回
  if (path.startsWith('http')) {
    return path
  }

  // 根据环境变量获取 MinIO 域名和存储桶
  const minioDomain = import.meta.env.VITE_MINIO_DOMAIN
  const minioBucket = import.meta.env.VITE_MINIO_BUCKET

  return `${minioDomain}/${minioBucket}/${path}`
}

/**
 * 从完整 URL 中提取文件路径
 * @param url 完整的文件 URL
 * @returns 文件路径
 */
export const extractPathFromUrl = (url: string): string => {
  if (!url) return ''

  const minioDomain = import.meta.env.VITE_MINIO_DOMAIN
  const minioBucket = import.meta.env.VITE_MINIO_BUCKET

  // 移除域名和存储桶部分
  return url.replace(`${minioDomain}/${minioBucket}/`, '')
}

/**
 * 检查 URL 是否是 MinIO URL
 * @param url 要检查的 URL
 * @returns 是否是 MinIO URL
 */
export const isMinioUrl = (url: string): boolean => {
  if (!url) return false
  const minioDomain = import.meta.env.VITE_MINIO_DOMAIN
  return url.startsWith(minioDomain)
}
