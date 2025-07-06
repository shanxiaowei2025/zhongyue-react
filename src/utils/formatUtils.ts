import dayjs from 'dayjs'

/**
 * 格式化空值，统一将空值显示为 "/"
 * @param value 任意值
 * @returns 格式化后的字符串
 */
export const formatEmptyValue = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return '/'
  }
  return String(value)
}

/**
 * 格式化文本字段
 * @param text 文本内容
 * @returns 格式化后的文本
 */
export const formatText = (text: string | null | undefined): string => {
  return formatEmptyValue(text)
}

/**
 * 格式化货币金额，空值或0值显示为 "/"
 * @param amount 金额数值
 * @returns 格式化后的金额字符串
 */
export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '' || amount === 0) {
    return '/'
  }
  return String(amount)
}

/**
 * 格式化日期，空值显示为 "/"
 * @param dateString 日期字符串
 * @param format 日期格式，默认为 'YYYY年MM月DD日'
 * @returns 格式化后的日期字符串
 */
export const formatDate = (
  dateString?: string | null,
  format: string = 'YYYY年MM月DD日'
): string => {
  if (!dateString) return '/'
  return dayjs(dateString).format(format)
}

/**
 * 处理任意类型的日期显示
 * @param date 日期值（字符串、Date对象等）
 * @param format 日期格式，默认为 'YYYY年MM月DD日'
 * @returns 格式化后的日期字符串
 */
export const formatAnyDate = (date: any, format: string = 'YYYY年MM月DD日'): string => {
  if (!date) return '/'
  if (typeof date === 'string') return formatDate(date, format)
  if (date instanceof Date) return formatDate(date.toISOString(), format)
  return '/'
}

/**
 * 格式化货币金额并添加单位
 * @param amount 金额数值
 * @param unit 货币单位，默认为 '元'
 * @returns 带单位的格式化金额字符串
 */
export const formatCurrencyWithUnit = (
  amount: number | string | null | undefined,
  unit: string = '元'
): string => {
  const formatted = formatCurrency(amount)
  return formatted === '/' ? '/' : `${amount}${unit}`
}

/**
 * 格式化代理记账合同中的金额，保留两位小数
 * 用于代理记账合同中的专门金额显示
 * @param amount 金额数值
 * @returns 格式化后的金额字符串（保留两位小数）
 */
export const formatAgencyFee = (amount?: number | string | null): string => {
  // 处理空值情况
  if (amount === undefined || amount === null || amount === '') return '0.00'

  // 转换为数字类型
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  // 检查是否为有效数字
  if (isNaN(numAmount) || !isFinite(numAmount)) return '0.00'

  return numAmount.toFixed(2)
}

/**
 * 格式化费用金额，空值显示为 "0.00"
 * 专门用于费用字段的显示
 * @param amount 金额数值
 * @returns 格式化后的金额字符串
 */
export const formatFeeAmount = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || amount === '' || amount === 0) {
    return '0.00'
  }

  // 转换为数字类型
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  // 检查是否为有效数字
  if (isNaN(numAmount) || !isFinite(numAmount)) return '0.00'

  return numAmount.toFixed(2)
}

/**
 * 格式化费用金额并添加单位，空值显示为 "0.00元"
 * @param amount 金额数值
 * @param unit 货币单位，默认为 '元'
 * @returns 带单位的格式化金额字符串
 */
export const formatFeeAmountWithUnit = (
  amount: number | string | null | undefined,
  unit: string = '元'
): string => {
  const formatted = formatFeeAmount(amount)
  return `${formatted}${unit}`
}
