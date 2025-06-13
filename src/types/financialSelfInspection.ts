// 账务自查记录接口
export interface FinancialSelfInspection {
  id: number
  inspectionDate: string | null // 抽查日期
  companyName: string | null // 企业名称
  unifiedSocialCreditCode: string | null // 统一社会信用代码
  bookkeepingAccountant: string | null // 记账会计
  consultantAccountant: string | null // 顾问会计
  inspector: string | null // 抽查人
  problem: string | null // 问题
  solution: string | null // 解决方案
  rectificationCompletionDate: string | null // 整改完成日期
  rectificationResult: string | null // 整改结果
  inspectorConfirmation: string | null // 抽查人确认
  remarks: string | null // 备注
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
  rectificationCompletionDate: string
  rectificationResult?: string
}

// 抽查人确认DTO
export interface InspectorConfirmationDto {
  inspectorConfirmation: string
  remarks?: string
} 