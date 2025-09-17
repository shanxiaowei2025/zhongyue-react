import { useState, useCallback } from 'react'
import { message } from 'antd'
import useSWR from 'swr'
import voucherRecordApi from '../api/voucherRecord'
import type {
  VoucherRecordYear,
  VoucherRecordMonth,
  CreateVoucherRecordYearDto,
  UpdateVoucherRecordYearDto,
  MonthStatusUpdateDto,
  QueryVoucherRecordDto,
  ExportVoucherRecordDto,
  PaginatedVoucherRecordResponse,
  MonthStatistics,
} from '../types/voucherRecord'

// 获取客户的年度记录列表
export const useCustomerVoucherRecords = (customerId?: number) => {
  const { data, error, mutate, isLoading } = useSWR(
    customerId ? `/voucher-record/customers/${customerId}/years` : null,
    () => voucherRecordApi.year.getByCustomer(customerId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
    }
  )

  return {
    records: data || [],
    isLoading: !data && !error,
    error,
    mutate,
  }
}

// 获取年度记录详情
export const useVoucherRecordYear = (yearRecordId?: number) => {
  const { data, error, mutate, isLoading } = useSWR(
    yearRecordId ? `/voucher-record/years/${yearRecordId}` : null,
    () => voucherRecordApi.year.getById(yearRecordId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  return {
    yearRecord: data,
    isLoading: !data && !error,
    error,
    mutate,
  }
}

// 获取年度记录列表（分页）
export const useVoucherRecordList = (params: QueryVoucherRecordDto) => {
  const { data, error, mutate, isLoading } = useSWR(
    ['/voucher-record/years', params],
    () => voucherRecordApi.year.list(params),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  return {
    data: data || { records: [], total: 0, page: 1, limit: 10, totalPages: 0 },
    isLoading: !data && !error,
    error,
    mutate,
  }
}

// 获取月度统计信息
export const useMonthStatistics = (yearRecordId?: number) => {
  const { data, error, mutate, isLoading } = useSWR(
    yearRecordId ? `/voucher-record/years/${yearRecordId}/statistics` : null,
    () => voucherRecordApi.batch.getMonthStatistics(yearRecordId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )

  return {
    statistics: data,
    isLoading: !data && !error,
    error,
    mutate,
  }
}

// 凭证记录操作Hook
export const useVoucherRecordActions = () => {
  const [loading, setLoading] = useState(false)

  // 创建年度记录
  const createYear = useCallback(async (data: CreateVoucherRecordYearDto) => {
    setLoading(true)
    try {
      const result = await voucherRecordApi.year.create(data)
      message.success('年度记录创建成功')
      return result
    } catch (error: any) {
      message.error(error.message || '创建年度记录失败')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // 更新年度记录
  const updateYear = useCallback(async (id: number, data: UpdateVoucherRecordYearDto) => {
    setLoading(true)
    try {
      const result = await voucherRecordApi.year.update(id, data)
      message.success('年度记录更新成功')
      return result
    } catch (error: any) {
      message.error(error.message || '更新年度记录失败')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // 删除年度记录
  const deleteYear = useCallback(async (id: number) => {
    setLoading(true)
    try {
      await voucherRecordApi.year.delete(id)
      message.success('年度记录删除成功')
    } catch (error: any) {
      message.error(error.message || '删除年度记录失败')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // 批量更新月度状态
  const batchUpdateMonthStatus = useCallback(
    async (yearRecordId: number, updates: MonthStatusUpdateDto[]) => {
      setLoading(true)
      try {
        const result = await voucherRecordApi.batch.batchUpdateMonthStatus(yearRecordId, updates)
        message.success('月度状态更新成功')
        return result
      } catch (error: any) {
        message.error(error.message || '更新月度状态失败')
        throw error
      } finally {
        setLoading(false)
      }
    },
    []
  )

  // 导出Excel
  const exportToExcel = useCallback(async (data: ExportVoucherRecordDto) => {
    setLoading(true)
    try {
      const blob = await voucherRecordApi.export.exportToExcel(data)

      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // 生成文件名
      const now = new Date()
      const timestamp = now.toISOString().slice(0, 19).replace(/[-:]/g, '').replace('T', '_')
      link.download = `凭证记录_${timestamp}.xlsx`

      // 触发下载
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      message.success('导出成功')
    } catch (error: any) {
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    createYear,
    updateYear,
    deleteYear,
    batchUpdateMonthStatus,
    exportToExcel,
  }
}
