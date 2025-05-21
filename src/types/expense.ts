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
  companyType: string
  companyLocation: string
  licenseType: string
  licenseFee: number
  brandFee: number
  recordSealFee: number
  generalSealFee: number
  agencyType: string
  agencyFee: number
  accountingSoftwareFee: number
  accountingSoftwareStartDate: string
  accountingSoftwareEndDate: string
  addressFee: number
  addressStartDate: string
  addressEndDate: string
  agencyStartDate: string
  agencyEndDate: string
  businessType: string
  contractType: string
  contractImage: string
  invoiceSoftwareFee: number
  invoiceSoftwareStartDate: string
  invoiceSoftwareEndDate: string
  insuranceTypes: string
  insuredCount: number
  socialInsuranceAgencyFee: number
  socialInsuranceStartDate: string
  socialInsuranceEndDate: string
  statisticalReportFee: number
  statisticalStartDate: string
  statisticalEndDate: string
  changeBusiness: string
  changeFee: number
  administrativeLicense: string
  administrativeLicenseFee: number
  otherBusiness: string
  otherBusinessFee: number
  proofOfCharge: string[]
  totalFee: number
  salesperson: string
  createdAt: string
  updatedAt: string
  chargeDate: string
  chargeMethod: string
  auditor?: string
  auditDate?: string
  status: ExpenseStatus
  rejectReason?: string // 退回原因
  receiptRemarks?: string
  internalRemarks?: string
}

// 前端表单使用的类型定义，支持文件上传组件
export interface ExpenseFormData extends Omit<Expense, 'contractImage' | 'proofOfCharge'> {
  contractImage?: FileItem | string
  proofOfCharge?: FileItem[] | string[]
}

// 费用创建DTO
export interface CreateExpenseDto {
  companyName?: string
  companyType?: string
  companyLocation?: string
  licenseType?: string
  licenseFee?: number
  brandFee?: number
  recordSealFee?: number
  generalSealFee?: number
  agencyType?: string
  agencyFee?: number
  accountingSoftwareFee?: number
  accountingSoftwareStartDate?: string
  accountingSoftwareEndDate?: string
  addressFee?: number
  addressStartDate?: string
  addressEndDate?: string
  agencyStartDate?: string
  agencyEndDate?: string
  businessType?: string
  contractType?: string
  contractImage?: string
  invoiceSoftwareFee?: number
  invoiceSoftwareStartDate?: string
  invoiceSoftwareEndDate?: string
  insuranceTypes?: string
  insuredCount?: number
  socialInsuranceAgencyFee?: number
  socialInsuranceStartDate?: string
  socialInsuranceEndDate?: string
  statisticalReportFee?: number
  statisticalStartDate?: string
  statisticalEndDate?: string
  changeBusiness?: string
  changeFee?: number
  administrativeLicense?: string
  administrativeLicenseFee?: number
  otherBusiness?: string
  otherBusinessFee?: number
  proofOfCharge?: string[]
  totalFee?: number
  salesperson?: string
  chargeDate?: string
  chargeMethod?: string
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
  name: string;
  amount: number;
}

// 收据视图DTO
export interface ReceiptViewDto {
  id?: number
  companyName?: string
  chargeDate?: string
  receiptNo?: string
  totalFee?: number
  chargeMethod?: string
  remarks?: string
  salesperson?: string
  auditor?: string
  auditDate?: string
  companyType?: string
  companyLocation?: string
  status?: ExpenseStatus
  // 旧的单独费用字段，保留向后兼容性
  licenseFee?: number
  brandFee?: number
  recordSealFee?: number
  generalSealFee?: number
  agencyFee?: number
  accountingSoftwareFee?: number
  addressFee?: number
  invoiceSoftwareFee?: number
  socialInsuranceAgencyFee?: number
  statisticalReportFee?: number
  changeFee?: number
  administrativeLicenseFee?: number
  otherBusinessFee?: number
  receiptRemarks?: string
  // 新的费用明细数组
  feeItems?: FeeItem[]
}
