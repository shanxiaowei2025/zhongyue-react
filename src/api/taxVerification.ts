import request from './request'
import type { ApiResponse } from '../types'
import type {
  TaxVerificationListResponse,
  TaxVerificationQueryParams,
  TaxVerification,
  CreateTaxVerificationDto,
} from '../types/taxVerification'

// 获取税务核查记录列表
export const getTaxVerificationList = async (
  params?: TaxVerificationQueryParams
): Promise<TaxVerificationListResponse> => {
  return request.get('/enterprise-service/tax-verification', params)
}

// 获取税务核查记录详情
export const getTaxVerificationDetail = async (
  id: number
): Promise<ApiResponse<TaxVerification>> => {
  return request.get(`/enterprise-service/tax-verification/${id}`)
}

// 创建税务核查记录
export const createTaxVerification = async (
  data: CreateTaxVerificationDto
): Promise<ApiResponse<TaxVerification>> => {
  return request.post('/enterprise-service/tax-verification', data)
}

// 更新税务核查记录
export const updateTaxVerification = async (
  id: number,
  data: Partial<CreateTaxVerificationDto>
): Promise<ApiResponse<TaxVerification>> => {
  return request.put(`/enterprise-service/tax-verification/${id}`, data)
}

// 删除税务核查记录
export const deleteTaxVerification = async (
  id: number
): Promise<ApiResponse<void>> => {
  return request.delete(`/enterprise-service/tax-verification/${id}`)
} 