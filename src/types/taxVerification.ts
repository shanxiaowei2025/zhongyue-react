import { ApiResponse } from './index'

// 附件类型
export interface TaxVerificationAttachment {
  name: string
  url: string
}

// 税务核查记录接口
export interface TaxVerification {
  id: number
  companyName: string
  unifiedSocialCreditCode: string
  taxBureau: string
  riskIssuedDate: string
  riskReason: string
  riskOccurredDate: string
  responsibleAccountant: string
  solution: string
  attachments: TaxVerificationAttachment[]
}

// 查询参数接口
export interface TaxVerificationQueryParams {
  companyName?: string
  unifiedSocialCreditCode?: string
  taxBureau?: string
  riskIssuedDateStart?: string
  riskIssuedDateEnd?: string
  responsibleAccountant?: string
  page?: number
  pageSize?: number
}

// API响应接口
export interface TaxVerificationListResponse extends ApiResponse<{
  list: TaxVerification[]
  total: number
  page: number
  pageSize: number
}> {}

// 创建税务核查记录DTO
export interface CreateTaxVerificationDto {
  companyName: string
  unifiedSocialCreditCode: string
  taxBureau: string
  riskIssuedDate: string
  riskReason: string
  riskOccurredDate: string
  responsibleAccountant: string
  solution: string
  attachments: TaxVerificationAttachment[]
} 