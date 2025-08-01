// 整改记录项
export interface RectificationRecordItem {
  date: string
  result: string
}

// 审核通过记录项
export interface ApprovalRecordItem {
  date: string
  remark: string
}

// 审核退回记录项
export interface RejectRecordItem {
  date: string
  reason: string
}

// 复查审核通过记录项
export interface ReviewerApprovalRecordItem {
  date: string
  remark: string
}

// 复查审核退回记录项
export interface ReviewerRejectRecordItem {
  date: string
  reason: string
}

// 账务自查状态枚举
export enum FinancialSelfInspectionStatus {
  SUBMITTED = 0, // 待整改
  RECTIFIED = 1, // 已整改
  INSPECTOR_APPROVED = 2, // 抽查人确认
  INSPECTOR_REJECTED = 3, // 抽查人退回
  REVIEWER_APPROVED = 4, // 复查人确认
  REVIEWER_REJECTED = 5, // 复查人退回
}

// 账务自查记录接口
export interface FinancialSelfInspection {
  id: number
  inspectionDate: string | null // 抽查日期
  companyName: string | null // 企业名称
  unifiedSocialCreditCode: string | null // 统一社会信用代码
  bookkeepingAccountant: string | null // 记账会计
  consultantAccountant: string | null // 顾问会计
  inspector: string | null // 抽查人
  reviewer: string | null // 复查人
  problem: string | null // 问题
  solution: string | null // 解决方案
  status: FinancialSelfInspectionStatus // 状态
  rectificationRecords: RectificationRecordItem[] // 整改记录
  approvalRecords: ApprovalRecordItem[] // 审核通过记录
  rejectRecords: RejectRecordItem[] // 审核退回记录
  reviewerApprovalRecords: ReviewerApprovalRecordItem[] // 复查审核通过记录
  reviewerRejectRecords: ReviewerRejectRecordItem[] // 复查审核退回记录
  createdAt: string // 创建时间
  updatedAt: string // 更新时间
}

// 查询参数接口
export interface FinancialSelfInspectionQueryParams {
  companyName?: string // 企业名称
  unifiedSocialCreditCode?: string // 统一社会信用代码
  bookkeepingAccountant?: string // 记账会计
  consultantAccountant?: string // 顾问会计
  inspector?: string // 抽查人
  status?: FinancialSelfInspectionStatus // 状态
  inspectionDateStart?: string // 抽查日期开始
  inspectionDateEnd?: string // 抽查日期结束
  page?: number // 页码
  pageSize?: number // 每页数量
}

// API响应接口
export interface FinancialSelfInspectionListResponse {
  items: FinancialSelfInspection[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 创建账务自查记录DTO
export interface CreateFinancialSelfInspectionDto {
  inspectionDate?: string
  companyName?: string
  unifiedSocialCreditCode?: string
  bookkeepingAccountant?: string
  consultantAccountant?: string
  inspector?: string
  problem?: string
  solution?: string
}

// 整改完成DTO
export interface RectificationCompletionDto {
  rectificationRecords: RectificationRecordItem[]
}

// 审核通过DTO
export interface ApprovalDto {
  approvalRecords: ApprovalRecordItem[]
}

// 审核退回DTO
export interface RejectDto {
  rejectRecords: RejectRecordItem[]
}

// 复查审核通过DTO
export interface ReviewerApprovalDto {
  reviewerApprovalRecords: ReviewerApprovalRecordItem[]
}

// 复查审核退回DTO
export interface ReviewerRejectDto {
  reviewerRejectRecords: ReviewerRejectRecordItem[]
}
