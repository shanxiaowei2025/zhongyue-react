import request from './request'
import type { 
  EnterpriseQueryParams, 
  EnterpriseListResponse,
  ServiceHistoryQueryParams,
  ServiceHistoryResponse,
  ExpenseContributionQueryParams,
  ExpenseContributionResponse,
  Enterprise
} from '../types/enterpriseService'
import type { ApiResponse } from '../types'

/**
 * 获取企业列表
 * @param params 查询参数
 */
export const getEnterpriseList = (params: EnterpriseQueryParams) => {
  return request.get<EnterpriseListResponse>('/enterprise-service/customer', params)
}

/**
 * 根据企业名称或统一社会信用代码查询企业信息
 * @param companyName 企业名称
 * @param unifiedSocialCreditCode 统一社会信用代码
 */
export const getEnterpriseByNameOrCode = (params: { 
  companyName?: string
  unifiedSocialCreditCode?: string 
}) => {
  return request.get<ApiResponse<{ data: Enterprise[] }>>('/enterprise-service/customer', params)
}

/**
 * 获取企业详情
 * @param id 企业ID
 */
export const getEnterpriseById = (id: number) => {
  return request.get<EnterpriseListResponse>(`/enterprise-service/customer/${id}`)
}

/**
 * 获取企业服务历程
 * @param params 查询参数
 */
export const getServiceHistory = (params: ServiceHistoryQueryParams) => {
  return request.get<ServiceHistoryResponse>('/enterprise-service/service-history/find-company-history', params)
}

/**
 * 获取企业费用贡献
 * @param params 查询参数
 */
export const getExpenseContribution = (params: ExpenseContributionQueryParams) => {
  return request.get<ExpenseContributionResponse>('/enterprise-service/expense-contribution/find-company-expenses', params)
} 