import request from './request'
import type { ApiResponse } from '../types'
import type {
  AgencyFeeAnalysisData,
  EmployeePerformanceData,
  CustomerChurnData,
  ServiceExpiryData,
  AccountantClientData,
  NewCustomerData,
  CustomerLevelDistributionData,
  ReportTableMetadata,
} from '../pages/Reports/types/reports'

// 代理费收费变化分析
export const getAgencyFeeAnalysis = (params: {
  year?: number
  threshold?: number
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
}): Promise<ApiResponse<AgencyFeeAnalysisData>> => {
  return request.get('/reports/agency-fee-analysis', params)
}

// 员工业绩统计
export const getEmployeePerformance = (params: {
  month?: string
  employeeName?: string
  department?: string
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
}): Promise<ApiResponse<EmployeePerformanceData>> => {
  return request.get('/reports/employee-performance', params)
}

// 客户流失统计
export const getCustomerChurnStats = (params: {
  year?: number
  month?: number
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
}): Promise<ApiResponse<CustomerChurnData>> => {
  return request.get('/reports/customer-churn-stats', params)
}

// 代理服务到期客户统计
export const getServiceExpiryStats = (params?: {
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
}): Promise<ApiResponse<ServiceExpiryData>> => {
  return request.get('/reports/service-expiry-stats', params)
}

// 会计负责客户数量统计
export const getAccountantClientStats = (params: {
  accountantType?: string
  accountantName?: string
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
}): Promise<ApiResponse<AccountantClientData>> => {
  return request.get('/reports/accountant-client-stats', params)
}

// 新增客户统计
export const getNewCustomerStats = (params: {
  year?: number
  month?: number
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
}): Promise<ApiResponse<NewCustomerData>> => {
  return request.get('/reports/new-customer-stats', params)
}

// 客户等级分布统计
export const getCustomerLevelDistribution = (params: {
  year?: number
  month?: number
  page?: number
  pageSize?: number
  sortField?: string
  sortOrder?: 'ASC' | 'DESC'
}): Promise<ApiResponse<CustomerLevelDistributionData>> => {
  return request.get('/reports/customer-level-distribution', params)
}

// 获取新增客户统计表格元数据
export const getNewCustomerStatsMetadata = (): Promise<ApiResponse<ReportTableMetadata>> => {
  return request.get('/reports/new-customer-stats/metadata')
}
