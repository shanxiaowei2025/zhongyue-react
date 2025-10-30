// 业务选项类型定义

export interface BusinessOption {
  id: number
  category: string // 业务选项类别，如 'change_business', 'administrative_license' 等
  optionValue: string // 选项的值
  isDefault: boolean // 是否为默认选项
  createdBy?: string // 创建人
  createdAt?: string // 创建时间
  updatedAt?: string // 更新时间
}

export interface CreateBusinessOptionDto {
  category: string
  optionValue: string
  isDefault?: boolean
}

export interface UpdateBusinessOptionDto {
  optionValue?: string
  isDefault?: boolean
}

export interface BusinessOptionQueryParams {
  category?: string
  isDefault?: boolean
  page?: number
  pageSize?: number
}

// 业务选项类别枚举
export enum BusinessOptionCategory {
  CHANGE_BUSINESS = 'change_business', // 变更业务
  ADMINISTRATIVE_LICENSE = 'administrative_license', // 行政许可
  OTHER_BUSINESS_BASIC = 'other_business_basic', // 其他业务（基础）
  OTHER_BUSINESS_OUTSOURCING = 'other_business_outsourcing', // 其他业务
  OTHER_BUSINESS_SPECIAL = 'other_business_special', // 其他业务（特殊）
}

