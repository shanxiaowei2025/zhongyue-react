import type { Customer, ImageType } from '../types'
import { buildImageUrl } from './upload'

// 处理客户表单中的图片数据
export const processCustomerImages = (formData: any): Partial<Customer> => {
  const processedData: Partial<Customer> = { ...formData }

  // 处理法人身份证照片
  if (formData.legalPersonIdImages) {
    processedData.legalPersonIdImages = {
      front: formData.legalPersonIdImages.front,
      back: formData.legalPersonIdImages.back,
    }
  }

  // 处理营业执照照片
  if (formData.businessLicenseImages) {
    processedData.businessLicenseImages = {
      main: formData.businessLicenseImages.main,
      copy: formData.businessLicenseImages.copy,
    }
  }

  // 处理开户许可证照片
  if (formData.bankAccountLicenseImages) {
    processedData.bankAccountLicenseImages = {
      basic: formData.bankAccountLicenseImages.basic,
      general: formData.bankAccountLicenseImages.general,
    }
  }

  // 处理其他人员身份证照片
  if (formData.otherIdImages) {
    // 如果已经是对象格式则保留，否则进行转换
    if (typeof formData.otherIdImages === 'object' && !Array.isArray(formData.otherIdImages)) {
      const processedOtherIdImages: Record<string, ImageType> = {}

      Object.entries(formData.otherIdImages).forEach(([key, value]) => {
        // 处理不同的数据格式情况
        if (value && typeof value === 'object' && 'url' in value) {
          // 已经是ImageType格式
          processedOtherIdImages[key] = value as ImageType
        } else if (typeof value === 'string') {
          // 字符串URL格式，转换为ImageType
          processedOtherIdImages[key] = { 
            fileName: extractFileNameFromUrl(value as string),
            url: value as string 
          }
        }
      })

      processedData.otherIdImages = processedOtherIdImages
    }
  }

  // 处理补充资料照片
  if (formData.supplementaryImages) {
    // 如果已经是对象格式则保留，否则进行转换
    if (
      typeof formData.supplementaryImages === 'object' &&
      !Array.isArray(formData.supplementaryImages)
    ) {
      const processedSupplementaryImages: Record<string, ImageType> = {}

      Object.entries(formData.supplementaryImages).forEach(([key, value]) => {
        // 处理不同的数据格式情况
        if (value && typeof value === 'object' && 'url' in value) {
          // 已经是ImageType格式
          processedSupplementaryImages[key] = value as ImageType
        } else if (typeof value === 'string') {
          // 字符串URL格式，转换为ImageType
          processedSupplementaryImages[key] = { 
            fileName: extractFileNameFromUrl(value as string),
            url: value as string 
          }
        }
      })

      processedData.supplementaryImages = processedSupplementaryImages
    }
  }

  return processedData
}

// 从URL中提取文件名
function extractFileNameFromUrl(url: string): string {
  if (!url) return ''
  
  try {
    // 检查是否已经是使用MinIO拼接的URL，解析出文件名
    const minioEndpoint = import.meta.env.MINIO_ENDPOINT || 'https://zhongyue-minio-api.starlogic.tech'
    if (url.startsWith(minioEndpoint)) {
      // 从URL中提取路径的最后一部分作为文件名
      const parts = url.split('/')
      return parts[parts.length - 1].split('?')[0] // 移除查询参数
    }
    
    // 从URL路径中提取文件名
    const urlParts = url.split('/')
    const fileNameWithParams = urlParts[urlParts.length - 1]
    const fileName = fileNameWithParams.split('?')[0] // 移除查询参数
    
    return fileName
  } catch (e) {
    console.error('提取文件名错误:', e)
    return ''
  }
}

// 处理图片值，确保返回适当的格式
function processImageValue(value: any): string {
  if (value && typeof value === 'object' && 'url' in value) {
    return value.url
  }
  return value as string
}
