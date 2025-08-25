import { useState } from 'react'
import useSWR from 'swr'
import { message } from 'antd'
import { commissionApi } from '../api/commission'
import type {
  BusinessSalesCommission,
  BusinessConsultantCommission,
  BusinessOtherCommission,
  PerformanceCommission,
  CommissionRateQuery,
  CommissionRateResult,
} from '../api/commission'

// 提成数据汇总
export interface CommissionSummary {
  sales: BusinessSalesCommission[]
  consultant: BusinessConsultantCommission[]
  other: BusinessOtherCommission[]
  performance: PerformanceCommission[]
}

export const useCommission = () => {
  const [loading, setLoading] = useState(false)

  // 获取所有提成配置数据
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
    sales: Array.isArray(salesData) ? salesData : [],
    consultant: Array.isArray(consultantData) ? consultantData : [],
    other: Array.isArray(otherData) ? otherData : [],
    performance: Array.isArray(performanceData) ? performanceData : [],
  }

  // 刷新所有数据
  const refreshAll = async () => {
    await Promise.all([mutateSales(), mutateConsultant(), mutateOther(), mutatePerformance()])
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
      // 错误处理由拦截器统一处理
      return null
    } finally {
      setLoading(false)
    }
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
        // 错误处理由拦截器统一处理
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
        // 错误处理由拦截器统一处理
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
        // 错误处理由拦截器统一处理
        throw error
      } finally {
        setLoading(false)
      }
    },
  }

  // 业务顾问提成操作
  const consultantOperations = {
    create: async (data: Omit<BusinessConsultantCommission, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setLoading(true)
        const result = await commissionApi.consultant.create(data)
        await mutateConsultant()
        message.success('业务顾问提成配置创建成功')
        return result
      } catch (error) {
        console.error('创建业务顾问提成配置失败:', error)
        // 错误处理由拦截器统一处理
        throw error
      } finally {
        setLoading(false)
      }
    },

    update: async (id: number, data: Partial<BusinessConsultantCommission>) => {
      try {
        setLoading(true)
        const result = await commissionApi.consultant.update(id, data)
        await mutateConsultant()
        message.success('业务顾问提成配置更新成功')
        return result
      } catch (error) {
        console.error('更新业务顾问提成配置失败:', error)
        // 错误处理由拦截器统一处理
        throw error
      } finally {
        setLoading(false)
      }
    },

    delete: async (id: number) => {
      try {
        setLoading(true)
        await commissionApi.consultant.delete(id)
        await mutateConsultant()
        message.success('业务顾问提成配置删除成功')
      } catch (error) {
        console.error('删除业务顾问提成配置失败:', error)
        // 错误处理由拦截器统一处理
        throw error
      } finally {
        setLoading(false)
      }
    },
  }

  // 业务其他提成操作
  const otherOperations = {
    create: async (data: Omit<BusinessOtherCommission, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setLoading(true)
        const result = await commissionApi.other.create(data)
        await mutateOther()
        message.success('业务其他提成配置创建成功')
        return result
      } catch (error) {
        console.error('创建业务其他提成配置失败:', error)
        // 错误处理由拦截器统一处理
        throw error
      } finally {
        setLoading(false)
      }
    },

    update: async (id: number, data: Partial<BusinessOtherCommission>) => {
      try {
        setLoading(true)
        const result = await commissionApi.other.update(id, data)
        await mutateOther()
        message.success('业务其他提成配置更新成功')
        return result
      } catch (error) {
        console.error('更新业务其他提成配置失败:', error)
        // 错误处理由拦截器统一处理
        throw error
      } finally {
        setLoading(false)
      }
    },

    delete: async (id: number) => {
      try {
        setLoading(true)
        await commissionApi.other.delete(id)
        await mutateOther()
        message.success('业务其他提成配置删除成功')
      } catch (error) {
        console.error('删除业务其他提成配置失败:', error)
        // 错误处理由拦截器统一处理
        throw error
      } finally {
        setLoading(false)
      }
    },
  }

  // 绩效提成操作
  const performanceOperations = {
    create: async (data: Omit<PerformanceCommission, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        setLoading(true)
        const result = await commissionApi.performance.create(data)
        await mutatePerformance()
        message.success('绩效提成配置创建成功')
        return result
      } catch (error) {
        console.error('创建绩效提成配置失败:', error)
        // 错误处理由拦截器统一处理
        throw error
      } finally {
        setLoading(false)
      }
    },

    update: async (id: number, data: Partial<PerformanceCommission>) => {
      try {
        setLoading(true)
        const result = await commissionApi.performance.update(id, data)
        await mutatePerformance()
        message.success('绩效提成配置更新成功')
        return result
      } catch (error) {
        console.error('更新绩效提成配置失败:', error)
        // 错误处理由拦截器统一处理
        throw error
      } finally {
        setLoading(false)
      }
    },

    delete: async (id: number) => {
      try {
        setLoading(true)
        await commissionApi.performance.delete(id)
        await mutatePerformance()
        message.success('绩效提成配置删除成功')
      } catch (error) {
        console.error('删除绩效提成配置失败:', error)
        // 错误处理由拦截器统一处理
        throw error
      } finally {
        setLoading(false)
      }
    },
  }

  return {
    // 数据
    commissionSummary,
    loading,

    // 错误信息
    errors: {
      sales: salesError,
      consultant: consultantError,
      other: otherError,
      performance: performanceError,
    },

    // 操作
    refreshAll,
    getCommissionRate,
    salesOperations,
    consultantOperations,
    otherOperations,
    performanceOperations,
  }
}

export default useCommission
