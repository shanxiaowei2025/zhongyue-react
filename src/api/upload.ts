import request from './request'

interface UploadResponse {
  code: number // 状态码，0表示成功
  data: {
    fileName: string // 文件名
    url: string // 文件访问 URL
  }
  message: string // 响应消息
  timestamp: number // 时间戳
}

/**
 * 上传文件到服务器
 * @param file 文件对象
 * @param directory 目录
 */
export const uploadFile = async (
  file: File,
  directory: string = ''
): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  if (directory) {
    formData.append('directory', directory);
  }
  
  return request.post<UploadResponse>('/storage/upload', formData);
}
