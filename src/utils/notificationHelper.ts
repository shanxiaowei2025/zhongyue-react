import { getExpenseList } from '../api/expense'
import { ExpenseQueryParams, Expense } from '../types/expense'

/**
 * 费用项目名称映射
 * 按金额优先级排序，用于确定"本次项目"
 */
const FEE_PROJECT_MAP: Record<string, string> = {
  agencyFee: '代理记账',
  licenseFee: '新办执照',
  socialInsuranceAgencyFee: '社保代理',
  housingFundAgencyFee: '公积金代理',
  accountingSoftwareFee: '记账软件',
  invoiceSoftwareFee: '开票软件',
  statisticalReportFee: '统计报表',
  addressFee: '地址费',
  changeFee: '变更业务',
  administrativeLicenseFee: '行政许可',
  otherBusinessFee: '其他业务收费（基础）',
  otherBusinessOutsourcingFee: '其他业务收费',
  otherBusinessSpecialFee: '其他业务收费(特殊)',
  brandFee: '牌子费',
  recordSealFee: '备案章',
  generalSealFee: '一般刻章',
}

/**
 * 获取费用记录中最大金额对应的项目名称
 */
export const getMaxAmountProject = (expense: Expense): string => {
  let maxAmount = 0
  let maxProject = '代理记账' // 默认项目
  let maxFieldName = 'agencyFee' // 默认字段

  Object.entries(FEE_PROJECT_MAP).forEach(([fieldName, projectName]) => {
    const amount = parseFloat(String(expense[fieldName as keyof Expense] || 0))
    if (amount > maxAmount) {
      maxAmount = amount
      maxProject = projectName
      maxFieldName = fieldName
    }
  })

  // 处理特殊情况
  switch (maxFieldName) {
    case 'agencyFee':
      // 代理费显示代理类型
      return expense.agencyType || maxProject

    case 'changeFee':
      // 变更收费显示变更业务
      if (expense.changeBusiness) {
        const businesses = Array.isArray(expense.changeBusiness)
          ? expense.changeBusiness
          : [expense.changeBusiness]
        return `变更业务（${businesses.join('、')}）`
      }
      return maxProject

    case 'administrativeLicenseFee':
      // 行政许可显示具体许可项目
      if (expense.administrativeLicense) {
        const licenses = Array.isArray(expense.administrativeLicense)
          ? expense.administrativeLicense
          : [expense.administrativeLicense]
        return `行政许可（${licenses.join('、')}）`
      }
      return maxProject

    case 'otherBusinessFee':
      // 其他业务收费（基础）显示具体业务
      if (expense.otherBusiness) {
        const businesses = Array.isArray(expense.otherBusiness)
          ? expense.otherBusiness
          : [expense.otherBusiness]
        return `其他业务收费（基础）（${businesses.join('、')}）`
      }
      return maxProject

    case 'otherBusinessOutsourcingFee':
      // 其他业务收费显示具体业务
      if (expense.otherBusinessOutsourcing) {
        const businesses = Array.isArray(expense.otherBusinessOutsourcing)
          ? expense.otherBusinessOutsourcing
          : [expense.otherBusinessOutsourcing]
        return `其他业务收费（${businesses.join('、')}）`
      }
      return maxProject

    case 'otherBusinessSpecialFee':
      // 其他业务(特殊)显示具体业务
      if (expense.otherBusinessSpecial) {
        const businesses = Array.isArray(expense.otherBusinessSpecial)
          ? expense.otherBusinessSpecial
          : [expense.otherBusinessSpecial]
        return `其他业务(特殊)（${businesses.join('、')}）`
      }
      return maxProject

    default:
      return maxProject
  }
}

/**
 * 获取指定业务员在指定收费月份的费用单数
 * 只统计总金额大于等于1000元的费用单
 */
