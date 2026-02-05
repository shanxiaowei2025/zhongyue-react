import request from './request'
import type { Customer, PaginationParams, ApiResponse } from '../types'

// 获取客户列表
export const getCustomerList = (params: PaginationParams) => {
  // 客户列表查询参数处理

  // 手动构建查询字符串以确保正确格式
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      // 处理数组类型的参数（多选字段）
      if (Array.isArray(value)) {
        value.forEach(item => {
          // 允许空字符串，因为它用于查询空值
          if (item !== undefined && item !== null) {
            // 当值为 "__EMPTY__" 时，设置为空字符串以实现空值查询
            const paramValue = item === '__EMPTY__' ? '' : String(item)
            queryParams.append(key, paramValue)
          }
        })
      } else {
        // 处理字符串类型的参数
        // 当值为 "-" 时，设置为空字符串以实现空值查询
        if (value === '-') {
          queryParams.append(key, '')
        } else if (value !== '') {
          queryParams.append(key, String(value))
        }
      }
    }
  })

  const queryString = queryParams.toString()
  // 查询字符串构建完成

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
  return request.get<ApiResponse<Customer>>(`/customer/${id}`)
}

// 创建客户
export const createCustomer = (data: Partial<Customer>) => {
  // 移除可能引起错误的createTime和updateTime字段
  const { createTime: _createTime, updateTime: _updateTime, ...cleanData } = data

  // 客户数据清理完成

  return request.post<ApiResponse<Customer>>('/customer', cleanData)
}

// 更新客户
export const updateCustomer = (id: number, data: Partial<Customer>) => {
  // 移除可能引起错误的createTime和updateTime字段
  const { createTime: _createTime, updateTime: _updateTime, ...cleanData } = data

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

  // 客户更新数据处理完成

  return request.patch<ApiResponse<Customer>>(`/customer/${id}`, cleanData)
}

// 删除客户
export const deleteCustomer = (id: number) => {
  return request.delete<ApiResponse<Customer>>(`/customer/${id}`)
}

// 获取客户详情 - 别名，保持与getCustomerById一致
export const getCustomerDetail = (id: number) => {
  return request.get<ApiResponse<Customer>>(`/customer/${id}`)
}

// 提供异步版本的API函数，以兼容原先customers.ts中的实现
/**
 * 获取客户列表 - 异步版本
 * @param params 查询参数
 */
export const getCustomers = async (params: Record<string, unknown>) => {
  try {
    // 确保有必要的分页参数
    const paginationParams: PaginationParams = {
      page: (params.page as number) || 1,
      pageSize: (params.pageSize as number) || 10,
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
export const getPaginatedCustomers = async (params: Record<string, unknown>) => {
  try {
    // 确保有必要的分页参数
    const paginationParams: PaginationParams = {
      page: (params.page as number) || 1,
      pageSize: (params.pageSize as number) || 10,
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

export const exportCustomerCSV = (params?: Record<string, unknown>) => {
  // 如果提供了查询参数，构建查询字符串
  let queryString = ''
  if (params) {
    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // 处理数组类型的参数（多选字段）
        if (Array.isArray(value)) {
          value.forEach(item => {
            // 允许空字符串，因为它用于查询空值
            if (item !== undefined && item !== null) {
              // 当值为 "__EMPTY__" 时，设置为空字符串以实现空值查询
              const paramValue = item === '__EMPTY__' ? '' : String(item)
              queryParams.append(key, paramValue)
            }
          })
        } else {
          // 处理字符串类型的参数
          // 当值为 "-" 时，设置为空字符串以实现空值查询
          if (value === '-') {
            queryParams.append(key, '')
          } else if (value !== '') {
            queryParams.append(key, String(value))
          }
        }
      }
    })
    queryString = queryParams.toString()
  }

  return request.get(`/customer/export/csv${queryString ? `?${queryString}` : ''}`, {}, 'blob')
}

// 导入客户Excel文件
export const importCustomerExcel = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await request.post<
      ApiResponse<{
        success: boolean
        message: string
        count: number
        failedRecords?: Array<{
          index: number
          row: number
          companyName: string
          unifiedSocialCreditCode: string
          errors?: string[]
          reason: string
        }>
      }>
    >('/customer/import-excel', formData)

    return response
  } catch (error) {
    console.error('导入客户Excel文件出错:', error)
    throw error
  }
}

// 批量替换客户Excel文件
export const updateCustomerExcel = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await request.post<
      ApiResponse<{
        success: boolean
        message: string
        count: number
        failedRecords?: Array<{
          index: number
          row: number
          companyName: string
          unifiedSocialCreditCode: string
          errors?: string[]
          reason: string
        }>
      }>
    >('/customer/update-excel', formData)

    return response
  } catch (error) {
    console.error('批量替换客户Excel文件出错:', error)
    throw error
  }
}

// 获取客户分级的唯一值列表
export const getUniqueCustomerLevels = () => {
  return request.get<ApiResponse<string[]>>('/customer/unique-values/customer-level')
}

// 获取企业名称搜索建议
export const getCustomerSearchSuggestions = (keyword: string, limit: number = 10) => {
  return request.get<ApiResponse<Array<{
    id: number
    companyName: string
    unifiedSocialCreditCode: string
  }>>>(`/customer/search-suggestions?keyword=${encodeURIComponent(keyword)}&limit=${limit}`)
}

// 检查行政许可到期情况
export const checkLicenseExpiry = () => {
  return request.post<ApiResponse<{
    success: boolean
    message: string
    expiringCount: number
  }>>('/customer/check-license-expiry')
}
