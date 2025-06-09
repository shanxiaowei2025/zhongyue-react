import { User } from '.'

// 文件项类型定义
export interface FileItem {
  fileName: string
  url: string
}

// 费用状态枚举
export enum ExpenseStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

// 费用实体接口
export interface Expense {
  id: number
  companyName: string
  unifiedSocialCreditCode?: string
  companyType: string
  companyLocation: string
  licenseType: string
  licenseFee: number | string
  brandFee: number | string
  recordSealFee: number | string
  generalSealFee: number | string
  agencyType: string
  agencyFee: number | string
  accountingSoftwareFee: number | string
  accountingSoftwareStartDate: string
  accountingSoftwareEndDate: string
  addressFee: number | string
  addressStartDate: string
  addressEndDate: string
  agencyStartDate: string
  agencyEndDate: string
  businessType: string
  contractType: string
  contractImage: string[]
  relatedContract?: {
    id: number
    contractNumber: string
  }[]
  invoiceSoftwareFee: number | string
  invoiceSoftwareStartDate: string
  invoiceSoftwareEndDate: string
  insuranceTypes: string | string[]
  insuredCount: number | string
  socialInsuranceAgencyFee: number | string
  socialInsuranceStartDate: string
  socialInsuranceEndDate: string
  hasHousingFund: boolean
  housingFundCount: number | string
  housingFundAgencyFee: number | string
  housingFundStartDate: string
  housingFundEndDate: string
  statisticalReportFee: number | string
  statisticalStartDate: string
  statisticalEndDate: string
  changeBusiness: string | string[]
  changeFee: number | string
  administrativeLicense: string | string[]
  administrativeLicenseFee: number | string
  otherBusiness: string | string[]
  otherBusinessFee: number | string
  proofOfCharge: string[]
  totalFee: number | string
  salesperson: string
  createdAt: string
  updatedAt: string
  chargeDate: string
  chargeMethod: string | string[]
  auditor?: string
  auditDate?: string
  status: ExpenseStatus
  rejectReason?: string // 退回原因
  receiptRemarks?: string
  internalRemarks?: string
}

// 前端表单使用的类型定义，支持文件上传组件
export interface ExpenseFormData extends Omit<Expense, 'contractImage' | 'proofOfCharge'> {
  contractImage?: FileItem[] | string[]
  proofOfCharge?: FileItem[] | string[]
}

// 费用创建DTO
export interface CreateExpenseDto {
  companyName?: string
  unifiedSocialCreditCode?: string
  companyType?: string
  companyLocation?: string
  licenseType?: string
  licenseFee?: number | string
  brandFee?: number | string
  recordSealFee?: number | string
  generalSealFee?: number | string
  agencyType?: string
  agencyFee?: number | string
  accountingSoftwareFee?: number | string
  accountingSoftwareStartDate?: string
  accountingSoftwareEndDate?: string
  addressFee?: number | string
  addressStartDate?: string
  addressEndDate?: string
  agencyStartDate?: string
  agencyEndDate?: string
  businessType?: string
  contractType?: string
  contractImage?: string[]
  relatedContract?: {
    id: number
    contractNumber: string
  }[]
  invoiceSoftwareFee?: number | string
  invoiceSoftwareStartDate?: string
  invoiceSoftwareEndDate?: string
  insuranceTypes?: string | string[]
  insuredCount?: number | string
  socialInsuranceAgencyFee?: number | string
  socialInsuranceStartDate?: string
  socialInsuranceEndDate?: string
  hasHousingFund?: boolean
  housingFundCount?: number | string
  housingFundAgencyFee?: number | string
  housingFundStartDate?: string
  housingFundEndDate?: string
  statisticalReportFee?: number | string
  statisticalStartDate?: string
  statisticalEndDate?: string
  changeBusiness?: string | string[]
  changeFee?: number | string
  administrativeLicense?: string | string[]
  administrativeLicenseFee?: number | string
  otherBusiness?: string | string[]
  otherBusinessFee?: number | string
  proofOfCharge?: string[]
  totalFee?: number | string
  salesperson?: string
  chargeDate?: string
  chargeMethod?: string | string[]
  receiptRemarks?: string
  internalRemarks?: string
}

// 费用更新DTO
export interface UpdateExpenseDto extends CreateExpenseDto {
  auditor?: string
  auditDate?: string
  status?: ExpenseStatus
  rejectReason?: string // 退回原因
}

// 费用列表查询参数
export interface ExpenseQueryParams {
  page: number
  pageSize: number
  companyName?: string
  unifiedSocialCreditCode?: string
  status?: ExpenseStatus
  salesperson?: string
  startDate?: string
  endDate?: string
  dateRange?: any
  chargeDateStart?: string
  chargeDateEnd?: string
}

// 费用审核DTO
export interface AuditExpenseDto {
  status: ExpenseStatus
  reason?: string
}

// 取消审核DTO
export interface CancelAuditDto {
  cancelReason: string
}

// 费用项目接口
export interface FeeItem {
  name: string
  amount: number | string
  startDate?: string // 费用开始日期
  endDate?: string // 费用结束日期
}

// 收据视图DTO
export interface ReceiptViewDto {
  id?: number
  companyName?: string
  chargeDate?: string
  receiptNo?: string
  totalFee?: number | string
  chargeMethod?: string | string[]
  remarks?: string
  salesperson?: string
  auditor?: string
  auditDate?: string
  companyType?: string
  companyLocation?: string
  status?: ExpenseStatus
  // 旧的单独费用字段，保留向后兼容性
  licenseFee?: number | string
  brandFee?: number | string
  recordSealFee?: number | string
  generalSealFee?: number | string
  agencyFee?: number | string
  accountingSoftwareFee?: number | string
  addressFee?: number | string
  invoiceSoftwareFee?: number | string
  socialInsuranceAgencyFee?: number | string
  statisticalReportFee?: number | string
  changeFee?: number | string
  administrativeLicenseFee?: number | string
  otherBusinessFee?: number | string
  receiptRemarks?: string
  contractImage?: string | string[] // 电子合同
  feeItems?: FeeItem[]
}
