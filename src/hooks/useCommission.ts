import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { message } from 'antd'
import { commissionApi } from '../api/commission'
import type {
  AgencyCommission,
  BusinessSalesCommission,
  BusinessConsultantCommission,
  BusinessOtherCommission,
  PerformanceCommission,
  CommissionRateQuery,
  CommissionRateResult,
} from '../api/commission'

// 提成数据汇总
export interface CommissionSummary {
  agency: AgencyCommission[]
  sales: BusinessSalesCommission[]
  consultant: BusinessConsultantCommission[]
  other: BusinessOtherCommission[]
  performance: PerformanceCommission[]
}

export const useCommission = () => {
  const [loading, setLoading] = useState(false)

  // 获取所有提成配置数据
  const {
    data: agencyData,
    mutate: mutateAgency,
    error: agencyError,
  } = useSWR('/commission/agency', commissionApi.agency.list, {
    onError: error => {
      console.error('获取代理费提成数据失败:', error)
    },
    fallbackData: [],
  })

  const {
    data: salesData,
    mutate: mutateSales,
    error: salesError,
  } = useSWR('/commission/sales', commissionApi.sales.list, {
    onError: error => {
      console.error('获取业务销售提成数据失败:', error)
    },
    fallbackData: [],
  })

  const {
    data: consultantData,
    mutate: mutateConsultant,
    error: consultantError,
  } = useSWR('/commission/consultant', commissionApi.consultant.list, {
    onError: error => {
      console.error('获取业务顾问提成数据失败:', error)
    },
    fallbackData: [],
  })

  const {
    data: otherData,
    mutate: mutateOther,
    error: otherError,
  } = useSWR('/commission/other', commissionApi.other.list, {
    onError: error => {
      console.error('获取业务其他提成数据失败:', error)
    },
    fallbackData: [],
  })

  const {
    data: performanceData,
    mutate: mutatePerformance,
    error: performanceError,
  } = useSWR('/commission/performance', commissionApi.performance.list, {
    onError: error => {
      console.error('获取绩效提成数据失败:', error)
    },
    fallbackData: [],
  })

  // 汇总所有提成数据 - 确保始终返回数组
  const commissionSummary: CommissionSummary = {
    agency: Array.isArray(agencyData) ? agencyData : [],
    sales: Array.isArray(salesData) ? salesData : [],
    consultant: Array.isArray(consultantData) ? consultantData : [],
    other: Array.isArray(otherData) ? otherData : [],
    performance: Array.isArray(performanceData) ? performanceData : [],
  }

  // 刷新所有数据
  const refreshAll = async () => {
    await Promise.all([
      mutateAgency(),
      mutateSales(),
      mutateConsultant(),
      mutateOther(),
      mutatePerformance(),
    ])
  }

  // 查询提成比率
  const getCommissionRate = async (
    params: CommissionRateQuery
  ): Promise<CommissionRateResult | null> => {
    try {
      setLoading(true)
      const result = await commissionApi.getCommissionRate(params)
      return result
    } catch (error) {
      console.error('查询提成比率失败:', error)
      message.error('查询提成比率失败')
      return null
    } finally {
      setLoading(false)
    }
  }

  // 代理费提成操作
  const agencyOperations = {
    create: async (data: Omit<AgencyCommission, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setLoading(true)
        const result = await commissionApi.agency.create(data)
        await mutateAgency()
        message.success('代理费提成配置创建成功')
        return result
      } catch (error) {
        console.error('创建代理费提成配置失败:', error)
        message.error('创建失败')
        throw error
      } finally {
        setLoading(false)
      }
    },

    update: async (id: number, data: Partial<AgencyCommission>) => {
      try {
        setLoading(true)
        const result = await commissionApi.agency.update(id, data)
        await mutateAgency()
        message.success('代理费提成配置更新成功')
        return result
      } catch (error) {
        console.error('更新代理费提成配置失败:', error)
        message.error('更新失败')
        throw error
      } finally {
        setLoading(false)
      }
    },

    delete: async (id: number) => {
      try {
        setLoading(true)
        await commissionApi.agency.delete(id)
        await mutateAgency()
        message.success('代理费提成配置删除成功')
      } catch (error) {
        console.error('删除代理费提成配置失败:', error)
        message.error('删除失败')
        throw error
      } finally {
        setLoading(false)
      }
    },
  }

  // 业务销售提成操作
  const salesOperations = {
    create: async (data: Omit<BusinessSalesCommission, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setLoading(true)
        const result = await commissionApi.sales.create(data)
        await mutateSales()
        message.success('业务销售提成配置创建成功')
        return result
      } catch (error) {
        console.error('创建业务销售提成配置失败:', error)
        message.error('创建失败')
        throw error
      } finally {
        setLoading(false)
      }
    },

    update: async (id: number, data: Partial<BusinessSalesCommission>) => {
      try {
        setLoading(true)
        const result = await commissionApi.sales.update(id, data)
        await mutateSales()
        message.success('业务销售提成配置更新成功')
        return result
      } catch (error) {
        console.error('更新业务销售提成配置失败:', error)
        message.error('更新失败')
        throw error
      } finally {
        setLoading(false)
      }
    },

    delete: async (id: number) => {
      try {
        setLoading(true)
        await commissionApi.sales.delete(id)
        await mutateSales()
        message.success('业务销售提成配置删除成功')
      } catch (error) {
        console.error('删除业务销售提成配置失败:', error)
        message.error('删除失败')
        throw error
      } finally {
        setLoading(false)
      }
    },
  }

  // 业务顾问提成操作（其他操作类似，为简洁起见省略）
  // ... 类似的 consultantOperations, otherOperations, performanceOperations

  return {
    // 数据
    commissionSummary,
    loading,

    // 错误信息
    errors: {
      agency: agencyError,
      sales: salesError,
      consultant: consultantError,
      other: otherError,
      performance: performanceError,
    },

    // 操作
    refreshAll,
    getCommissionRate,
    agencyOperations,
    salesOperations,
    // consultantOperations,
    // otherOperations,
    // performanceOperations,
  }
}

export default useCommission
