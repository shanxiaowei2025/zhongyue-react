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
  onlineBankingCustodyFee: number | string
  onlineBankingCustodyStartDate: string
  onlineBankingCustodyEndDate: string
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
  socialInsuranceBusinessType?: string
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
  customerDataOrganizationFee: number | string
  organizationStartDate: string
  organizationEndDate: string
  changeBusiness: string | string[]
  changeFee: number | string
  administrativeLicense: string | string[]
  administrativeLicenseFee: number | string
  otherBusiness: string | string[]
  otherBusinessFee: number | string
  otherBusinessOutsourcing: string | string[]
  otherBusinessOutsourcingFee: number | string
  otherBusinessSpecial: string | string[]
  otherBusinessSpecialFee: number | string
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
  receiptNo?: string // 收据编号
  businessCommissionOwn?: number // 业务提成(自有)
  businessCommissionOutsource?: number // 业务提成(外包)
  specialBusinessCommission?: number // 特殊业务提成
  agencyCommission?: number // 代理费提成
  giftAgencyDuration?: string // 赠送代理时长
  basicBusinessPerformance?: number // 基础业务业绩
  outsourcingBusinessPerformance?: number // 外包业务业绩
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
  onlineBankingCustodyFee?: number | string
  onlineBankingCustodyStartDate?: string
  onlineBankingCustodyEndDate?: string
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
  socialInsuranceBusinessType?: string
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
  customerDataOrganizationFee?: number | string
  organizationStartDate?: string
  organizationEndDate?: string
  changeBusiness?: string | string[]
  changeFee?: number | string
  administrativeLicense?: string | string[]
  administrativeLicenseFee?: number | string
  otherBusiness?: string | string[]
  otherBusinessFee?: number | string
  otherBusinessOutsourcing?: string | string[]
  otherBusinessOutsourcingFee?: number | string
  otherBusinessSpecial?: string | string[]
  otherBusinessSpecialFee?: number | string
  proofOfCharge?: string[]
  totalFee?: number | string
  salesperson?: string
  chargeDate?: string
  chargeMethod?: string | string[]
  receiptRemarks?: string
  internalRemarks?: string
  businessCommissionOwn?: number // 业务提成(自有)
  businessCommissionOutsource?: number // 业务提成(外包)
  specialBusinessCommission?: number // 特殊业务提成
  agencyCommission?: number // 代理费提成
  giftAgencyDuration?: string // 赠送代理时长
  basicBusinessPerformance?: number // 基础业务业绩
  outsourcingBusinessPerformance?: number // 外包业务业绩
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
  businessType?: string | string[]
  socialInsuranceBusinessType?: string | string[]
  businessInquiry?: string | string[]
  startDate?: string
  endDate?: string
  dateRange?: any
  createDateRange?: any
  auditDateRange?: any
  chargeDateStart?: string
  chargeDateEnd?: string
  auditDateStart?: string
  auditDateEnd?: string
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
  customerDataOrganizationFee?: number | string
  changeFee?: number | string
  administrativeLicenseFee?: number | string
  otherBusinessFee?: number | string
  otherBusinessOutsourcing?: string | string[]
  otherBusinessOutsourcingFee?: number | string
  otherBusinessSpecial?: string | string[]
  otherBusinessSpecialFee?: number | string
  receiptRemarks?: string
  contractImage?: string | string[] // 电子合同
  feeItems?: FeeItem[]
}

// 特殊业务记录类型
export interface SpecialBusinessRecord {
  id: number
  companyName: string
  salesperson: string
  chargeDate: string
  otherBusinessSpecial: string[]
  otherBusinessSpecialFee: string
  specialBusinessCommission: string | null
  totalFee: string
  businessType: string | null
  auditor: string | null
  auditDate: string | null
}

// 特殊业务列表响应类型
export interface SpecialBusinessListResponse {
  data: {
    data: SpecialBusinessRecord[]
    total: string
    page: number
    pageSize: number
    totalPages: number
  }
  code: number
  message: string
  timestamp: number
}
