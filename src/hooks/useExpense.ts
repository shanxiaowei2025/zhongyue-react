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
  getExpenseReceipt
} from '../api/expense'
import { 
  Expense, 
  ExpenseQueryParams, 
  CreateExpenseDto, 
  UpdateExpenseDto, 
  AuditExpenseDto, 
  CancelAuditDto,
  ReceiptViewDto
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
export const getExpenseReceiptKey = (id?: number | null) => {
  return id ? `/expense/${id}/receipt` : null
}

// 费用列表数据获取函数
export const expenseListFetcher = async ([url, params]: [string, ExpenseQueryParams]) => {
  try {
    // 处理请求参数，确保日期范围正确传递
    const queryParams = { ...params };
    
    // 处理日期范围
    if (params.dateRange && Array.isArray(params.dateRange)) {
      queryParams.startDate = Array.isArray(params.dateRange[0]) 
        ? params.dateRange[0][0]
        : params.dateRange[0].format?.('YYYY-MM-DD') || params.dateRange[0];
        
      queryParams.endDate = Array.isArray(params.dateRange[1])
        ? params.dateRange[1][0]
        : params.dateRange[1].format?.('YYYY-MM-DD') || params.dateRange[1];
        
      // 删除原始dateRange参数，避免发送不必要的数据
      delete queryParams.dateRange;
    }
    
    // 确保page和pageSize参数是有效的数字
    queryParams.page = Number(queryParams.page) || 1;
    queryParams.pageSize = Number(queryParams.pageSize) || 10;
    
    const response = await getExpenseList(queryParams)
    
    // 确保我们正确处理API响应结构
    if (!response.data || !response.data.list) {
      console.error('API响应格式不正确:', response)
      return {
        expenses: [],
        total: 0,
        page: queryParams.page,
        pageSize: queryParams.pageSize
      }
    }
    
    return {
      expenses: response.data.list,
      total: response.data.total || 0,
      page: response.data.currentPage || queryParams.page,
      pageSize: response.data.pageSize || queryParams.pageSize
    }
  } catch (error) {
    console.error('获取费用列表失败:', error)
    throw error
  }
}

// 费用详情数据获取函数
export const expenseDetailFetcher = async (url: string) => {
  try {
    const res = await getExpenseById(Number(url.split('/').pop()))
    return res
  } catch (error) {
    console.error('获取费用详情失败:', error)
    throw error
  }
}

// 费用收据数据获取函数
export const expenseReceiptFetcher = async (url: string) => {
  try {
    if (!url) return null;
    
    // 提取ID
    const parts = url.split('/');
    if (parts.length < 3) {
      console.error('无效的收据URL:', url);
      return null;
    }
    
    const id = Number(parts[2]);
    if (isNaN(id) || id <= 0) {
      console.error('无效的费用ID:', id);
      return null;
    }
    
    const res = await getExpenseReceipt(id);
    
    // 确保返回有效的对象，即使API返回不完整数据
    return res || { 
      id,
      companyName: '未知企业',
      totalFee: 0,
      chargeDate: new Date().toISOString(),
      chargeMethod: '未知',
      remarks: ''
    };
  } catch (error) {
    console.error('获取费用收据失败:', error);
    // 返回空数据而不是null，避免使用时出现undefined错误
    return { 
      id: 0,
      companyName: '数据加载失败',
      totalFee: 0,
      chargeDate: new Date().toISOString(),
      chargeMethod: '',
      remarks: ''
    }; 
  }
}

// 费用列表Hook
export const useExpenseList = (params: ExpenseQueryParams) => {
  // 确保params包含必要的参数
  const validParams = {
    ...params,
    page: params.page || 1,
    pageSize: params.pageSize || 10
  };
  
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
    cancelAudit: doCancelAudit
  }
}

// 费用详情Hook
export const useExpenseDetail = (id?: number | null) => {
  const { data, error, isLoading, isValidating } = useSWR(
    getExpenseDetailKey(id),
    id ? expenseDetailFetcher : null
  )

  // 刷新费用详情
  const refreshExpenseDetail = async () => {
    if (id) {
      await mutate(getExpenseDetailKey(id))
    }
  }

  // 更新费用
  const updateExpenseData = async (expenseId: number, updateData: UpdateExpenseDto) => {
    try {
      const res = await updateExpense(expenseId, updateData)
      message.success('更新成功')
      
      // 刷新当前详情数据
      await refreshExpenseDetail()
      
      // 同时刷新列表数据
      await mutate((key) => {
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
      message.success('创建成功')
      
      // 刷新列表数据
      await mutate((key) => {
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
    createExpense: createExpenseData
  }
}

// 费用收据Hook
export const useExpenseReceipt = (id?: number | null) => {
  const { data, error, isLoading } = useSWR(
    getExpenseReceiptKey(id),
    id ? expenseReceiptFetcher : null,
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true, // 允许错误重试
      errorRetryCount: 2, // 增加重试次数
      errorRetryInterval: 1500, // 设置重试间隔
      fallbackData: { // 提供兜底数据
        id: id || 0,
        companyName: '加载中...',
        totalFee: 0,
        chargeDate: new Date().toISOString(),
        chargeMethod: '',
        remarks: ''
      },
      onError: (err) => {
        console.error("获取收据数据错误:", err);
        message.error("获取收据数据失败，请稍后再试");
      }
    }
  );

  return {
    receipt: data as ReceiptViewDto | undefined,
    isLoading,
    error,
    hasError: !!error
  }
} 