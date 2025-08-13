import request from './request'
import type { ApiResponse, PaginationParams } from '../types'

// 档案查询接口响应数据类型
export interface ArchiveSearchResult {
  companyName?: string
  unifiedSocialCreditCode?: string
  sealStorageNumber?: string
  onlineBankingArchiveNumber?: string
  paperArchiveNumber?: string
  archiveStorageRemarks?: string
}

// 档案查询参数类型
export interface ArchiveSearchParams extends Partial<PaginationParams> {
  companyName?: string
  unifiedSocialCreditCode?: string
}

// 档案查询API - 根据企业名称或统一社会信用代码查询档案存放信息
export const searchArchive = (params: ArchiveSearchParams) => {
  // 档案查询参数处理

  // 构建查询字符串，过滤空值
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value))
    }
  })

  const queryString = queryParams.toString()
  // 档案查询URL构建完成

  return request.get<ApiResponse<ArchiveSearchResult[]>>(`/customer/archive/search?${queryString}`)
}
