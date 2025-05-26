import request from './request'
import type { Customer, PaginationParams, PaginatedResponse, ApiResponse } from '../types'

// 获取客户列表
export const getCustomerList = (params: PaginationParams) => {
  // 调试日志
  console.log('调用getCustomerList API, 原始参数:', params)

  // 手动构建查询字符串以确保正确格式
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value))
    }
  })

  const queryString = queryParams.toString()
  console.log('手动构建的查询字符串:', queryString)

  // 直接在URL中传递查询参数
  return request.get<
    ApiResponse<{
      items: Customer[]
      total: number
      page: number
      pageSize: number
      totalPages: number
    }>
  >(`/customer?${queryString}`)
}

// 获取客户详情
export const getCustomerById = (id: number) => {
  console.log('获取客户详情, ID:', id)
  return request.get<ApiResponse<Customer>>(`/customer/${id}`)
}

// 创建客户
export const createCustomer = (data: Partial<Customer>) => {
  // 移除可能引起错误的createTime和updateTime字段
  const { createTime, updateTime, ...cleanData } = data

  console.log('创建客户, 请求数据:', cleanData)

  return request.post<ApiResponse<Customer>>('/customer', cleanData)
}

// 更新客户
export const updateCustomer = (id: number, data: Partial<Customer>) => {
  // 移除可能引起错误的createTime和updateTime字段
  const { createTime, updateTime, ...cleanData } = data

  // 处理数值字段，确保发送到后端的是数字而不是字符串
  if (typeof cleanData.registeredCapital === 'string') {
    cleanData.registeredCapital = parseFloat(cleanData.registeredCapital)
  }

  // paidInCapital 不应该被转换为 number，它是一个数组
  // 移除错误的转换代码

  // 处理布尔值字段
  if (cleanData.hasTaxBenefits !== undefined) {
    cleanData.hasTaxBenefits = Boolean(cleanData.hasTaxBenefits)
  }

  console.log('更新客户, ID:', id, '请求数据:', cleanData)

  return request.patch<ApiResponse<Customer>>(`/customer/${id}`, cleanData)
}

// 删除客户
export const deleteCustomer = (id: number) => {
  console.log('删除客户, ID:', id)
  return request.delete<ApiResponse<Customer>>(`/customer/${id}`)
}

// 获取客户详情 - 别名，保持与getCustomerById一致
export const getCustomerDetail = (id: number) => {
  console.log('获取客户详情(别名), ID:', id)
  return request.get<ApiResponse<Customer>>(`/customer/${id}`)
}

// 提供异步版本的API函数，以兼容原先customers.ts中的实现
/**
 * 获取客户列表 - 异步版本
 * @param params 查询参数
 */
export const getCustomers = async (params: Record<string, any>) => {
  try {
    // 确保有必要的分页参数
    const paginationParams: PaginationParams = {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      ...params,
    }

    const response = await getCustomerList(paginationParams)
    return response.code === 0
      ? {
          items: response.data.items || [],
          total: response.data.total || 0,
        }
      : { items: [], total: 0 }
  } catch (error) {
    console.error('获取客户列表出错:', error)
    return { items: [], total: 0 }
  }
}

/**
 * 获取分页客户列表 - 异步版本
 * @param params 查询参数
 */
export const getPaginatedCustomers = async (params: Record<string, any>) => {
  try {
    // 确保有必要的分页参数
    const paginationParams: PaginationParams = {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      ...params,
    }

    const response = await getCustomerList(paginationParams)
    return {
      items: response.data.items || [],
      total: response.data.total || 0,
    }
  } catch (error) {
    console.error('获取分页客户列表出错:', error)
    return { items: [], total: 0 }
  }
}

export const exportCustomerCSV = () => {
  return request.get('/customer/export/csv', {}, 'blob')
}

// 导入客户Excel文件
export const importCustomerExcel = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const response = await request.post<
      ApiResponse<{
        success: boolean;
        message: string;
        count: number;
        failedRecords?: Array<{
          index: number;
          row: number;
          companyName: string;
          unifiedSocialCreditCode: string;
          errors?: string[];
          reason: string;
        }>;
      }>
    >('/customer/import-excel', formData);
    
    return response;
  } catch (error) {
    console.error('导入客户Excel文件出错:', error);
    throw error;
  }
}

// 批量替换客户Excel文件
export const updateCustomerExcel = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  
  try {
    const response = await request.post<
      ApiResponse<{
        success: boolean;
        message: string;
        count: number;
        failedRecords?: Array<{
          index: number;
          row: number;
          companyName: string;
          unifiedSocialCreditCode: string;
          errors?: string[];
          reason: string;
        }>;
      }>
    >('/customer/update-excel', formData);
    
    return response;
  } catch (error) {
    console.error('批量替换客户Excel文件出错:', error);
    throw error;
  }
}
