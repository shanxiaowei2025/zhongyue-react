// 薪资管理集成化类型定义

// 薪资主表数据模型
export interface SalaryRecord {
  id: number
  department: string
  name: string
  idCard?: string
  type?: string

  // 基础薪资
  baseSalary: number
  temporaryIncrease: number
  temporaryIncreaseItem?: string
  attendanceDeduction: number
  basicSalaryPayable: number

  // 奖励补贴
  fullAttendance: number
  totalSubsidy: number
  seniority: number

  // 提成
  agencyFeeCommission: number
  performanceCommission: number
  performanceDeductions?: PerformanceDeduction[]
  businessCommission: number

  // 扣除
  otherDeductions: number
  personalMedical: number
  personalPension: number
  personalUnemployment: number
  personalInsuranceTotal: number
  companyInsuranceTotal: number
  depositDeduction: number
  personalIncomeTax: number
  other: number

  // 结算
  totalPayable: number
  bankCardNumber?: string
  company?: string
  bankCardOrWechat: number
  cashPaid: number
  corporatePayment: number
  taxDeclaration: number

  yearMonth: string
  isPaid: boolean
  isConfirmed: boolean
  confirmedAt?: string
  createdAt: string
  updatedAt: string
}

// 社保信息数据模型
export interface SocialInsuranceRecord {
  id: number
  name: string
  personalMedical: number
  personalPension: number
  personalUnemployment: number
  personalTotal: number
  companyMedical: number
  companyPension: number
  companyUnemployment: number
  companyInjury: number
  companyTotal: number
  grandTotal: number
  yearMonth: string
  remark?: string
  createdAt: string
  updatedAt: string
}

// 补贴合计数据模型
export interface SubsidySummaryRecord {
  id: number
  name: string
  department: string
  position: string
  departmentHeadSubsidy: number
  positionAllowance: number
  oilSubsidy: number
  mealSubsidy: number
  totalSubsidy: number
  yearMonth: string
  createdAt: string
  updatedAt: string
}

// 朋友圈扣款数据模型
export interface FriendCirclePaymentRecord {
  id: number
  name: string
  weekOne: number
  weekTwo: number
  weekThree: number
  weekFour: number
  totalCount: number
  payment: number
  isCompleted: boolean
  yearMonth: string
  createdAt: string
  updatedAt: string
}

// 考勤扣款数据模型
export interface AttendanceDeductionRecord {
  id: number
  name: string
  attendanceDeduction: number
  fullAttendanceBonus: number
  yearMonth: string
  remark?: string
  createdAt: string
  updatedAt: string
}

// 保证金数据模型
export interface DepositRecord {
  id: number
  name: string
  amount: number
  deductionDate: string
  remark?: string
  createdAt: string
  updatedAt: string
}

// 薪资基数历史记录
export interface SalaryBaseHistoryRecord {
  id: number
  employeeName: string
  beforeBaseSalary: number
  afterBaseSalary: number
  modifiedBy: string
  modifiedAt: string
}

// 绩效扣除详情
export interface PerformanceDeduction {
  type: string
  amount: number
  reason?: string
}

// 提成配置基础类型
export interface CommissionConfig {
  id: number
  feeRange: string
  commissionRate: number
}

// 代理费提成配置
export interface AgencyCommissionConfig extends CommissionConfig {
  agencyCount: string
  minCommissionBase: number
}

// 业务销售提成配置
export interface SalesCommissionConfig extends CommissionConfig {
  type: string
  baseSalary: number
}

// 绩效提成配置
export interface PerformanceCommissionConfig {
  id: number
  pLevel: string
  gradeLevel: string
  householdCount: string
  baseSalary: number
  performance: number
}

// 查询参数类型
export interface SalaryQueryParams {
  page?: number
  pageSize?: number
  department?: string
  name?: string
  yearMonth?: string
  type?: string
}

// 创建薪资DTO
export interface CreateSalaryDto {
  department: string
  name: string
  idCard?: string
  type?: string
  baseSalary: number
  temporaryIncrease?: number
  temporaryIncreaseItem?: string
  attendanceDeduction?: number
  basicSalaryPayable: number
  fullAttendance?: number
  totalSubsidy?: number
  seniority?: number
  agencyFeeCommission?: number
  performanceCommission?: number
  performanceDeductions?: PerformanceDeduction[]
  businessCommission?: number
  otherDeductions?: number
  personalMedical?: number
  personalPension?: number
  personalUnemployment?: number
  personalInsuranceTotal?: number
  companyInsuranceTotal?: number
  depositDeduction?: number
  personalIncomeTax?: number
  other?: number
  totalPayable: number
  bankCardNumber?: string
  company?: string
  bankCardOrWechat?: number
  cashPaid?: number
  corporatePayment?: number
  taxDeclaration?: number
  yearMonth: string
}

