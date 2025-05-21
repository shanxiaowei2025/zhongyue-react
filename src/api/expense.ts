import request from './request'
import {
  Expense,
  ExpenseQueryParams,
  CreateExpenseDto,
  UpdateExpenseDto,
  AuditExpenseDto,
  CancelAuditDto,
  ReceiptViewDto,
} from '../types/expense'

// 获取费用列表
export const getExpenseList = (params: ExpenseQueryParams) => {
  // 确保params对象始终包含必要的参数
  const queryParams = {
    ...params,
    page: params.page || 1,
    pageSize: params.pageSize || 10,
  }

  // 删除dateRange参数，使用chargeDateStart和chargeDateEnd代替
  if (queryParams.dateRange) {
    delete queryParams.dateRange
  }

  // 删除startDate和endDate字段，这些是旧字段
  if (queryParams.startDate) {
    delete queryParams.startDate
  }

  if (queryParams.endDate) {
    delete queryParams.endDate
  }

  return request.get<{
    data: {
      list: Expense[]
      total: number
      currentPage: number
      pageSize: number
    }
    code: number
    message: string
    timestamp: number
  }>('/expense', queryParams)
}

// 获取费用详情
export const getExpenseById = (id: number) => {
  return request.get<{ data: Expense; code: number; message: string; timestamp: number }>(
    `/expense/${id}`
  )
}

// 创建费用
export const createExpense = (data: CreateExpenseDto) => {
  return request.post<Expense>('/expense', data)
}

// 更新费用
export const updateExpense = (id: number, data: UpdateExpenseDto) => {
  return request.patch<Expense>(`/expense/${id}`, data)
}

// 删除费用
export const deleteExpense = (id: number) => {
  return request.delete<any>(`/expense/${id}`)
}

// 审核费用
export const auditExpense = (id: number, data: AuditExpenseDto) => {
  return request.post<Expense>(`/expense/${id}/audit`, data)
}

// 取消审核
export const cancelAuditExpense = (id: number, data: CancelAuditDto) => {
  return request.post<Expense>(`/expense/${id}/cancel-audit`, data)
}

// 获取字段自动完成选项
export const getExpenseAutocomplete = (field: string) => {
  return request.get<string[]>(`/expense/autocomplete/${field}`)
}

// 查看费用收据
export const getExpenseReceipt = (id: number) => {
  return request.get<{
    data: ReceiptViewDto
    code: number
    message: string
    timestamp: number
  }>(`/expense/${id}/receipt`)
}

// 导出费用数据为CSV
export const exportExpenseCSV = (params?: Partial<ExpenseQueryParams>) => {
  // 以blob格式获取CSV数据
  return request.get<Blob>('/expense/export/csv', params, 'blob')
}
