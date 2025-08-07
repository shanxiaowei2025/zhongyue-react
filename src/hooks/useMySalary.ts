import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { message } from 'antd'
import { mySalaryApi, getMySalaryKeys } from '../api/mySalary'
import { useSalaryAuthStore } from '../store/salaryAuth'
import type {
  MySalaryRecord,
  MySalaryQueryParams,
  MySalaryDetail,
  MySalaryStatistics,
  ConfirmSalaryResponse,
} from '../types/mySalary'

// 我的薪资主Hook
export const useMySalary = () => {
  const [selectedRecord, setSelectedRecord] = useState<MySalaryRecord | null>(null)
  const [selectedYearMonth, setSelectedYearMonth] = useState(() => {
    const now = new Date()
    // 默认显示上个月
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1)
    return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
  })

  // 获取薪资认证状态 - 直接订阅tokenInfo以确保响应式更新
  const tokenInfo = useSalaryAuthStore(state => state.tokenInfo)

  // 计算token是否有效
  const isTokenValid = () => {
    if (!tokenInfo) return false
    const now = Date.now()
    return tokenInfo.expiresAt > now
  }

  // 获取有效的token
  const getValidToken = () => {
    if (!tokenInfo || !isTokenValid()) {
      return null
    }
    return tokenInfo.token
  }

  // 生成查询参数
  const getQueryParams = (yearMonth: string) => {
    const year = yearMonth.split('-')[0]
    const startDate = `${year}-01-01`
    const endDate = `${year}-12-31`
    return { startDate, endDate, pageSize: 50 }
  }

  // 获取我的薪资列表 - 只有有效token时才发起请求
  const token = getValidToken()
  const hasValidToken = isTokenValid()
  const {
    data: salaryListData,
    isLoading: isListLoading,
    error: listError,
    mutate: mutateSalaryList,
  } = useSWR(
    hasValidToken && token
      ? [...getMySalaryKeys.salaryList(getQueryParams(selectedYearMonth)), token]
      : null,
    hasValidToken && token
      ? () => mySalaryApi.getMySalaryList(getQueryParams(selectedYearMonth))
      : null,
    {
      revalidateOnFocus: false,
      fallbackData: {
        data: [],
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
      },
    }
  )

  // 获取选中薪资记录的详情 - 只有有效token时才发起请求
  const {
    data: salaryDetail,
    isLoading: isDetailLoading,
    error: detailError,
    mutate: mutateSalaryDetail,
  } = useSWR(
    hasValidToken && token && selectedRecord
      ? [...getMySalaryKeys.salaryDetail(selectedRecord.id), token]
      : null,
    hasValidToken && token && selectedRecord
      ? () => mySalaryApi.getMySalaryDetail(selectedRecord.id)
      : null,
    {
      revalidateOnFocus: false,
    }
  )

  // 计算统计信息
  const statistics: MySalaryStatistics = mySalaryApi.calculateMySalaryStatistics(
    salaryListData?.data || []
  )

  // 操作方法
  const operations = {
    // 确认薪资记录
    confirmSalary: useCallback(
      async (id: number): Promise<ConfirmSalaryResponse> => {
        try {
          message.loading('正在确认薪资记录...', 0)

          const result = await mySalaryApi.confirmSalary(id)

          message.destroy()
          message.success('薪资记录确认成功')

          // 刷新数据
          await mutateSalaryList()
          if (selectedRecord && selectedRecord.id === id) {
            await mutateSalaryDetail()
          }

          return result
        } catch (error: any) {
          message.destroy()
          message.error(`确认薪资记录失败: ${error.message}`)
          throw error
        }
      },
      [mutateSalaryList, mutateSalaryDetail, selectedRecord]
    ),

    // 刷新数据
    refreshData: useCallback(async () => {
      try {
        await Promise.all([
          mutateSalaryList(),
          selectedRecord ? mutateSalaryDetail() : Promise.resolve(),
        ])
        message.success('数据刷新成功')
      } catch (error: any) {
        message.error(`刷新数据失败: ${error.message}`)
      }
    }, [mutateSalaryList, mutateSalaryDetail, selectedRecord]),

    // 切换月份
    switchMonth: useCallback((yearMonth: string) => {
      setSelectedYearMonth(yearMonth)
      setSelectedRecord(null) // 切换月份时清空选择
    }, []),

    // 选择薪资记录
    selectRecord: useCallback((record: MySalaryRecord | null) => {
      setSelectedRecord(record)
    }, []),
  }

  return {
    // 状态数据
    selectedRecord,
    selectedYearMonth,
    salaryList: salaryListData?.data || [],
    salaryDetail,
    statistics,
    loading: isListLoading || isDetailLoading,
    error: listError || detailError,

    // 操作方法
    operations,

    // 快捷方法
    refreshData: operations.refreshData,
  }
}

// 薪资列表Hook（支持分页）
export const useMySalaryList = (params: MySalaryQueryParams) => {
  const { data, error, isLoading, mutate } = useSWR(
    getMySalaryKeys.salaryList(params),
    () => mySalaryApi.getMySalaryList(params),
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    }
  )

  return {
    salaryList: data?.data || [],
    total: data?.total || 0,
    page: data?.page || 1,
    pageSize: data?.pageSize || 10,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

// 薪资详情Hook
export const useMySalaryDetail = (id: number | null) => {
  const { data, error, isLoading, mutate } = useSWR(
    id ? getMySalaryKeys.salaryDetail(id) : null,
    () => mySalaryApi.getMySalaryDetail(id!),
    {
      revalidateOnFocus: false,
    }
  )

  const detailData: MySalaryDetail | null = data ? mySalaryApi.buildSalaryDetail(data) : null

  return {
    salaryRecord: data,
    detailData,
    isLoading,
    error,
    refresh: mutate,
  }
}

// 薪资统计Hook
export const useMySalaryStatistics = (yearMonth?: string) => {
  const { salaryList } = useMySalaryList({
    yearMonth,
    pageSize: 100, // 获取更多数据用于统计
  })

  const statistics = mySalaryApi.calculateMySalaryStatistics(salaryList)

  return {
    statistics,
    isLoading: false,
    error: null,
  }
}
