import request from './request'
import type { Customer } from '../types'

/**
 * 创建客户
 * @param data 客户数据
 */
export const createCustomer = async (data: Partial<Customer>): Promise<boolean> => {
  try {
    const response = await request.post('/api/customer', data)
    return response.code === 0
  } catch (error) {
    console.error('创建客户出错:', error)
    return false
  }
}

/**
 * 更新客户
 * @param id 客户ID
 * @param data 客户数据
 */
export const updateCustomer = async (id: number, data: Partial<Customer>): Promise<boolean> => {
  try {
    const response = await request.put(`/api/customer/${id}`, data)
    return response.code === 0
  } catch (error) {
    console.error('更新客户出错:', error)
    return false
  }
}

/**
 * 获取客户详情
 * @param id 客户ID
 */
export const getCustomerDetail = async (id: number): Promise<Customer | null> => {
  try {
    const response = await request.get<Customer>(`/api/customer/${id}`)
    return response.data
  } catch (error) {
    console.error('获取客户详情出错:', error)
    return null
  }
}

/**
 * 获取客户列表
 * @param params 查询参数
 */
export const getCustomerList = async (
  params: Record<string, any> = {}
): Promise<{
  items: Customer[]
  total: number
}> => {
  try {
    const response = await request.get('/api/customer', { params })
    return {
      items: response.data.items || [],
      total: response.data.total || 0,
    }
  } catch (error) {
    console.error('获取客户列表出错:', error)
    return { items: [], total: 0 }
  }
}
