import request from './request'
import type {
  VoucherRecordYear,
  VoucherRecordMonth,
  CreateVoucherRecordYearDto,
  UpdateVoucherRecordYearDto,
  CreateVoucherRecordMonthDto,
  UpdateVoucherRecordMonthDto,
  MonthStatusUpdateDto,
  BatchDeleteMonthsDto,
  QueryVoucherRecordDto,
  ExportVoucherRecordDto,
  PaginatedVoucherRecordResponse,
  MonthStatistics,
} from '../types/voucherRecord'
import type { ApiResponse } from '../types'

// 年度记录管理
export const voucherRecordYearApi = {
  // 创建年度凭证记录
  async create(data: CreateVoucherRecordYearDto): Promise<VoucherRecordYear> {
    const response = await request.post<ApiResponse<VoucherRecordYear>>(
      '/voucher-record/years',
      data
    )
    return response.data
  },

  // 获取年度凭证记录列表
  async list(params: QueryVoucherRecordDto): Promise<PaginatedVoucherRecordResponse> {
    const response = await request.get<ApiResponse<PaginatedVoucherRecordResponse>>(
      '/voucher-record/years',
      { params }
    )
    return response.data
  },

  // 获取年度凭证记录详情
  async getById(id: number): Promise<VoucherRecordYear> {
    const response = await request.get<ApiResponse<VoucherRecordYear>>(
      `/voucher-record/years/${id}`
    )
    return response.data
  },

  // 更新年度凭证记录
  async update(id: number, data: UpdateVoucherRecordYearDto): Promise<VoucherRecordYear> {
    const response = await request.patch<ApiResponse<VoucherRecordYear>>(
      `/voucher-record/years/${id}`,
      data
    )
    return response.data
  },

  // 删除年度凭证记录
  async delete(id: number): Promise<void> {
    await request.delete(`/voucher-record/years/${id}`)
  },

  // 获取客户的所有年度记录
  async getByCustomer(customerId: number): Promise<VoucherRecordYear[]> {
    const response = await request.get<ApiResponse<VoucherRecordYear[]>>(
      `/voucher-record/customers/${customerId}/years`
    )
    return response.data
  },
}

// 月度记录管理
export const voucherRecordMonthApi = {
  // 创建月度凭证记录
  async create(data: CreateVoucherRecordMonthDto): Promise<VoucherRecordMonth> {
    const response = await request.post<ApiResponse<VoucherRecordMonth>>(
      '/voucher-record/months',
      data
    )
    return response.data
  },

  // 获取月度凭证记录详情
  async getById(id: number): Promise<VoucherRecordMonth> {
    const response = await request.get<ApiResponse<VoucherRecordMonth>>(
      `/voucher-record/months/${id}`
    )
    return response.data
  },

  // 更新月度凭证记录
  async update(id: number, data: UpdateVoucherRecordMonthDto): Promise<VoucherRecordMonth> {
    const response = await request.patch<ApiResponse<VoucherRecordMonth>>(
      `/voucher-record/months/${id}`,
      data
    )
    return response.data
  },

  // 删除月度凭证记录
  async delete(id: number): Promise<void> {
    await request.delete(`/voucher-record/months/${id}`)
  },

  // 批量删除月度凭证记录
  async batchDelete(data: BatchDeleteMonthsDto): Promise<void> {
    await request.post('/voucher-record/months/batch/delete', data)
  },
}

// 批量操作和统计
export const voucherRecordBatchApi = {
  // 批量更新月度状态
  async batchUpdateMonthStatus(
    yearRecordId: number,
    updates: MonthStatusUpdateDto[]
  ): Promise<VoucherRecordMonth[]> {
    const response = await request.patch<ApiResponse<VoucherRecordMonth[]>>(
      `/voucher-record/years/${yearRecordId}/months/batch`,
      updates
    )
    return response.data
  },

  // 获取年度记录的月度统计信息
  async getMonthStatistics(yearRecordId: number): Promise<MonthStatistics> {
    const response = await request.get<ApiResponse<MonthStatistics>>(
      `/voucher-record/years/${yearRecordId}/statistics`
    )
    return response.data
  },

  // 删除年度记录下的所有月度记录（同时删除年度记录）
  async deleteYearWithMonths(yearRecordId: number): Promise<void> {
    await request.delete(`/voucher-record/years/${yearRecordId}/months`)
  },
}

// 导出功能
export const voucherRecordExportApi = {
  // 导出凭证记录为Excel文件
  async exportToExcel(data: ExportVoucherRecordDto): Promise<Blob> {
    const response = await request.get<Blob>('/voucher-record/export', data, 'blob')
    return response
  },
}

// 统一导出的API对象
export const voucherRecordApi = {
  year: voucherRecordYearApi,
  month: voucherRecordMonthApi,
  batch: voucherRecordBatchApi,
  export: voucherRecordExportApi,
}

export default voucherRecordApi
