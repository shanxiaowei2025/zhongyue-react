import type { Customer } from '../types'

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
      const processedOtherIdImages: Record<string, string> = {}

      Object.entries(formData.otherIdImages).forEach(([key, value]) => {
        processedOtherIdImages[key] = processImageValue(value)
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
      const processedSupplementaryImages: Record<string, string> = {}

      Object.entries(formData.supplementaryImages).forEach(([key, value]) => {
        processedSupplementaryImages[key] = processImageValue(value)
      })

      processedData.supplementaryImages = processedSupplementaryImages
    }
  }

  return processedData
}

// 处理单个图片值，提取url
function processImageValue(value: any): string {
  if (!value) return ''

  // 如果已经是字符串，直接返回
  if (typeof value === 'string') return value

  // 如果是包含url的对象，返回url
  if (typeof value === 'object' && value !== null) {
    if ('url' in value) {
      // 返回完整URL
      return value.url
    }
    if ('fileName' in value && 'url' in value) {
      // 返回完整URL
      return value.url
    }
  }

  return ''
}
