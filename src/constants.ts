// 业务状态映射
export const BUSINESS_STATUS_MAP = {
  normal: '正常',
  terminated: '终止',
  suspended: '暂停',
} as const

// 企业状态映射
export const ENTERPRISE_STATUS_MAP = {
  active: '正常经营',
  inactive: '停业',
  pending: '待处理',
} as const

// 业务状态颜色映射
export const BUSINESS_STATUS_COLOR_MAP = {
  normal: 'success',
  terminated: 'error',
  suspended: 'warning',
} as const

// 企业状态颜色映射
export const ENTERPRISE_STATUS_COLOR_MAP = {
  active: 'success',
  inactive: 'error',
  pending: 'processing',
} as const

// 其他常量
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 // 5MB
export const UPLOAD_ACCEPT_TYPES = 'image/jpeg,image/png,image/gif'
