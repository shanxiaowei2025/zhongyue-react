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
  exportExpenseCSV,
  getMaxDatesNextDay,
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

/**
 * 通用的接口响应体处理方法（仅开发环境）
 * 检测响应体中的所有字段，如果发现JSON字符串格式的数组或对象就进行解析
 * @param data 原始响应数据
 * @returns 处理后的响应数据
 */
const processResponseData = (data: any): any => {
  // 只在开发环境中处理
  if (process.env.NODE_ENV !== 'development' || !data) {
    return data
  }

  // 如果是基础类型，直接返回
  if (typeof data !== 'object' || data === null) {
    return data
  }

  // 如果是数组，递归处理每个元素
  if (Array.isArray(data)) {
    return data.map(item => processResponseData(item))
  }

  // 处理对象的每个属性
  const processedData = { ...data }

  Object.keys(processedData).forEach(key => {
    const value = processedData[key]

    // 如果值是字符串，检查是否为JSON格式
    if (typeof value === 'string' && value.trim()) {
      try {
        const trimmedValue = value.trim()

        // 检查是否是JSON数组格式 ["item1", "item2"] 或 "[\"item1\", \"item2\"]"
        if (
          (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) ||
          (trimmedValue.startsWith('"[') && trimmedValue.endsWith(']"'))
        ) {
          let jsonString = trimmedValue
          // 如果是被双引号包围的，先去掉外层双引号
          if (trimmedValue.startsWith('"[') && trimmedValue.endsWith(']"')) {
            jsonString = trimmedValue.slice(1, -1)
          }

          const parsed = JSON.parse(jsonString)
          if (Array.isArray(parsed)) {
            processedData[key] = parsed
            console.log(`[开发环境] 转换数组字段 ${key}:`, parsed)
          }
        }
        // 检查是否是JSON对象格式 {"key": "value"} 或 "{\"key\": \"value\"}"
        else if (
          (trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) ||
          (trimmedValue.startsWith('"{') && trimmedValue.endsWith('}"'))
        ) {
          let jsonString = trimmedValue
          // 如果是被双引号包围的，先去掉外层双引号
          if (trimmedValue.startsWith('"{') && trimmedValue.endsWith('}"')) {
            jsonString = trimmedValue.slice(1, -1)
          }

          const parsed = JSON.parse(jsonString)
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            processedData[key] = parsed
            console.log(`[开发环境] 转换对象字段 ${key}:`, parsed)
          }
        }
      } catch (error) {
        // JSON解析失败时静默处理，保持原值
        console.warn(`[开发环境] 字段 ${key} JSON解析失败:`, error)
      }
    }
    // 如果值是对象或数组，递归处理
    else if (typeof value === 'object' && value !== null) {
      processedData[key] = processResponseData(value)
    }
  })

  return processedData
}

// 费用列表数据获取函数
export const expenseListFetcher = async ([url, params]: [string, ExpenseQueryParams]) => {
  try {
    // 处理请求参数，确保日期范围正确传递
    const queryParams = { ...params }

    // 处理收费日期范围
    if (params.dateRange && Array.isArray(params.dateRange)) {
      queryParams.chargeDateStart = Array.isArray(params.dateRange[0])
        ? params.dateRange[0][0]
        : params.dateRange[0]?.format?.('YYYY-MM-DD') || params.dateRange[0]

      queryParams.chargeDateEnd = Array.isArray(params.dateRange[1])
        ? params.dateRange[1][0]
        : params.dateRange[1]?.format?.('YYYY-MM-DD') || params.dateRange[1]

      // 删除原始dateRange参数，避免发送不必要的数据
      delete queryParams.dateRange
    } else {
      // 确保当dateRange为undefined或null时，删除可能存在的日期参数
      delete queryParams.dateRange
      delete queryParams.chargeDateStart
      delete queryParams.chargeDateEnd
    }

    // 处理开据时间范围
    if (params.createDateRange && Array.isArray(params.createDateRange)) {
      queryParams.startDate = Array.isArray(params.createDateRange[0])
        ? params.createDateRange[0][0]
        : params.createDateRange[0]?.format?.('YYYY-MM-DD') || params.createDateRange[0]

      queryParams.endDate = Array.isArray(params.createDateRange[1])
        ? params.createDateRange[1][0]
        : params.createDateRange[1]?.format?.('YYYY-MM-DD') || params.createDateRange[1]

      // 删除原始createDateRange参数，避免发送不必要的数据
      delete queryParams.createDateRange
    } else {
      // 确保当createDateRange为undefined或null时，删除可能存在的日期参数
      delete queryParams.createDateRange
      delete queryParams.startDate
      delete queryParams.endDate
    }

    // 处理审核时间范围
    if (params.auditDateRange && Array.isArray(params.auditDateRange)) {
      queryParams.auditDateStart = Array.isArray(params.auditDateRange[0])
        ? params.auditDateRange[0][0]
        : params.auditDateRange[0]?.format?.('YYYY-MM-DD') || params.auditDateRange[0]

      queryParams.auditDateEnd = Array.isArray(params.auditDateRange[1])
        ? params.auditDateRange[1][0]
        : params.auditDateRange[1]?.format?.('YYYY-MM-DD') || params.auditDateRange[1]

      // 删除原始auditDateRange参数，避免发送不必要的数据
      delete queryParams.auditDateRange
    } else {
      // 确保当auditDateRange为undefined或null时，删除可能存在的日期参数
      delete queryParams.auditDateRange
      delete queryParams.auditDateStart
      delete queryParams.auditDateEnd
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

    // 从响应中提取data部分
    let expenseData = response.data

    // 使用通用响应处理方法（仅开发环境）
    expenseData = processResponseData(expenseData)

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
    let receiptData = response.data
    console.log('费用收据原始数据:', receiptData)

    // 使用通用响应处理方法（仅开发环境）
    receiptData = processResponseData(receiptData)

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
  const {
    data: receipt,
    error,
    isLoading,
    isValidating,
  } = useSWR(getExpenseReceiptKey(params), params ? expenseReceiptFetcher : null, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5 * 60 * 1000, // 5分钟内不重复请求
  })

  return {
    receipt,
    isLoading,
    isValidating,
    error,
  }
}

// 导出费用CSV文件
export const exportExpenseData = async (params: Partial<ExpenseQueryParams>) => {
  try {
    // 清理导出参数，移除分页参数
    const exportParams = { ...params }
    if ('page' in exportParams) {
      delete exportParams.page
    }
    if ('pageSize' in exportParams) {
      delete exportParams.pageSize
    }

    const response = await exportExpenseCSV(exportParams)
    return response
  } catch (error) {
    console.error('导出费用数据失败:', error)
    message.error('导出失败')
    throw error
  }
}

// 获取最大日期（用于自动填充）
export const getMaxDatesForAutoFill = async (params: {
  companyName?: string
  unifiedSocialCreditCode?: string
}) => {
  try {
    const response = await getMaxDatesNextDay(params)
    return response
  } catch (error) {
    console.error('获取最大日期失败:', error)
    throw error
  }
}
