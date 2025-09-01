import type {
  VoucherStatus,
  VoucherRecordYear,
  VoucherRecordMonth,
  VoucherRecordTableRow,
  BatchOperationType,
  BatchOperationConfig,
  MonthStatusUpdateDto,
} from '../types/voucherRecord'
import { VOUCHER_STATUS_MAP } from '../types/voucherRecord'

/**
 * 将后端状态字符串转换为前端状态枚举
 */
export const mapBackendStatusToFrontend = (backendStatus?: string): VoucherStatus => {
  if (!backendStatus) return 'not_set'

  const statusMap: Record<string, VoucherStatus> = {
    已完成: 'completed',
    完成: 'completed',
    已整理: 'completed',
    未完成: 'incomplete',
    未整理: 'incomplete',
    进行中: 'incomplete',
    处理中: 'incomplete',
    无需整理: 'not_required',
    不需要: 'not_required',
    无需: 'not_required',
    未设置: 'not_set',
    '': 'not_set',
  }

  return statusMap[backendStatus] || 'not_set'
}

/**
 * 将前端状态枚举转换为后端状态字符串
 */
export const mapFrontendStatusToBackend = (frontendStatus: VoucherStatus): string => {
  const statusMap: Record<VoucherStatus, string> = {
    completed: '已完成',
    incomplete: '未完成',
    not_required: '无需整理',
    not_set: '未设置',
  }

  return statusMap[frontendStatus] || '未设置'
}

/**
 * 获取状态显示信息
 */
export const getStatusDisplay = (status: VoucherStatus) => {
  return VOUCHER_STATUS_MAP[status] || VOUCHER_STATUS_MAP.not_set
}

/**
 * 计算完成率
 */
export const calculateCompletionRate = (months: VoucherRecordMonth[]): number => {
  if (!months || months.length === 0) return 0

  const completedCount = months.filter(month => {
    const status = mapBackendStatusToFrontend(month.status)
    return status === 'completed'
  }).length

  return Math.round((completedCount / 12) * 100)
}

/**
 * 获取月份状态统计
 */
export const getMonthStatusStats = (months: VoucherRecordMonth[]) => {
  const stats = {
    completed: 0,
    incomplete: 0,
    not_required: 0,
    not_set: 0,
  }

  // 初始化12个月，默认为未设置
  const monthsMap: Record<number, VoucherStatus> = {}
  for (let i = 1; i <= 12; i++) {
    monthsMap[i] = 'not_set'
  }

  // 更新实际的月份状态
  months.forEach(month => {
    if (month.month >= 1 && month.month <= 12) {
      monthsMap[month.month] = mapBackendStatusToFrontend(month.status)
    }
  })

  // 统计各状态数量
  Object.values(monthsMap).forEach(status => {
    stats[status]++
  })

  return {
    stats,
    monthsMap,
    completionRate: Math.round((stats.completed / 12) * 100),
  }
}

/**
 * 将年度记录转换为表格行数据
 */
export const convertToTableRow = (yearRecord: VoucherRecordYear): VoucherRecordTableRow => {
  const { stats, monthsMap, completionRate } = getMonthStatusStats(yearRecord.months || [])

  return {
    customerId: yearRecord.customerId,
    companyName: yearRecord.customer?.companyName || '',
    bookkeepingAccountant: yearRecord.customer?.bookkeepingAccountant,
    consultantAccountant: yearRecord.customer?.consultantAccountant,
    year: yearRecord.year,
    storageLocation: yearRecord.storageLocation,
    handler: yearRecord.handler,
    months: monthsMap,
    completionRate,
    withdrawalRecord: yearRecord.withdrawalRecord,
    generalRemarks: yearRecord.generalRemarks,
    yearRecordId: yearRecord.id,
  }
}

/**
 * 批量操作配置
 */
export const BATCH_OPERATION_CONFIGS: BatchOperationConfig[] = [
  {
    type: 'set_completed',
    label: '全部完成',
    status: 'completed',
    color: '#52c41a',
  },
  {
    type: 'set_incomplete',
    label: '全部未完成',
    status: 'incomplete',
    color: '#faad14',
  },
  {
    type: 'set_not_required',
    label: '全部无需整理',
    status: 'not_required',
    color: '#1890ff',
  },
  {
    type: 'set_not_set',
    label: '全部重置',
    status: 'not_set',
    color: '#d9d9d9',
  },
]

/**
 * 生成批量更新数据
 */
export const generateBatchUpdateData = (
  operationType: BatchOperationType,
  months?: number[]
): MonthStatusUpdateDto[] => {
  const config = BATCH_OPERATION_CONFIGS.find(c => c.type === operationType)
  if (!config) return []

  const targetMonths = months || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  const backendStatus = mapFrontendStatusToBackend(config.status)

  return targetMonths.map(month => ({
    month,
    status: backendStatus,
    description: `批量设置为${config.label}`,
  }))
}

/**
 * 获取月份名称
 */
export const getMonthName = (month: number): string => {
  const monthNames = [
    '',
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ]
  return monthNames[month] || `${month}月`
}

/**
 * 验证年份是否有效
 */
export const isValidYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear()
  return year >= 2000 && year <= currentYear + 5
}

/**
 * 生成导出文件名
 */
export const generateExportFileName = (year?: number, customerId?: number): string => {
  const now = new Date()
  const timestamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_')

  let fileName = '凭证记录'
  if (year) fileName += `_${year}年`
  if (customerId) fileName += `_客户${customerId}`
  fileName += `_${timestamp}.xlsx`

  return fileName
}

/**
 * 格式化日期显示
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return dateString
  }
}

/**
 * 获取状态颜色（用于UI显示）
 */
export const getStatusColor = (status: VoucherStatus): string => {
  return VOUCHER_STATUS_MAP[status]?.color || '#d9d9d9'
}

/**
 * 检查是否为当前年份
 */
export const isCurrentYear = (year: number): boolean => {
  return year === new Date().getFullYear()
}