export const getMonthlyExpenseCount = async (salesperson: string, chargeDate?: string): Promise<number> => {
  try {
    // 如果提供了收费时间，使用收费时间所在月份；否则使用当前月份
    const targetDate = chargeDate ? new Date(chargeDate) : new Date()
    const year = targetDate.getFullYear()
    const month = targetDate.getMonth() + 1
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`

    // 计算月末日期
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    const endDate = new Date(nextYear, nextMonth - 1, 0).getDate()
    const endDateStr = `${year}-${month.toString().padStart(2, '0')}-${endDate.toString().padStart(2, '0')}`

    // 需要获取所有数据进行前端过滤，分页获取
    let allExpenses: Expense[] = []
    let currentPage = 1
    const pageSize = 100
    let hasMoreData = true

    while (hasMoreData) {
      const params: ExpenseQueryParams = {
        page: currentPage,
        pageSize,
        salesperson,
        chargeDateStart: startDate,
        chargeDateEnd: endDateStr,
        businessType: ['新增', ''], // 只统计新增业务和空业务类型，排除续费
      }

      const response = await getExpenseList(params)
      const { list, total, currentPage: responsePage } = response.data || {}

      if (list && list.length > 0) {
        allExpenses = allExpenses.concat(list)
      }

      // 检查是否还有更多数据
      hasMoreData = responsePage * pageSize < (total || 0)
      currentPage++
    }

    // 过滤掉总金额小于1000的费用单
    const validExpenses = allExpenses.filter(expense => {
      const totalFee = parseFloat(String(expense.totalFee || 0))
      return totalFee >= 1000
    })

    return validExpenses.length
  } catch (error) {
    console.error('获取本月费用单数失败:', error)
    return 0
  }
}

/**
 * 获取月份序数词（第一单、第二单等）
 */
export const getOrdinalNumber = (count: number): string => {
  const ordinals = [
    '',
    '第一单',
    '第二单',
    '第三单',
    '第四单',
    '第五单',
    '第六单',
    '第七单',
    '第八单',
    '第九单',
    '第十单',
  ]

  if (count <= 10) {
    return ordinals[count] || `第${count}单`
  }

  return `第${count}单`
}

/**
 * 生成喜报纯文本内容
 */
export const generateCelebrationContent = (data: {
  departmentName: string
  salesperson: string
  totalAmount: number
  monthlyCount: number
  projectName: string
}): string => {
  const { departmentName, salesperson, totalAmount, monthlyCount, projectName } = data
  const ordinalCount = getOrdinalNumber(monthlyCount)

  return `💎重大💎喜报💎
🔥开门大吉🎈开单无敌🔥
㊗㊗㊗恭㊗喜㊗㊗㊗
          ${departmentName}：${salesperson}
          成交金额：${totalAmount}
          本月单数：${ordinalCount} 
          本次项目：${projectName}
 ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈
👑👑努力成就结果👑👑
💯💯单单都是收获💯💯
是认可，也是实力的证明❗❗
┌─ ʚ 🙌🙌🙌 ɞ——🔺
👑👑愿再接再厉👑👑
💥💥勇攀高峰 更上一层楼💥💥`
}

/**
 * 判断是否需要发送喜报通知
 */
export const shouldSendCelebrationNotification = (
  totalFee: number,
  businessType: string | undefined
): boolean => {
  // 检查金额条件：大于等于1000
  if (totalFee < 1000) {
    return false
  }

  // 检查业务类型条件：新增或空值（非续费）
  if (businessType && businessType !== '新增') {
    return false
  }

  return true
}

/**
 * 修复说明：
 * 
 * 问题：通知中出现"第0单"和异常大数字（如"第1129单"）的问题
 * 
 * 原因：统计时间基准不一致
 * - 原来统计单数时使用当前系统时间的月份范围
 * - 但筛选条件使用的是费用记录的收费时间(chargeDate)
 * - 当收费时间和创建时间跨月时，会导致统计错误
 * 
 * 修复：
 * - getMonthlyExpenseCount 函数现在接受 chargeDate 参数
 * - 统计基于收费时间所在月份，确保时间基准一致
 * - 这样可以准确统计业务员在特定收费月份的单数
 * 
 * 场景示例：
 * - 收费时间：2024-08-29
 * - 创建时间：2024-09-01  
 * - 修复前：统计9月份单数，但收费时间在8月，导致计数错误
 * - 修复后：统计8月份单数，基于收费时间，计数正确
 */
