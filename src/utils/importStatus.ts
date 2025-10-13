import type { ImportType, ImportStatusRecord, ImportStatusStorage } from '../types/salaryIntegrated'

// 本地存储的键名
const STORAGE_KEY = 'salary_import_status'

/**
 * 生成存储键
 * @param type 导入类型
 * @param yearMonth 年月 (格式: YYYY-MM)
 */
const generateKey = (type: ImportType, yearMonth: string): string => {
  return `${yearMonth}_${type}`
}

/**
 * 从本地存储获取所有导入状态记录
 */
export const getImportStatusStorage = (): ImportStatusStorage => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      return {}
    }
    
    const parsed = JSON.parse(data)
    // 确保返回的是对象类型
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      console.warn('导入状态数据格式错误，已重置')
      return {}
    }
    
    return parsed
  } catch (error) {
    console.error('获取导入状态失败:', error)
    return {}
  }
}

/**
 * 保存导入状态到本地存储
 */
const saveImportStatusStorage = (storage: ImportStatusStorage): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storage))
  } catch (error) {
    console.error('保存导入状态失败:', error)
  }
}

/**
 * 记录导入状态
 * @param type 导入类型
 * @param yearMonth 导入的数据月份 (格式: YYYY-MM)
 * @param status 导入状态
 * @param message 状态消息
 */
export const recordImportStatus = (
  type: ImportType,
  yearMonth: string,
  status: 'success' | 'failure',
  message?: string
): void => {
  const storage = getImportStatusStorage()
  const key = generateKey(type, yearMonth)
  
  storage[key] = {
    type,
    yearMonth,
    status,
    importedAt: new Date().toISOString(),
    message,
  }
  
  saveImportStatusStorage(storage)
}

/**
 * 获取指定类型和月份的导入状态
 * @param type 导入类型
 * @param yearMonth 年月 (格式: YYYY-MM)
 * @returns 导入状态记录,如果不存在则返回 null
 */
export const getImportStatus = (
  type: ImportType,
  yearMonth: string
): ImportStatusRecord | null => {
  const storage = getImportStatusStorage()
  const key = generateKey(type, yearMonth)
  return storage[key] || null
}

/**
 * 获取当前月份的导入状态
 * @param type 导入类型
 * @returns 当前月份的导入状态记录,如果不存在则返回 null
 */
export const getCurrentMonthImportStatus = (type: ImportType): ImportStatusRecord | null => {
  const currentMonth = new Date().toISOString().slice(0, 7) // 格式: YYYY-MM
  return getImportStatus(type, currentMonth)
}

/**
 * 检查导入状态是否应该显示
 * 规则: 只显示当月的导入状态
 * @param record 导入状态记录
 * @returns 是否应该显示
 */
export const shouldDisplayImportStatus = (record: ImportStatusRecord | null): boolean => {
  if (!record) return false
  
  const now = new Date()
  const currentMonth = now.toISOString().slice(0, 7) // 格式: YYYY-MM
  const currentYear = now.getFullYear()
  const currentMonthNum = now.getMonth() + 1
  
  // 解析记录的年月
  const [recordYear, recordMonth] = record.yearMonth.split('-').map(Number)
  
  // 只显示当前月份的导入状态
  // 当前是10月,显示9月的导入状态
  const targetYear = currentMonthNum === 1 ? currentYear - 1 : currentYear
  const targetMonth = currentMonthNum === 1 ? 12 : currentMonthNum - 1
  
  return recordYear === targetYear && recordMonth === targetMonth
}

/**
 * 清理过期的导入状态记录
 * 删除不是当前月或上个月的记录
 */
export const cleanupExpiredImportStatus = (): void => {
  const storage = getImportStatusStorage()
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  
  const newStorage: ImportStatusStorage = {}
  
  Object.entries(storage).forEach(([key, record]) => {
    // 检查 record 是否存在且有 yearMonth 属性
    if (!record || !record.yearMonth) {
      return
    }
    
    const [recordYear, recordMonth] = record.yearMonth.split('-').map(Number)
    
    // 计算上个月
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
    
    // 保留当前月和上个月的记录
    const isCurrentMonth = recordYear === currentYear && recordMonth === currentMonth
    const isLastMonth = recordYear === lastMonthYear && recordMonth === lastMonth
    
    if (isCurrentMonth || isLastMonth) {
      newStorage[key] = record
    }
  })
  
  saveImportStatusStorage(newStorage)
}

/**
 * 清除所有导入状态记录 (用于测试或重置)
 */
export const clearAllImportStatus = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('清除导入状态失败:', error)
  }
}

