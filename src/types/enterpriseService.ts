import { ApiResponse } from './index'

export interface Enterprise {
  id: number
  companyName: string
  unifiedSocialCreditCode: string
  contributionAmount: string | null
  consultantAccountant?: string
  bookkeepingAccountant?: string
  invoiceOfficer?: string
  enterpriseType?: string
  location?: string
  taxBureau?: string
  legalRepresentativeName?: string
  enterpriseStatus?: string
  customerLevel?: string
  createTime?: string
  updateTime?: string
}

export interface EnterpriseQueryParams {
  page?: number
  pageSize?: number
  companyName?: string
  unifiedSocialCreditCode?: string
  consultantAccountant?: string
  bookkeepingAccountant?: string
  invoiceOfficer?: string
  enterpriseType?: string
  location?: string
  taxBureau?: string
  legalRepresentativeName?: string
  enterpriseStatus?: string
  customerLevel?: string
}

export interface EnterpriseListResponse extends ApiResponse<{
  data: Enterprise[]
  total: number
}> {}

// 服务历程相关类型
export interface ServiceHistory {
  id: number
  createdAt: string
  updatedAt: string
  updatedFields: Record<string, any>
}

export interface ServiceHistoryQueryParams {
  companyName?: string
  unifiedSocialCreditCode?: string
}

export interface ServiceHistoryResponse extends ApiResponse<ServiceHistory[]> {}

// 费用贡献相关类型
export interface ExpenseRecord {
  id: number
  chargeDate: string
  receiptNo: string
  totalFee: string
}

export interface ExpenseContribution {
  expenses: ExpenseRecord[]
  totalAmount: number
}

export interface ExpenseContributionQueryParams {
  companyName?: string
  unifiedSocialCreditCode?: string
}

export interface ExpenseContributionResponse extends ApiResponse<ExpenseContribution> {} 