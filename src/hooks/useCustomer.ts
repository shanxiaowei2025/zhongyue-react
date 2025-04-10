import useSWR, { mutate } from 'swr'
import { message } from 'antd'
import { 
  getCustomerList, 
  getCustomerById, 
  createCustomer as apiCreateCustomer, 
  updateCustomer as apiUpdateCustomer, 
  deleteCustomer as apiDeleteCustomer 
} from '../api/customer'
import type { Customer, PaginationParams } from '../types'

/**
 * 客户列表请求的SWR键生成器
 */
export const getCustomerListKey = (params: PaginationParams) => {
  const { page, pageSize, ...searchParams } = params
  const searchStr = Object.entries(searchParams)
    .filter(([_, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  
  return `/api/customers?page=${page}&pageSize=${pageSize}${searchStr ? `&${searchStr}` : ''}`
}

/**
 * 客户详情请求的SWR键生成器
 */
export const getCustomerDetailKey = (id?: number | null) => 
  id ? `/api/customers/${id}` : null

/**
 * 客户列表数据的fetcher函数
 */
export const customerListFetcher = async (url: string) => {
  // 从url中提取参数
  const urlObj = new URL(url, window.location.origin)
  const page = urlObj.searchParams.get('page') || '1'
  const pageSize = urlObj.searchParams.get('pageSize') || '10'
  
  // 提取搜索参数
  const searchParams: Record<string, any> = {}
  urlObj.searchParams.forEach((value, key) => {
    if (key !== 'page' && key !== 'pageSize') {
      searchParams[key] = value
    }
  })
  
  // 调用API
  const response = await getCustomerList({
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    ...searchParams
  })
  
  if (response && response.code === 0) {
    return response.data
  }
  
  throw new Error(response?.message || '获取客户列表失败')
}

/**
 * 客户详情数据的fetcher函数
 */
export const customerDetailFetcher = async (url: string) => {
  // 从url中提取id
  const id = url.split('/').pop()
  if (!id) throw new Error('缺少客户ID')
  
  const response = await getCustomerById(parseInt(id))
  
  if (response && response.code === 0) {
    return response.data
  }
  
  throw new Error(response?.message || '获取客户详情失败')
}

/**
 * 使用SWR获取客户列表的钩子
 */
export const useCustomerList = (params: PaginationParams) => {
  const { 
    data, 
    error, 
    isLoading, 
    isValidating 
  } = useSWR(
    getCustomerListKey(params),
    customerListFetcher,
    { 
      revalidateOnFocus: false,
      dedupingInterval: 3000
    }
  )
  
  // 刷新列表数据
  const refreshCustomerList = async () => {
    await mutate(getCustomerListKey(params))
  }
  
  // 删除客户
  const deleteCustomer = async (id: number) => {
    try {
      const response = await apiDeleteCustomer(id)
      
      if (response && response.code === 0) {
        message.success('客户删除成功')
        await refreshCustomerList()
        return true
      } else {
        message.error(response?.message || '删除失败，请稍后重试')
        return false
      }
    } catch (error: any) {
      console.error('删除客户出错:', error)
      message.error(error.message || '删除失败，请稍后重试')
      return false
    }
  }
  
  return {
    customerList: data?.items || [],
    pagination: {
      current: data?.page || 1,
      pageSize: data?.pageSize || 10,
      total: data?.total || 0
    },
    loading: isLoading || isValidating,
    error,
    refreshCustomerList,
    deleteCustomer
  }
}

/**
 * 使用SWR获取客户详情的钩子
 */
export const useCustomerDetail = (id?: number | null) => {
  const { 
    data: customer, 
    error, 
    isLoading, 
    isValidating, 
    mutate: mutateCustomer 
  } = useSWR(
    getCustomerDetailKey(id),
    id ? customerDetailFetcher : null,
    { 
      revalidateOnFocus: false 
    }
  )
  
  // 刷新客户详情
  const refreshCustomerDetail = async () => {
    if (id) {
      await mutateCustomer()
    }
  }
  
  // 更新客户
  const updateCustomer = async (customerId: number, data: Partial<Customer>) => {
    try {
      // 如果没有变更，直接返回成功
      if (Object.keys(data).length === 0) {
        message.info('未检测到修改内容')
        return true
      }
      
      console.log('更新客户数据:', data)
      const response = await apiUpdateCustomer(customerId, data)
      
      if (response && response.code === 0) {
        message.success('客户信息更新成功')
        
        // 刷新详情和列表
        await refreshCustomerDetail()
        await mutate((key: string) => key.startsWith('/api/customers?'), undefined, { revalidate: true })
        
        return true
      } else {
        message.error(response?.message || '更新失败，请稍后重试')
        return false
      }
    } catch (error: any) {
      console.error('更新客户出错:', error)
      throw error
    }
  }
  
  // 创建客户
  const createCustomer = async (data: Partial<Customer>) => {
    try {
      console.log('创建客户数据:', data)
      const response = await apiCreateCustomer(data)
      
      if (response && response.code === 0) {
        message.success('客户创建成功')
        
        // 刷新列表
        await mutate((key: string) => key.startsWith('/api/customers?'), undefined, { revalidate: true })
        
        return response.data
      } else {
        message.error(response?.message || '创建失败，请稍后重试')
        return null
      }
    } catch (error: any) {
      console.error('创建客户出错:', error)
      throw error
    }
  }
  
  return {
    customer,
    loading: isLoading || isValidating,
    error,
    refreshCustomerDetail,
    updateCustomer,
    createCustomer
  }
} 