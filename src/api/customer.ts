import request from './request'
import type { Customer, PaginationParams, ApiResponse } from '../types'

// 获取客户列表
export const getCustomerList = (params: PaginationParams) => {
  // 调试日志
  console.log('调用getCustomerList API, 原始参数:', params);
  
  // 手动构建查询字符串以确保正确格式
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  console.log('手动构建的查询字符串:', queryString);
  
  // 直接在URL中传递查询参数
  return request.get<ApiResponse<{
    items: Customer[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }>>(`/customer?${queryString}`);
}

// 获取客户详情
export const getCustomerById = (id: number) => {
  console.log('获取客户详情, ID:', id);
  return request.get<ApiResponse<Customer>>(`/customer/${id}`);
}

// 创建客户
export const createCustomer = (data: Partial<Customer>) => {
  // 移除可能引起错误的createTime和updateTime字段
  const { createTime, updateTime, ...cleanData } = data;
  
  console.log('创建客户, 请求数据:', cleanData);
  
  return request.post<ApiResponse<Customer>>('/customer', cleanData);
}

// 更新客户
export const updateCustomer = (id: number, data: Partial<Customer>) => {
  // 移除可能引起错误的createTime和updateTime字段
  const { createTime, updateTime, ...cleanData } = data;
  
  console.log('更新客户, ID:', id, '请求数据:', cleanData);
  
  return request.patch<ApiResponse<Customer>>(`/customer/${id}`, cleanData);
}

// 删除客户
export const deleteCustomer = (id: number) => {
  console.log('删除客户, ID:', id);
  return request.delete<ApiResponse<Customer>>(`/customer/${id}`);
}
