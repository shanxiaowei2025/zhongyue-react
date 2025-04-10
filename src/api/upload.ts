interface UploadUrlResponse {
  success: boolean
  data: {
    url: string // 预签名上传 URL
    path: string // 对象存储路径
    file_url: string // 完整的文件访问 URL
    expires_in: number // URL 过期时间(秒)
  }
  message?: string
}

/**
 * 获取文件上传预签名 URL
 * @param filename 文件名
 * @param directory 目录
 */
export const getUploadUrl = async (
  filename: string,
  directory: string = ''
): Promise<UploadUrlResponse> => {
  const response = await fetch('/api/upload/url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename,
      directory,
    }),
  })
  return response.json()
}
