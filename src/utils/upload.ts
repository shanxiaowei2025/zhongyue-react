import { message } from 'antd'

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

// 上传文件
export const uploadFile = async (file: File): Promise<{ fileName: string; url: string } | null> => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    // 从localStorage获取token
    const token = localStorage.getItem('token')

    const response = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      throw new Error(`上传失败: ${response.statusText}`)
    }

    const result: UploadResponse = await response.json()

    if (result.code === 0) {
      return {
        fileName: result.data.fileName,
        url: ensureRelativeUrl(result.data.url),
      }
    } else {
      message.error(result.message || '上传失败')
      return null
    }
  } catch (error) {
    console.error('文件上传错误:', error)
    message.error('文件上传失败')
    return null
  }
}

// 确保URL是相对路径
function ensureRelativeUrl(url: string): string {
  if (!url) return ''

  try {
    // 检查是否为Minio服务器上的URL
    if (
      url.includes('zhongyue-minio-api.starlogic.tech') ||
      url.includes('minio') ||
      url.includes('X-Amz-Algorithm')
    ) {
      // 外部托管的图片，直接返回完整URL
      console.log('检测到 Minio 图片:', url)
      return url
    }

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

    console.log('删除文件:', processedFileName)

    // 从localStorage获取token
    const token = localStorage.getItem('token')

    const response = await fetch(`/api/storage/files/${processedFileName}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })

    if (!response.ok) {
      throw new Error(`删除失败: ${response.statusText}`)
    }

    const result: DeleteResponse = await response.json()

    if (result.code === 0) {
      return true
    } else {
      message.error(result.message || '删除失败')
      return false
    }
  } catch (error) {
    console.error('文件删除错误:', error)
    message.error('文件删除失败')
    return false
  }
}
