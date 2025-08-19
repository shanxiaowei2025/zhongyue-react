import { useCallback } from 'react'
import { message } from 'antd'
import { createNotification } from '../api/notification'
import { useAuthStore } from '../store/auth'
import { Expense } from '../types/expense'
import {
  shouldSendCelebrationNotification,
  getMonthlyExpenseCount,
  getMaxAmountProject,
  generateCelebrationContent,
} from '../utils/notificationHelper'

/**
 * 费用通知Hook - 处理费用创建成功后的通知发送
 */
export const useExpenseNotification = () => {
  const { user } = useAuthStore()

  /**
   * 发送费用创建成功的喜报通知
   */
  const sendExpenseNotification = useCallback(
    async (expense: Expense) => {
      try {
        // 获取必要的数据
        const totalFee = parseFloat(String(expense.totalFee || 0))
        const businessType = expense.businessType
        const salesperson = expense.salesperson

        // 检查是否需要发送通知
        if (!shouldSendCelebrationNotification(totalFee, businessType)) {
          console.log('不满足发送喜报通知的条件', { totalFee, businessType })
          return
        }

        // 检查必要数据
        if (!user?.department?.name) {
          console.warn('无法获取用户部门信息，跳过通知发送')
          return
        }

        if (!salesperson) {
          console.warn('业务员信息为空，跳过通知发送')
          return
        }

        // 获取本月单数（当前费用已创建，所以计数包含了这一单）
        const monthlyCount = await getMonthlyExpenseCount(salesperson)

        // 获取本次项目名称（金额最大的项目）
        const projectName = getMaxAmountProject(expense)

        // 生成通知内容
        const content = generateCelebrationContent({
          departmentName: user.department.name,
          salesperson,
          totalAmount: totalFee,
          monthlyCount,
          projectName,
        })

        // 发送通知给管理员
        await createNotification({
          title: '喜报',
          content,
          type: '费用',
          targetRoles: ['admin'],
        })

        console.log('费用喜报通知发送成功', {
          salesperson,
          totalAmount: totalFee,
          monthlyCount,
          projectName,
        })

        // 可选：显示成功提示（静默模式，不干扰用户）
        // message.success('喜报通知已发送给管理员')
      } catch (error) {
        console.error('发送费用通知失败:', error)
        // 通知发送失败不应该影响主要业务流程，所以只记录错误，不显示错误消息
      }
    },
    [user]
  )

  return {
    sendExpenseNotification,
  }
}
