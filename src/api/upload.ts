import request from './request'

interface UploadResponse {
  success: boolean
  data: {
    url: string // 文件访问 URL
    path: string // 对象存储路径
  }
  message?: string
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
