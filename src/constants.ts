// 业务状态映射
export const BUSINESS_STATUS_MAP = {
  normal: '正常',
  terminated: '终止',
  suspended: '暂停',
} as const

// 其他常量
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 // 5MB
export const UPLOAD_ACCEPT_TYPES = 'image/jpeg,image/png,image/gif'
