/**
 * 数字转中文大写金额
 * @param num 数字
 * @returns 中文大写金额字符串
 */
export function numberToChinese(num: number): string {
  if (isNaN(num) || num < 0) {
    return ''
  }

  if (num === 0) {
    return '零元整'
  }

  // 中文数字
  const cnNums = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  // 基本单位
  const cnIntRadice = ['', '拾', '佰', '仟']
  // 对应整数部分扩展单位
  const cnIntUnits = ['', '万', '亿', '兆']
  // 对应小数部分单位
  const cnDecUnits = ['角', '分']

  // 整数金额时后面跟的字符
  const cnInteger = '整'
  // 整型完以后的单位
  const cnIntLast = '元'

  // 最大处理的数字
  const maxNum = 999999999999999.99

  let integerNum: number // 金额整数部分
  let decimalNum: number // 金额小数部分
  let chineseStr = '' // 输出的中文金额字符串
  let parts: string[] // 分离金额后用的数组，预定义

  if (num >= maxNum) {
    return ''
  }

  // 四舍五入到分（小数点后两位）
  const roundedNum = Math.round(num * 100) / 100

  if (roundedNum === 0) {
    return '零元整'
  }

  // 转换为字符串
  const money = roundedNum.toFixed(2)
  parts = money.split('.')
  integerNum = parseInt(parts[0], 10)
  
  // 处理小数部分，只取角分两位
  const decimalStr = parts[1] || '00'
  const jiao = parseInt(decimalStr.charAt(0), 10) // 角
  const fen = parseInt(decimalStr.charAt(1), 10)  // 分

  // 获取整型部分转换
  if (integerNum > 0) {
    let zeroCount = 0
    const IntLen = integerNum.toString().length
    for (let i = 0; i < IntLen; i++) {
      const n = integerNum.toString().substring(i, i + 1)
      const p = IntLen - i - 1
      const q = Math.floor(p / 4)
      const m = p % 4
      if (n === '0') {
        zeroCount++
      } else {
        if (zeroCount > 0) {
          chineseStr += cnNums[0]
        }
        // 归零
        zeroCount = 0
        chineseStr += cnNums[parseInt(n)] + cnIntRadice[m]
      }
      if (m === 0 && zeroCount < 4) {
        chineseStr += cnIntUnits[q]
      }
    }
    chineseStr += cnIntLast
  } else {
    // 如果整数部分为0，则不显示"零元"
  }

  // 处理小数部分（角分）
  let hasDecimal = false
  
  if (jiao > 0) {
    chineseStr += cnNums[jiao] + cnDecUnits[0] // 角
    hasDecimal = true
  }
  
  if (fen > 0) {
    // 如果有角但角为0，需要加"零"
    if (jiao === 0 && integerNum > 0) {
      chineseStr += cnNums[0]
    }
    chineseStr += cnNums[fen] + cnDecUnits[1] // 分
    hasDecimal = true
  }

  // 如果没有小数部分，加"整"
  if (!hasDecimal) {
    if (integerNum > 0) {
      chineseStr += cnInteger
    } else {
      chineseStr = '零元整'
    }
  }

  return chineseStr
}

/**
 * 格式化金额输入，确保最多两位小数
 * @param value 输入值
 * @returns 格式化后的金额字符串
 */
export function formatAmount(value: string | number): string {
  if (!value && value !== 0) return ''
  
  const str = value.toString()
  
  // 移除非数字和小数点的字符
  const cleaned = str.replace(/[^\d.]/g, '')
  
  // 处理多个小数点的情况
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('')
  }
  
  // 限制小数点后最多两位
  if (parts.length === 2) {
    return parts[0] + '.' + parts[1].substring(0, 2)
  }
  
  return cleaned
}

/**
 * 解析金额字符串为数字，保留两位小数
 * @param value 金额字符串
 * @returns 数字值
 */
export function parseAmount(value: string | number): number {
  if (!value && value !== 0) return 0
  
  const num = parseFloat(value.toString())
  if (isNaN(num)) return 0
  
  // 四舍五入到两位小数
  return Math.round(num * 100) / 100
}

/**
 * 验证金额输入是否有效
 * @param value 输入值
 * @returns 是否有效
 */
export function isValidAmount(value: string): boolean {
  if (!value.trim()) return true // 空值认为有效
  
  // 正则表达式：允许整数或最多两位小数的数字
  const regex = /^\d+(\.\d{1,2})?$/
  return regex.test(value.trim())
}
