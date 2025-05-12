// 业务状态映射
export const BUSINESS_STATUS_MAP = {
  normal: '正常',
  logged_out: '已注销',
  logging_out: '注销中',
  lost: '已流失',
  waiting_transfer: '等待转出',
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
  logged_out: 'error',
  logging_out: 'warning',
  lost: 'error',
  waiting_transfer: 'processing',
} as const

// 企业状态颜色映射
export const ENTERPRISE_STATUS_COLOR_MAP = {
  active: 'success',
  inactive: 'error',
  pending: 'processing',
} as const

// 其他常量
export const MAX_UPLOAD_SIZE = Number.MAX_SAFE_INTEGER // 不限制上传大小
export const UPLOAD_ACCEPT_TYPES = 'image/jpeg,image/png,image/gif'
