import { message } from 'antd'
import request from '../api/request'
import axios from 'axios'

// 获取与request相同的baseURL
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'

interface UploadResponse {
  data: {
    fileName: string
    url: string
  }
  code: number
  message: string
  timestamp: number
}

interface DeleteResponse {
  data: {
    message: string
  }
  code: number
  message: string
  timestamp: number
}

/**
 * 上传文件到服务器
 * @param file 要上传的文件
 * @returns 上传成功后的文件信息 { fileName, url }
 */
export const uploadFile = async (file: File): Promise<{ fileName: string; url: string } | null> => {
  if (!file) return null

  const formData = new FormData()
  formData.append('file', file)

  try {
    // 从localStorage获取token
    const token = localStorage.getItem('token')

    // 使用axios实例，但不通过request工具函数，因为需要设置特殊的Content-Type
    const response = await axios({
      method: 'POST',
      url: '/storage/upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      baseURL: apiBaseUrl,
    })

    const result: UploadResponse = response.data

    if (result.code === 0) {
      const fileName = result.data.fileName || ''
      return {
        fileName,
        url: buildImageUrl(fileName),
      }
    } else {
      message.error(result.message || '上传失败')
      return null
    }
  } catch (error: any) {
    console.error('文件上传错误:', error)
    message.error(error.response?.data?.message || '文件上传失败')
    return null
  }
}

// 确保URL是相对路径
function ensureRelativeUrl(url: string): string {
  if (!url) return ''

  try {
    // 检查是否为完整的URL（包含http或https协议）
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // 尝试转换为相对路径
      const urlObj = new URL(url)
      // 如果是同域名下的URL，返回路径部分
      if (urlObj.hostname === window.location.hostname) {
        return urlObj.pathname
      }
      // 其他外部URL，保持完整URL
      return url
    }
    // 如果已经是相对路径，直接返回
    return url
  } catch (e) {
    // URL解析出错，原样返回
    console.error('URL解析错误:', e, url)
    return url
  }
}

// 删除文件
export const deleteFile = async (fileName: string): Promise<boolean> => {
  try {
    // 处理复杂的文件名，例如完整URL中的文件名
    let processedFileName = fileName

    // 如果是完整URL，提取文件名
    if (fileName.includes('/')) {
      // 获取URL中的最后一个路径部分
      const parts = fileName.split('/')
      const lastPart = parts[parts.length - 1]

      // 如果有查询参数，去掉查询参数
      if (lastPart.includes('?')) {
        processedFileName = lastPart.split('?')[0]
      } else {
        processedFileName = lastPart
      }
    }

    // 使用request.delete方法
    const result = await request.delete<DeleteResponse>(`/storage/files/${processedFileName}`)

    return result.code === 0
  } catch (error: any) {
    console.error('文件删除错误:', error)
    message.error(error.response?.data?.message || '文件删除失败')
    return false
  }
}

/**
 * 构建图片完整URL
 * 将文件名与MinIO服务器地址和存储桶名称拼接
 * @param fileName 图片文件名
 * @returns 完整的图片URL
 */
export const buildImageUrl = (fileName: string | any): string => {
  // 如果fileName为空或不是字符串，返回空字符串
  if (!fileName) return ''

  // 确保fileName是字符串类型
  const fileNameStr =
    typeof fileName === 'string'
      ? fileName
      : fileName.fileName
        ? fileName.fileName
        : fileName.url
          ? fileName.url
          : String(fileName)

  // 从环境变量获取MinIO配置
  const endpoint = import.meta.env.MINIO_ENDPOINT || 'https://zhongyue-minio-api.starlogic.tech'
  const bucketName = import.meta.env.MINIO_BUCKET_NAME || 'zhongyue'

  // 确保endpoint末尾有斜杠
  const baseUrl = endpoint.endsWith('/') ? endpoint : `${endpoint}/`

  // 确保fileName开头没有斜杠
  const cleanFileName = fileNameStr.startsWith('/') ? fileNameStr.substring(1) : fileNameStr

  // 拼接完整URL
  return `${baseUrl}${bucketName}/${cleanFileName}`
}
