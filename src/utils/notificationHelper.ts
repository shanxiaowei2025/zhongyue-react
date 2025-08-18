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
  otherBusinessFee: '其他业务(自有)',
  otherBusinessOutsourcingFee: '其他业务(外包)',
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
      // 其他业务（自有）显示具体业务
      if (expense.otherBusiness) {
        const businesses = Array.isArray(expense.otherBusiness)
          ? expense.otherBusiness
          : [expense.otherBusiness]
        return `其他业务（自有）（${businesses.join('、')}）`
      }
      return maxProject

    case 'otherBusinessOutsourcingFee':
      // 其他业务（外包）显示具体业务
      if (expense.otherBusinessOutsourcing) {
        const businesses = Array.isArray(expense.otherBusinessOutsourcing)
          ? expense.otherBusinessOutsourcing
          : [expense.otherBusinessOutsourcing]
        return `其他业务（外包）（${businesses.join('、')}）`
      }
      return maxProject

    default:
      return maxProject
  }
}

/**
 * 获取本月指定业务员的费用单数
 */
export const getMonthlyExpenseCount = async (salesperson: string): Promise<number> => {
  try {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`

    // 计算月末日期
    const nextMonth = month === 12 ? 1 : month + 1
    const nextYear = month === 12 ? year + 1 : year
    const endDate = new Date(nextYear, nextMonth - 1, 0).getDate()
    const endDateStr = `${year}-${month.toString().padStart(2, '0')}-${endDate.toString().padStart(2, '0')}`

    const params: ExpenseQueryParams = {
      page: 1,
      pageSize: 1, // 只需要获取总数，不需要具体数据
      salesperson,
      chargeDateStart: startDate,
      chargeDateEnd: endDateStr,
    }

    const response = await getExpenseList(params)
    return response.data?.total || 0
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
