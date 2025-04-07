import request from './request'
import type { Customer, PaginationParams, PaginatedResponse, ApiResponse } from '../types'

// 获取客户列表
export const getCustomerList = (params: PaginationParams) => {
  return request.get<ApiResponse<PaginatedResponse<Customer>>>('/customers', { params })
}

// 获取客户详情
export const getCustomerById = (id: number) => {
  return request.get<ApiResponse<Customer>>(`/customers/${id}`)
}

// 创建客户
export const createCustomer = (data: Partial<Customer>) => {
  return request.post<ApiResponse<Customer>>('/customers', data)
}

// 更新客户
export const updateCustomer = (id: number, data: Partial<Customer>) => {
  return request.put<ApiResponse<Customer>>(`/customers/${id}`, data)
}

// 删除客户
export const deleteCustomer = (id: number) => {
  return request.delete<ApiResponse<null>>(`/customers/${id}`)
}