// 更新薪资DTO
export interface UpdateSalaryDto extends Partial<CreateSalaryDto> {}

// 创建社保信息DTO
export interface CreateSocialInsuranceDto {
  name: string
  personalMedical?: number
  personalPension?: number
  personalUnemployment?: number
  personalTotal?: number
  companyMedical?: number
  companyPension?: number
  companyUnemployment?: number
  companyInjury?: number
  companyTotal?: number
  grandTotal?: number
  yearMonth: string
  remark?: string
}

// 更新社保信息DTO
export interface UpdateSocialInsuranceDto extends Partial<CreateSocialInsuranceDto> {}

// 创建补贴合计DTO
export interface CreateSubsidySummaryDto {
  name: string
  department: string
  position: string
  departmentHeadSubsidy?: number
  positionAllowance?: number
  oilSubsidy?: number
  mealSubsidy?: number
  totalSubsidy?: number
  yearMonth: string
}

// 更新补贴合计DTO
export interface UpdateSubsidySummaryDto extends Partial<CreateSubsidySummaryDto> {}

// 创建考勤扣款DTO
export interface CreateAttendanceDeductionDto {
  name: string
  attendanceDeduction?: number
  fullAttendanceBonus?: number
  yearMonth: string
  remark?: string
}

// 更新考勤扣款DTO
export interface UpdateAttendanceDeductionDto extends Partial<CreateAttendanceDeductionDto> {}

// 创建朋友圈扣款DTO
export interface CreateFriendCirclePaymentDto {
  name: string
  weekOne?: number
  weekTwo?: number
  weekThree?: number
  weekFour?: number
  totalCount?: number
  payment?: number
  isCompleted?: boolean
  yearMonth: string
}

// 更新朋友圈扣款DTO
export interface UpdateFriendCirclePaymentDto extends Partial<CreateFriendCirclePaymentDto> {}

// 创建保证金DTO
export interface CreateDepositDto {
  name: string
  amount: number
  deductionDate: string
  remark?: string
}

// 更新保证金DTO
export interface UpdateDepositDto extends Partial<CreateDepositDto> {}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages?: number
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  code?: number
}

// 导入结果类型
export interface ImportResult {
  success: boolean
  successCount: number
  failedCount: number
  failedRecords?: ImportFailedRecord[]
  message?: string
}

// 导入失败记录
export interface ImportFailedRecord {
  row: number
  errors: string[]
  data: any
}

// 集成化相关数据类型
export interface RelatedData {
  socialInsurance?: SocialInsuranceRecord
  subsidy?: SubsidySummaryRecord
  attendance?: AttendanceDeductionRecord
  friendCircle?: FriendCirclePaymentRecord
  deposit?: DepositRecord[]
  commission?: CommissionConfig[]
}

// 集成化查询参数
export interface IntegratedQueryParams {
  yearMonth: string
  employeeName?: string
}

// 薪资统计数据
export interface SalaryStatistics {
  totalPayable: number
  totalSocialInsurance: number
  totalTax: number
  employeeCount: number
  paidCount: number
  unpaidCount: number
  confirmedCount: number
  unconfirmedCount: number
  confirmationRate: number
}

// 导入导出类型
export type ImportType =
  | 'salary'
  | 'socialInsurance'
  | 'subsidy'
  | 'attendance'
  | 'friendCircle'
  | 'deposit'
export type ExportType = ImportType

// 自动生成薪资响应类型
export interface AutoGenerateSalaryResult {
  success: boolean
  message: string
  details: {
    created: number
    updated: number
  }
}

// 操作类型
export type OperationType = 'create' | 'update' | 'delete' | 'import' | 'export' | 'generate'

// 错误类型
export interface ValidationError {
  field: string
  message: string
  value?: any
}

// 表单状态类型
export interface FormState {
  loading: boolean
  errors: ValidationError[]
  touched: Record<string, boolean>
}

// 分页状态类型
export interface PaginationState {
  current: number
  pageSize: number
  total: number
}

// 搜索状态类型
export interface SearchState {
  department?: string
  name?: string
  yearMonth?: string
  type?: string
}

// 集成化状态类型
export interface IntegratedState {
  selectedEmployee: SalaryRecord | null
  selectedYearMonth: string
  salaryData: SalaryRecord[]
  relatedData: RelatedData
  statistics: SalaryStatistics
  loading: boolean
  searchState: SearchState
  paginationState: PaginationState
}
