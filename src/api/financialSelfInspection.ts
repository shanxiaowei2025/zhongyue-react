import request from './request'
import type { ApiResponse } from '../types'
import type {
  FinancialSelfInspectionListResponse,
  FinancialSelfInspectionQueryParams,
  FinancialSelfInspection,
  CreateFinancialSelfInspectionDto,
  RectificationCompletionDto,
  ApprovalDto,
  RejectDto,
  ReviewerApprovalDto,
  ReviewerRejectDto,
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

// 获取我复查的账务自查记录列表
export const getMyReviewedInspections = async (
  params?: FinancialSelfInspectionQueryParams
): Promise<ApiResponse<FinancialSelfInspectionListResponse>> => {
  return request.get('/enterprise-service/financial-self-inspection/my-reviewed', params)
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

// 获取我复查的记录详情
export const getMyReviewedInspectionDetail = async (
  id: number
): Promise<ApiResponse<FinancialSelfInspection>> => {
  return request.get(`/enterprise-service/financial-self-inspection/my-reviewed/${id}`)
}

// 创建账务自查记录
export const createFinancialSelfInspection = async (
  data: CreateFinancialSelfInspectionDto
): Promise<ApiResponse<FinancialSelfInspection>> => {
  return request.post('/enterprise-service/financial-self-inspection', data)
}

// 更新整改记录
export const updateRectificationCompletion = async (
  id: number,
  data: RectificationCompletionDto
): Promise<ApiResponse<FinancialSelfInspection>> => {
  return request.patch(
    `/enterprise-service/financial-self-inspection/${id}/rectification-completion`,
    data
  )
}

// 添加沟通记录
export const addCommunicationRecord = async (
  id: number,
  data: { result: string }
): Promise<ApiResponse<FinancialSelfInspection>> => {
  return request.patch(
    `/enterprise-service/financial-self-inspection/${id}/add-communication-record`,
    data
  )
}

// 审核通过
export const approvalInspection = async (
  id: number,
  data: ApprovalDto
): Promise<ApiResponse<FinancialSelfInspection>> => {
  return request.patch(`/enterprise-service/financial-self-inspection/${id}/approval`, data)
}

// 审核退回
export const rejectInspection = async (
  id: number,
  data: RejectDto
): Promise<ApiResponse<FinancialSelfInspection>> => {
  return request.patch(`/enterprise-service/financial-self-inspection/${id}/reject`, data)
}

// 复查审核通过
export const reviewerApprovalInspection = async (
  id: number,
  data: ReviewerApprovalDto
): Promise<ApiResponse<FinancialSelfInspection>> => {
  return request.patch(
    `/enterprise-service/financial-self-inspection/${id}/reviewer-approval`,
    data
  )
}

// 复查审核退回
export const reviewerRejectInspection = async (
  id: number,
  data: ReviewerRejectDto
): Promise<ApiResponse<FinancialSelfInspection>> => {
  return request.patch(`/enterprise-service/financial-self-inspection/${id}/reviewer-reject`, data)
}

// 顾问会计确认是否需要会计沟通
export const updateNeedAccountantCommunication = async (
  id: number,
  data: { needAccountantCommunication: boolean }
): Promise<ApiResponse<FinancialSelfInspection>> => {
  return request.patch(
    `/enterprise-service/financial-self-inspection/${id}/need-accountant-communication`,
    data
  )
}

// 删除账务自查记录
export const deleteFinancialSelfInspection = async (id: number): Promise<ApiResponse<void>> => {
  return request.delete(`/enterprise-service/financial-self-inspection/${id}`)
}
