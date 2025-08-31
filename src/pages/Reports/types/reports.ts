// 报表相关类型定义

// 代理费分析相关类型
export interface AgencyFeeDecreaseCustomer {
  customerId: number
  companyName: string
  unifiedSocialCreditCode: string
  currentYearFee: number
  previousYearFee: number
  decreaseAmount: number
  decreaseRate: number
  consultantAccountant: string
  bookkeepingAccountant: string
}

export interface AgencyFeeAnalysisData {
  list: AgencyFeeDecreaseCustomer[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 员工业绩相关类型
export interface EmployeePerformanceItem {
  employeeName: string
  department: string
  newCustomerRevenue: number
  renewalRevenue: number
  otherRevenue: number
  totalRevenue: number
  customerCount: number
}

export interface EmployeePerformanceData {
  list: EmployeePerformanceItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  summary: {
    totalRevenue: number
    averageRevenue: number
    topPerformer: string
  }
}

// 客户流失相关类型
export interface ChurnedCustomerItem {
  customerId: number
  companyName: string
  unifiedSocialCreditCode: string
  churnDate: string
  churnReason: string
  lastServiceDate: string
  currentEnterpriseStatus: string
  currentBusinessStatus: string
}

export interface CustomerChurnStatsItem {
  period: string
  churnCount: number
  cancelledEnterpriseCount: number
  lostBusinessCount: number
  churnRate: number
  churnReasons: Array<{
    reason: string
    count: number
  }>
}

export interface CustomerChurnData {
  list: ChurnedCustomerItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  periodStats: CustomerChurnStatsItem[]
  summary: {
    totalChurned: number
    cancelledEnterpriseCount: number
    lostBusinessCount: number
    churnRate: number
    recoveryOpportunities: number
  }
}

// 服务到期相关类型
export interface ExpiringCustomerItem {
  customerId: number
  companyName: string
  unifiedSocialCreditCode: string
  agencyEndDate: string
}

export interface ServiceExpiryData {
  list: ExpiringCustomerItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  totalExpiredCustomers: number
}

// 会计客户统计相关类型
export interface AccountantClientStatsItem {
  accountantName: string
  accountantType: 'consultantAccountant' | 'bookkeepingAccountant' | 'invoiceOfficer'
  clientCount: number
  department?: string
}

export interface AccountantClientData {
  list: AccountantClientStatsItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  summary: {
    totalAccountants: number
    totalClients: number
    averageClientsPerAccountant: number
    topPerformer: {
      name: string
      clientCount: number
    }
  }
}

// 新增客户相关类型
export interface NewCustomerItem {
  customerId: number
  companyName: string
  unifiedSocialCreditCode: string
  createTime: string
  consultantAccountant: string | null
  bookkeepingAccountant: string | null
  customerLevel: string | null
  contributionAmount: number | null
  month: string
}

export interface MonthlyNewCustomerStats {
  month: string
  totalCount: number
  authorizedCount: number
  details: NewCustomerItem[]
}

export interface NewCustomerData {
  list: NewCustomerItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  summary: {
    totalNewCustomers: number
    averagePerMonth: number
  }
}

// 客户等级分布相关类型

// 客户记录类型（用于表格显示）
export interface CustomerLevelItem {
  customerId: number
  companyName: string
  unifiedSocialCreditCode: string
  contributionAmount: string // API返回字符串格式
  level: string
}

// 等级统计类型（用于统计摘要）
export interface CustomerLevelStatsItem {
  level: string
  count: number
  percentage: number
  totalRevenue: number
  averageRevenue: number
}

// 原有的分布项类型（向后兼容）
export interface CustomerLevelDistributionItem extends CustomerLevelStatsItem {}

export interface CustomerLevelDistributionData {
  list: CustomerLevelItem[] // 客户列表数据
  total: number
  page: number
  pageSize: number
  totalPages: number
  levelStats: CustomerLevelStatsItem[] // 等级统计数据
  summary: {
    totalCustomers: number
    totalRevenue: number
  }
  // 向后兼容字段
  distribution?: CustomerLevelStatsItem[]
}

// 仪表盘汇总数据类型
export interface ReportsDashboardData {
  summary: {
    agencyFeeDecreaseCount: number
    expiringCustomersCount: number
    churnedCustomersCount: number
    totalEmployeeRevenue: number
  }
  charts: {
    employeePerformance: EmployeePerformanceItem[]
    accountantDistribution: AccountantClientStatsItem[]
    churnTrend: CustomerChurnStatsItem[]
    newCustomer: MonthlyNewCustomerStats[]
    customerLevel: CustomerLevelDistributionItem[]
  }
  lists: {
    agencyFeeDecreaseCustomers: AgencyFeeDecreaseCustomer[]
    expiringCustomers: ExpiringCustomerItem[]
  }
}

// Chart.js 数据类型
export interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    fill?: boolean
  }>
}

// 查询参数类型
export interface ReportsQueryParams {
  month?: string
  year?: number
  threshold?: number
  department?: string
  employeeName?: string
}

// 表格元数据类型
export interface ReportTableMetadata {
  sortableFields: string[]
  defaultSort: {
    field: string
    order: 'ASC' | 'DESC'
  }
  filterableFields: Array<{
    field: string
    type: 'text' | 'select' | 'date' | 'dateRange' | 'month'
    options?: Array<{ label: string; value: string }>
  }>
  pagination: {
    defaultPageSize: number
    pageSizeOptions: number[]
    showSizeChanger: boolean
    showQuickJumper: boolean
  }
}
