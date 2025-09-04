// 凭证记录相关类型定义

// 凭证状态枚举
export type VoucherStatus = 'completed' | 'incomplete' | 'not_required' | 'not_set'

// 凭证状态显示映射
export const VOUCHER_STATUS_MAP: Record<
  VoucherStatus,
  { label: string; color: string; emoji: string }
> = {
  completed: { label: '已完成', color: '#52c41a', emoji: '✅' },
  incomplete: { label: '未完成', color: '#faad14', emoji: '⚠️' },
  not_required: { label: '无需整理', color: '#1890ff', emoji: '🔵' },
  not_set: { label: '未设置', color: '#d9d9d9', emoji: '⚪' },
}

// 月度记录
export interface VoucherRecordMonth {
  id: number
  yearRecordId: number
  month: number // 1-12
  status: string
  description?: string
  createdAt: string
  updatedAt: string
}

// 年度记录
export interface VoucherRecordYear {
  id: number
  customerId: number
  year: number
  storageLocation?: string
  handler?: string
  withdrawalRecord?: string
  generalRemarks?: string
  createdAt: string
  updatedAt: string
  customer?: {
    id: number
    companyName: string
    bookkeepingAccountant?: string
    consultantAccountant?: string
  }
  months?: VoucherRecordMonth[]
}

// 创建年度记录DTO
export interface CreateVoucherRecordYearDto {
  customerId: number
  year: number
  storageLocation?: string
  handler?: string
  withdrawalRecord?: string
  generalRemarks?: string
}

// 更新年度记录DTO
export interface UpdateVoucherRecordYearDto {
  year?: number
  storageLocation?: string
  handler?: string
  withdrawalRecord?: string
  generalRemarks?: string
}

// 创建月度记录DTO
export interface CreateVoucherRecordMonthDto {
  yearRecordId: number
  month: number
  status?: string
  description?: string
}

// 更新月度记录DTO
export interface UpdateVoucherRecordMonthDto {
  month?: number
  status?: string
  description?: string
}

// 月度状态更新DTO
export interface MonthStatusUpdateDto {
  month: number
  status: string
  description?: string
}

// 批量删除月度记录DTO
export interface BatchDeleteMonthsDto {
  ids: number[]
}

// 查询凭证记录DTO
export interface QueryVoucherRecordDto {
  page?: number
  limit?: number
  customerId?: number
  year?: number
  storageLocation?: string
  handler?: string
  status?: string
  consultantAccountant?: string
  bookkeepingAccountant?: string
}

// 导出凭证记录DTO
export interface ExportVoucherRecordDto {
  customerIds?: number[]
  year?: number
  format?: 'excel' | 'csv'
  bookkeepingAccountant?: string
  consultantAccountant?: string
  includeMonthDetails?: boolean
}

// 分页响应
export interface PaginatedVoucherRecordResponse {
  records: VoucherRecordYear[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// 月度统计信息
export interface MonthStatistics {
  totalMonths: number
  completedCount: number
  incompleteCount: number
  notRequiredCount: number
  notSetCount: number
  completionRate: number
  statusDistribution: Record<string, number>
}

// 凭证记录权限
export interface VoucherRecordPermissions {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canExport: boolean
}

// 月份数据接口
export interface MonthData {
  status: VoucherStatus
  description?: string
  isRealData?: boolean // 标记是否为真实数据（非筛选填充）
}

// 凭证记录表格行数据（用于独立管理页面）
export interface VoucherRecordTableRow {
  customerId: number
  companyName: string
  bookkeepingAccountant?: string
  consultantAccountant?: string
  year: number
  storageLocation?: string
  handler?: string
  months: Record<number, MonthData> // 月份 -> 状态和描述映射
  completionRate: number
  withdrawalRecord?: string
  generalRemarks?: string
  yearRecordId?: number
}

// 批量操作类型
export type BatchOperationType =
  | 'set_completed'
  | 'set_incomplete'
  | 'set_not_required'
  | 'set_not_set'

// 批量操作配置
export interface BatchOperationConfig {
  type: BatchOperationType
  label: string
  status: VoucherStatus
  color: string
  months?: number[] // 指定月份，为空表示全部月份
}
