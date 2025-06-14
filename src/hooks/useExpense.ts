import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { message } from 'antd'
import {
  getExpenseList,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  auditExpense,
  cancelAuditExpense,
  getExpenseReceipt,
} from '../api/expense'
import {
  Expense,
  ExpenseQueryParams,
  CreateExpenseDto,
  UpdateExpenseDto,
  AuditExpenseDto,
  CancelAuditDto,
  ReceiptViewDto,
} from '../types/expense'

// 定义获取费用列表的key
export const getExpenseListKey = (params: ExpenseQueryParams) => {
  return ['/expense', params]
}

// 定义获取费用详情的key
export const getExpenseDetailKey = (id?: number | null) => {
  return id ? `/expense/${id}` : null
}

// 定义获取费用收据的key
export const getExpenseReceiptKey = (params?: { id?: number; receiptNo?: string } | null) => {
  if (!params || (!params.id && !params.receiptNo)) return null
  
  // 生成唯一的key，优先使用id，其次使用receiptNo
  if (params.id) {
    return `/expense/receipt?id=${params.id}`
  } else if (params.receiptNo) {
    return `/expense/receipt?receiptNo=${params.receiptNo}`
  }
  
  return null
}

// 费用列表数据获取函数
export const expenseListFetcher = async ([url, params]: [string, ExpenseQueryParams]) => {
  try {
    // 处理请求参数，确保日期范围正确传递
    const queryParams = { ...params }

    // 处理日期范围
    if (params.dateRange && Array.isArray(params.dateRange)) {
      queryParams.chargeDateStart = Array.isArray(params.dateRange[0])
        ? params.dateRange[0][0]
        : params.dateRange[0].format?.('YYYY-MM-DD') || params.dateRange[0]

      queryParams.chargeDateEnd = Array.isArray(params.dateRange[1])
        ? params.dateRange[1][0]
        : params.dateRange[1].format?.('YYYY-MM-DD') || params.dateRange[1]

      // 删除原始dateRange参数，避免发送不必要的数据
      delete queryParams.dateRange
    }

    // 确保page和pageSize参数是有效的数字
    queryParams.page = Number(queryParams.page) || 1
    queryParams.pageSize = Number(queryParams.pageSize) || 10

    const response = await getExpenseList(queryParams)

    // 确保我们正确处理API响应结构
    if (!response.data || !response.data.list) {
      console.error('API响应格式不正确:', response)
      return {
        expenses: [],
        total: 0,
        page: queryParams.page,
        pageSize: queryParams.pageSize,
      }
    }

    return {
      expenses: response.data.list,
      total: response.data.total || 0,
      page: response.data.currentPage || queryParams.page,
      pageSize: response.data.pageSize || queryParams.pageSize,
    }
  } catch (error) {
    console.error('获取费用列表失败:', error)
    throw error
  }
}

// 费用详情数据获取函数
export const expenseDetailFetcher = async (url: string) => {
  try {
    const response = await getExpenseById(Number(url.split('/').pop()))
    console.log('费用详情API响应:', response)

    // 从响应中提取data部分（与receipt fetcher保持一致的处理方式）
    const expenseData = response.data
    console.log('费用详情数据提取:', expenseData)

    return expenseData
  } catch (error) {
    console.error('获取费用详情失败:', error)
    throw error
  }
}

// 费用收据数据获取函数
export const expenseReceiptFetcher = async (url: string) => {
  try {
    if (!url) return null

    // 解析URL参数
    const urlObj = new URL(url, 'http://dummy.com') // 使用dummy域名来解析查询参数
    const id = urlObj.searchParams.get('id')
    const receiptNo = urlObj.searchParams.get('receiptNo')

    if (!id && !receiptNo) {
      console.error('无效的收据URL，缺少id或receiptNo参数:', url)
      return null
    }

    // 构建API调用参数
    const params: { id?: number; receiptNo?: string } = {}
    if (id) params.id = Number(id)
    if (receiptNo) params.receiptNo = receiptNo

    const response = await getExpenseReceipt(params)

    // 从响应中提取data部分
    const receiptData = response.data

    // 仅在开发环境且只有首次获取时记录详细日志
    if (process.env.NODE_ENV === 'development') {
      console.log(`获取费用收据成功:`, { id, receiptNo })
    }

    // 确保返回有效的对象，即使API返回不完整数据
    return (
      receiptData || {
        id: params.id || 0,
        companyName: '未知企业',
        totalFee: 0,
        chargeDate: new Date().toISOString(),
        chargeMethod: '未知',
        remarks: '',
        receiptNo: params.receiptNo || `R${new Date().getTime()}`,
        feeItems: [], // 确保有一个空的feeItems数组
      }
    )
  } catch (error) {
    console.error('获取费用收据失败:', error)
    // 返回空数据而不是null，避免使用时出现undefined错误
    return {
      id: 0,
      companyName: '数据加载失败',
      totalFee: 0,
      chargeDate: new Date().toISOString(),
      chargeMethod: '',
      remarks: '',
      receiptNo: `R${new Date().getTime()}`,
      feeItems: [], // 确保有一个空的feeItems数组
    }
  }
}

