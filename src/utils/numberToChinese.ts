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
  const cnDecUnits = ['角', '分', '毫', '厘']

  // 整数金额时后面跟的字符
  const cnInteger = '整'
  // 整型完以后的单位
  const cnIntLast = '元'

  // 最大处理的数字
  const maxNum = 999999999999999.9999

  let integerNum: number // 金额整数部分
  let decimalNum: number // 金额小数部分
  let chineseStr = '' // 输出的中文金额字符串
  let parts: string[] // 分离金额后用的数组，预定义

  if (num >= maxNum) {
    return ''
  }

  if (num === 0) {
    chineseStr = cnNums[0] + cnIntLast + cnInteger
    return chineseStr
  }

  // 转换为字符串
  const money = num.toString()
  if (money.indexOf('.') === -1) {
    integerNum = num
    decimalNum = 0
  } else {
    parts = money.split('.')
    integerNum = parseInt(parts[0], 10)
    decimalNum = parseInt(parts[1].substring(0, 4).padEnd(4, '0'), 10)
  }

  // 获取整型部分转换
  if (integerNum > 0) {
    let zeroCount = 0
    const IntLen = integerNum.toString().length
    for (let i = 0; i < IntLen; i++) {
      const n = integerNum.toString().substring(i, i + 1)
      const p = IntLen - i - 1
      const q = p / 4
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
  }

  // 小数部分
  if (decimalNum > 0) {
    const decLen = decimalNum.toString().length
    for (let i = 0; i < decLen; i++) {
      const n = decimalNum.toString().substring(i, i + 1)
      if (n !== '0') {
        chineseStr += cnNums[parseInt(n)] + cnDecUnits[i]
      }
    }
  }

  if (chineseStr === '') {
    chineseStr += cnNums[0] + cnIntLast + cnInteger
  } else if (decimalNum === 0) {
    chineseStr += cnInteger
  }

  return chineseStr
}
