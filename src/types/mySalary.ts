// 我的薪资模块类型定义

// 基础薪资记录类型（员工视图，包含完整字段）
export interface MySalaryRecord {
  id: number
  department: string
  name: string
  idCard: string
  type: string
  baseSalary: string | number
  temporaryIncrease: string | number
  temporaryIncreaseItem?: string
  attendanceDeduction: string | number
  basicSalaryPayable: string | number
  fullAttendance: string | number
  totalSubsidy: string | number
  seniority: string | number
  agencyFeeCommission: string | number
  performanceCommission: string | number
  performanceDeductions?: number[]
  businessCommission: string | number
  otherDeductions: string | number
  personalMedical: string | number
  personalPension: string | number
  personalUnemployment: string | number
  personalInsuranceTotal: string | number
  companyInsuranceTotal: string | number
  depositDeduction: string | number
  depositTotal: string | number // 新增字段
  personalIncomeTax: string | number
  other: string | number
  totalPayable: string | number
  bankCardNumber: string
  company: string
  payrollCompany: string // 新增字段
  bankCardOrWechat: string | number
  cashPaid: string | number
  corporatePayment: string | number
  taxDeclaration: string | number
  isPaid: boolean
  isConfirmed: boolean
  confirmedAt?: string
  yearMonth: string
  createdAt: string
  updatedAt: string
}

// 薪资查询参数
export interface MySalaryQueryParams {
  yearMonth?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

// 薪资明细展示数据
export interface MySalaryDetail {
  basic: {
    yearMonth: string
    baseSalary: number
    workDays: number
    overtimeHours: number
  }
  income: {
    subsidyTotal: number
    commissionTotal: number
    otherIncome: number
    totalIncome: number
  }
  deduction: {
    personalInsuranceTotal: number
    personalIncomeTax: number
    attendanceDeduction: number
    otherDeduction: number
    totalDeduction: number
  }
  payment: {
    totalPayable: number
    bankCardOrWechat: number
    cashPaid: number
    corporatePayment: number
  }
  status: {
    isConfirmed: boolean
    confirmedAt?: string
    canConfirm: boolean
  }
}

// 薪资统计数据（员工视图）
export interface MySalaryStatistics {
  currentMonth: {
    totalPayable: number
    isConfirmed: boolean
  }
  yearToDate: {
    totalPayable: number
    totalTax: number
    confirmedCount: number
    totalCount: number
  }
}

// 分页响应
export interface MySalaryPaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// API响应
export interface MySalaryApiResponse<T> {
  code: number
  message: string
  data: T
}

// 确认薪资请求
export interface ConfirmSalaryRequest {
  isConfirmed: boolean
  remark?: string
}

// 确认薪资响应
export interface ConfirmSalaryResponse {
  success: boolean
  message: string
  confirmedAt: string
}