// 费用列表Hook
export const useExpenseList = (params: ExpenseQueryParams) => {
  // 确保params包含必要的参数
  const validParams = {
    ...params,
    page: params.page || 1,
    pageSize: params.pageSize || 10,
  }

  const { data, error, isLoading, isValidating } = useSWR(
    getExpenseListKey(validParams),
    expenseListFetcher
  )

  // 刷新费用列表
  const refreshExpenseList = async () => {
    await mutate(getExpenseListKey(validParams))
  }

  // 删除费用
  const removeExpense = async (id: number) => {
    try {
      await deleteExpense(id)
      message.success('删除成功')
      await refreshExpenseList()
      return true
    } catch (error) {
      console.error('删除费用失败:', error)
      message.error('删除失败')
      return false
    }
  }

  // 审核费用
  const doAuditExpense = async (id: number, auditData: AuditExpenseDto) => {
    try {
      await auditExpense(id, auditData)
      message.success('审核成功')
      await refreshExpenseList()
      return true
    } catch (error) {
      console.error('审核费用失败:', error)
      message.error('审核失败')
      return false
    }
  }

  // 取消审核
  const doCancelAudit = async (id: number, cancelData: CancelAuditDto) => {
    try {
      await cancelAuditExpense(id, cancelData)
      message.success('取消审核成功')
      await refreshExpenseList()
      return true
    } catch (error) {
      console.error('取消审核失败:', error)
      message.error('取消审核失败')
      return false
    }
  }

  return {
    expenses: data?.expenses || [],
    total: data?.total || 0,
    page: data?.page || validParams.page,
    pageSize: data?.pageSize || validParams.pageSize,
    isLoading,
    isValidating,
    error,
    refreshExpenseList,
    removeExpense,
    auditExpense: doAuditExpense,
    cancelAudit: doCancelAudit,
  }
}

// 费用详情Hook
export const useExpenseDetail = (id?: number | null) => {
  const { data, error, isLoading, isValidating } = useSWR(
    getExpenseDetailKey(id),
    id ? expenseDetailFetcher : null,
    {
      revalidateOnFocus: false, // 防止焦点切换时自动重新验证
      dedupingInterval: 5000, // 5秒内相同请求只发送一次
      errorRetryCount: 2, // 失败后重试次数
      onSuccess: data => {
        console.log('useExpenseDetail fetch success:', data)
      },
      onError: err => {
        console.error('useExpenseDetail fetch error:', err)
        message.error('获取费用详情失败')
      },
    }
  )

  // 刷新费用详情
  const refreshExpenseDetail = async () => {
    if (id) {
      console.log('刷新费用详情, id:', id)
      await mutate(getExpenseDetailKey(id))
    }
  }

  // 更新费用
  const updateExpenseData = async (expenseId: number, updateData: UpdateExpenseDto) => {
    try {
      console.log('更新费用数据, id:', expenseId, 'data:', updateData)
      const res = await updateExpense(expenseId, updateData)

      // 刷新当前详情数据
      await refreshExpenseDetail()

      // 同时刷新列表数据
      await mutate(key => {
        return Array.isArray(key) && key[0] === '/expense'
      })

      return res
    } catch (error) {
      console.error('更新费用失败:', error)
      message.error('更新失败')
      throw error
    }
  }

  // 创建费用
  const createExpenseData = async (createData: CreateExpenseDto) => {
    try {
      const res = await createExpense(createData)

      // 刷新列表数据
      await mutate(key => {
        return Array.isArray(key) && key[0] === '/expense'
      })

      return res
    } catch (error) {
      console.error('创建费用失败:', error)
      message.error('创建失败')
      throw error
    }
  }

  return {
    expense: data as Expense | undefined,
    isLoading,
    isValidating,
    error,
    refreshExpenseDetail,
    updateExpense: updateExpenseData,
    createExpense: createExpenseData,
  }
}

// 费用收据Hook
export const useExpenseReceipt = (params?: { id?: number; receiptNo?: string } | null) => {
  const { data: receipt, error, isLoading, isValidating } = useSWR(
    getExpenseReceiptKey(params),
    params ? expenseReceiptFetcher : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5 * 60 * 1000, // 5分钟内不重复请求
    }
  )

  return {
    receipt,
    isLoading,
    isValidating,
    error,
  }
}
