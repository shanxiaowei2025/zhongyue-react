import { useMemo } from 'react'
import { useAuthStore } from '../../../store/auth'
import { isAdminUser } from '../../../utils/permissionUtils'
import { useAgencyFeeAnalysis } from './useAgencyFeeAnalysis'
import { useEmployeePerformance } from './useEmployeePerformance'
import { useCustomerChurnStats } from './useCustomerChurnStats'
import { useServiceExpiryStats } from './useServiceExpiryStats'
import { useAccountantClientStats } from './useAccountantClientStats'
import { useNewCustomerStats } from './useNewCustomerStats'
import { useCustomerLevelDistribution } from './useCustomerLevelDistribution'
import type { ReportsDashboardData, NewCustomerItem } from '../types/reports'

interface UseReportsDashboardParams {
  month?: string
  year?: number
  threshold?: number
}

export const useReportsDashboard = (params: UseReportsDashboardParams = {}) => {
  const { user } = useAuthStore()
  const isAdmin = isAdminUser(user)

  const {
    month = new Date().toISOString().slice(0, 7), // 默认当前月份 YYYY-MM
    year = new Date().getFullYear(),
    threshold = 500,
  } = params

  // 并行获取所有报表数据
  const {
    data: agencyFeeData,
    isLoading: agencyFeeLoading,
    error: agencyFeeError,
    refresh: refreshAgencyFee,
  } = useAgencyFeeAnalysis({
    year, // 添加年份参数，使其响应年月变化
    threshold,
    pageSize: 10,
    sortField: 'decreaseAmount',
    sortOrder: 'DESC',
  })

  const {
    data: employeeData,
    isLoading: employeeLoading,
    error: employeeError,
    refresh: refreshEmployee,
  } = useEmployeePerformance({ month })

  const {
    data: churnData,
    isLoading: churnLoading,
    error: churnError,
    refresh: refreshChurn,
  } = useCustomerChurnStats({ year, month: parseInt(month.split('-')[1]) })

  const {
    data: expiryData,
    isLoading: expiryLoading,
    error: expiryError,
    refresh: refreshExpiry,
  } = useServiceExpiryStats({
    pageSize: 10,
    sortField: 'agencyEndDate',
    sortOrder: 'DESC',
  })

  // 只有管理员才获取会计负责客户数据
  const accountantParams = isAdmin
    ? {
        page: 1,
        pageSize: 99999, // 增加pageSize确保获取足够的记账会计数据用于图表展示
        sortField: 'clientCount',
        sortOrder: 'DESC' as const,
        accountantType: 'bookkeepingAccountant', // 只获取记账会计数据
      }
    : {}

  const {
    data: accountantData,
    isLoading: accountantLoading,
    error: accountantError,
    refresh: refreshAccountant,
  } = useAccountantClientStats(accountantParams)

  // 计算最近6个月的日期范围
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  sixMonthsAgo.setDate(1) // 设置为月初

  const today = new Date()

  const {
    data: newCustomerData,
    isLoading: newCustomerLoading,
    error: newCustomerError,
    refresh: refreshNewCustomer,
  } = useNewCustomerStats({
    startDate: sixMonthsAgo.toISOString().split('T')[0], // YYYY-MM-DD格式
    endDate: today.toISOString().split('T')[0], // YYYY-MM-DD格式
    pageSize: 9999999, // 获取足够的数据用于图表展示
    sortField: 'createTime',
    sortOrder: 'DESC',
  })

  const {
    data: customerLevelData,
    isLoading: customerLevelLoading,
    error: customerLevelError,
    refresh: refreshCustomerLevel,
  } = useCustomerLevelDistribution()

  // 检查是否有任何数据正在加载
  const isLoading =
    agencyFeeLoading ||
    employeeLoading ||
    churnLoading ||
    expiryLoading ||
    accountantLoading ||
    newCustomerLoading ||
    customerLevelLoading

  // 检查是否有错误
  const error =
    agencyFeeError ||
    employeeError ||
    churnError ||
    expiryError ||
    accountantError ||
    newCustomerError ||
    customerLevelError

  // 调试日志：检查到期客户数据
  console.log('=== 到期客户数据调试 ===')
  console.log('expiryData:', expiryData)
  console.log('expiryData?.totalExpiredCustomers:', expiryData?.totalExpiredCustomers)
  console.log('expiryData?.total:', expiryData?.total)

  // 组合仪表盘数据
  const dashboardData: ReportsDashboardData = useMemo(() => {
    // 将新增客户数据按月份分组
    const monthlyNewCustomerStats = newCustomerData?.list
      ? Object.entries(
          newCustomerData.list.reduce(
            (acc, customer) => {
              const month = customer.month
              if (!acc[month]) {
                acc[month] = {
                  month,
                  totalCount: 0,
                  authorizedCount: 0, // 保留字段以保持类型兼容，但不使用
                  details: [],
                }
              }
              acc[month].totalCount++
              acc[month].details.push(customer)
              return acc
            },
            {} as Record<
              string,
              {
                month: string
                totalCount: number
                authorizedCount: number
                details: NewCustomerItem[]
              }
            >
          )
        )
          .map(([_, stats]) => stats)
          .sort((a, b) => a.month.localeCompare(b.month))
      : []

    return {
      summary: {
        agencyFeeDecreaseCount: agencyFeeData?.total || 0,
        expiringCustomersCount: expiryData?.totalExpiredCustomers || expiryData?.total || 0,
        churnedCustomersCount: churnData?.summary?.totalChurned || 0,
        totalEmployeeRevenue: employeeData?.summary?.totalRevenue || 0,
      },
      charts: {
        employeePerformance: employeeData?.list || [],
        accountantDistribution: isAdmin ? accountantData?.list || [] : [],
        churnTrend: churnData?.periodStats || [],
        newCustomer: monthlyNewCustomerStats,
        customerLevel: customerLevelData?.levelStats || customerLevelData?.distribution || [],
      },
      lists: {
        agencyFeeDecreaseCustomers: agencyFeeData?.list || [],
        expiringCustomers: expiryData?.list || [],
      },
    }
  }, [
    agencyFeeData,
    employeeData,
    churnData,
    expiryData,
    accountantData,
    newCustomerData,
    customerLevelData,
  ])

  // 刷新所有数据的函数
  const refreshAll = () => {
    // 触发所有数据的重新获取
    refreshAgencyFee()
    refreshEmployee()
    refreshChurn()
    refreshExpiry()
    refreshAccountant()
    refreshNewCustomer()
    refreshCustomerLevel()
  }

  return {
    dashboardData,
    isLoading,
    error,
    refreshAll,
    // 暴露原始数据以便详细查看
    rawData: {
      agencyFeeData,
      employeeData,
      churnData,
      expiryData,
      accountantData,
    },
  }
}
