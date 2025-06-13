import request from './request'
import type { ApiResponse } from '../types'
import type {
  FinancialSelfInspectionListResponse,
  FinancialSelfInspectionQueryParams,
  FinancialSelfInspection,
  CreateFinancialSelfInspectionDto,
  RectificationCompletionDto,
  InspectorConfirmationDto,
} from '../types/financialSelfInspection'

// 获取我提交的账务自查记录列表
export const getMySubmittedInspections = async (
  params?: FinancialSelfInspectionQueryParams
): Promise<ApiResponse<FinancialSelfInspectionListResponse>> => {
  return request.get('/enterprise-service/financial-self-inspection/my-submitted', params)
}

// 获取我负责的账务自查记录列表
export const getMyResponsibleInspections = async (
  params?: FinancialSelfInspectionQueryParams
): Promise<ApiResponse<FinancialSelfInspectionListResponse>> => {
  return request.get('/enterprise-service/financial-self-inspection/my-responsible', params)
}

// 获取我提交的记录详情
export const getMySubmittedInspectionDetail = async (
  id: number
): Promise<ApiResponse<FinancialSelfInspection>> => {
  return request.get(`/enterprise-service/financial-self-inspection/my-submitted/${id}`)
}

// 获取我负责的记录详情
export const getMyResponsibleInspectionDetail = async (
  id: number
): Promise<ApiResponse<FinancialSelfInspection>> => {
  return request.get(`/enterprise-service/financial-self-inspection/my-responsible/${id}`)
}

// 创建账务自查记录
export const createFinancialSelfInspection = async (
  data: CreateFinancialSelfInspectionDto
): Promise<ApiResponse<FinancialSelfInspection>> => {
  return request.post('/enterprise-service/financial-self-inspection', data)
}

// 更新整改完成日期和结果
export const updateRectificationCompletion = async (
  id: number,
  data: RectificationCompletionDto
): Promise<ApiResponse<FinancialSelfInspection>> => {
  return request.patch(`/enterprise-service/financial-self-inspection/${id}/rectification-completion`, data)
}

// 更新抽查人确认
export const updateInspectorConfirmation = async (
  id: number,
  data: InspectorConfirmationDto
): Promise<ApiResponse<FinancialSelfInspection>> => {
  return request.patch(`/enterprise-service/financial-self-inspection/${id}/inspector-confirmation`, data)
} 