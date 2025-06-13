import request from './request'
import type { 
  EnterpriseQueryParams, 
  EnterpriseListResponse,
  ServiceHistoryQueryParams,
  ServiceHistoryResponse,
  ExpenseContributionQueryParams,
  ExpenseContributionResponse
} from '../types/enterpriseService'

/**
 * 获取企业列表
 * @param params 查询参数
 */
export const getEnterpriseList = (params: EnterpriseQueryParams) => {
  return request.get<EnterpriseListResponse>('/enterprise-service/customer', params)
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