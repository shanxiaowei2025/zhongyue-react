import request from './request'
import type { AxiosResponse } from 'axios'
import type {
  SalaryRecord,
  SocialInsuranceRecord,
  SubsidySummaryRecord,
  AttendanceDeductionRecord,
  FriendCirclePaymentRecord,
  SalaryQueryParams,
  CreateSalaryDto,
  UpdateSalaryDto,
  CreateSocialInsuranceDto,
  UpdateSocialInsuranceDto,
  CreateSubsidySummaryDto,
  UpdateSubsidySummaryDto,
  CreateAttendanceDeductionDto,
  UpdateAttendanceDeductionDto,
  CreateFriendCirclePaymentDto,
  UpdateFriendCirclePaymentDto,
  PaginatedResponse,
  ApiResponse,
  ImportResult,
  RelatedData,
  SalaryStatistics,
  CommissionConfig,
  AgencyCommissionConfig,
  SalesCommissionConfig,
  PerformanceCommissionConfig,
} from '../types/salaryIntegrated'

// 薪资主表相关接口
export const salaryApi = {
  // 获取薪资列表
  async getSalaryList(params: SalaryQueryParams): Promise<PaginatedResponse<SalaryRecord>> {
    const response = await request.get<ApiResponse<PaginatedResponse<SalaryRecord>>>('/salary', {
      params,
    })
    return response.data
  },

  // 获取薪资详情
  async getSalaryDetail(id: number): Promise<SalaryRecord> {
    const response = await request.get<ApiResponse<SalaryRecord>>(`/salary/${id}`)
    return response.data
  },

  // 创建薪资记录
  async createSalary(data: CreateSalaryDto): Promise<SalaryRecord> {
    const response = await request.post<ApiResponse<SalaryRecord>>('/salary', data)
    return response.data
  },

  // 更新薪资记录
  async updateSalary(id: number, data: UpdateSalaryDto): Promise<SalaryRecord> {
    const response = await request.patch<ApiResponse<SalaryRecord>>(`/salary/${id}`, data)
    return response.data
  },

  // 删除薪资记录
  async deleteSalary(id: number): Promise<void> {
    await request.delete(`/salary/${id}`)
  },

  // 自动生成薪资
  async autoGenerateSalary(month: string): Promise<SalaryRecord[]> {
    const response = await request.post<ApiResponse<SalaryRecord[]>>(
      `/salary/auto-generate?month=${month}`
    )
    return response.data
  },

  // 导出薪资数据
  async exportSalaryData(params: SalaryQueryParams): Promise<Blob> {
    const response = (await request.get('/salary/export', {
      params,
      responseType: 'blob',
    })) as AxiosResponse<Blob>
    return response.data
  },

  // 获取薪资统计 - 基于薪资列表数据计算
  async getSalaryStatistics(yearMonth: string): Promise<SalaryStatistics> {
    const salaryResponse = await this.getSalaryList({
      yearMonth,
      page: 1,
      pageSize: 9999,
    })

    const salaryData = salaryResponse.data

    // 安全的数值转换函数
    const toNumber = (value: any): number => {
      const num = typeof value === 'string' ? parseFloat(value) : Number(value)
      return isNaN(num) ? 0 : num
    }

    return {
      employeeCount: salaryData.length,
      totalPayable: salaryData.reduce((sum, item) => sum + toNumber(item.totalPayable), 0),
      totalSocialInsurance: salaryData.reduce(
        (sum, item) => sum + toNumber(item.personalInsuranceTotal),
        0
      ),
      totalTax: salaryData.reduce((sum, item) => sum + toNumber(item.personalIncomeTax), 0),
      totalActual: salaryData.reduce((sum, item) => {
        const totalPayable = toNumber(item.totalPayable)
        const socialInsurance = toNumber(item.personalInsuranceTotal)
        const tax = toNumber(item.personalIncomeTax)
        return sum + (totalPayable - socialInsurance - tax)
      }, 0),
      paidCount: 0, // 待后端添加isPaid字段
      unpaidCount: salaryData.length, // 暂时全部设为未发放
    }
  },
}

// 社保信息相关接口
export const socialInsuranceApi = {
  // 获取社保信息列表
  async getSocialInsuranceList(params: {
    yearMonth?: string
    name?: string
    page?: number
    pageSize?: number
  }): Promise<PaginatedResponse<SocialInsuranceRecord>> {
    const response = await request.get<ApiResponse<PaginatedResponse<SocialInsuranceRecord>>>(
      '/social-insurance',
      {
        params: {
          ...params,
          page: params.page || 1,
          pageSize: params.pageSize || 10,
        },
      }
    )
    return response.data
  },

  // 根据员工获取社保信息 - 通过列表接口查询
  async getByEmployee(name: string, yearMonth: string): Promise<SocialInsuranceRecord | null> {
    try {
      const response = await this.getSocialInsuranceList({
        name,
        yearMonth,
        page: 1,
        pageSize: 1,
      })
      return response.data.length > 0 ? response.data[0] : null
    } catch (error) {
      return null
    }
  },

  // 获取社保信息详情
  async getSocialInsuranceDetail(id: number): Promise<SocialInsuranceRecord> {
    const response = await request.get<ApiResponse<SocialInsuranceRecord>>(
      `/social-insurance/${id}`
    )
    return response.data
  },

  // 创建社保信息
  async createSocialInsurance(data: CreateSocialInsuranceDto): Promise<SocialInsuranceRecord> {
    const response = await request.post<ApiResponse<SocialInsuranceRecord>>(
      '/social-insurance',
      data
    )
    return response.data
  },

  // 更新社保信息
  async updateSocialInsurance(
    id: number,
    data: UpdateSocialInsuranceDto
  ): Promise<SocialInsuranceRecord> {
    const response = await request.patch<ApiResponse<SocialInsuranceRecord>>(
      `/social-insurance/${id}`,
      data
    )
    return response.data
  },

  // 删除社保信息
  async deleteSocialInsurance(id: number): Promise<void> {
    await request.delete(`/social-insurance/${id}`)
  },

  // 导入社保数据
  async importSocialInsurance(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await request.post<ApiResponse<ImportResult>>(
      '/social-insurance/import',
      formData
    )
    return response.data
  },

  // 导出社保数据
  async exportSocialInsurance(params: { yearMonth?: string }): Promise<Blob> {
    const response = (await request.get('/social-insurance/export', {
      params,
      responseType: 'blob',
    })) as AxiosResponse<Blob>
    return response.data
  },
}

// 补贴合计相关接口
export const subsidyApi = {
  // 获取补贴列表
  async getSubsidyList(params: {
    yearMonth?: string
    name?: string
    page?: number
    pageSize?: number
  }): Promise<PaginatedResponse<SubsidySummaryRecord>> {
    const response = await request.get<ApiResponse<PaginatedResponse<SubsidySummaryRecord>>>(
      '/subsidy-summary',
      {
        params: {
          ...params,
          page: params.page || 1,
          pageSize: params.pageSize || 10,
        },
      }
    )
    return response.data
  },

  // 根据员工获取补贴信息 - 通过列表接口查询
  async getByEmployee(name: string, yearMonth: string): Promise<SubsidySummaryRecord | null> {
    try {
      const response = await this.getSubsidyList({
        name,
        yearMonth,
        page: 1,
        pageSize: 1,
      })
      return response.data.length > 0 ? response.data[0] : null
    } catch (error) {
      return null
    }
  },

  // 创建补贴记录
  async createSubsidy(data: CreateSubsidySummaryDto): Promise<SubsidySummaryRecord> {
    const response = await request.post<ApiResponse<SubsidySummaryRecord>>('/subsidy-summary', data)
    return response.data
  },

  // 更新补贴记录
  async updateSubsidy(id: number, data: UpdateSubsidySummaryDto): Promise<SubsidySummaryRecord> {
    const response = await request.patch<ApiResponse<SubsidySummaryRecord>>(
      `/subsidy-summary/${id}`,
      data
    )
    return response.data
  },

  // 删除补贴记录
  async deleteSubsidy(id: number): Promise<void> {
    await request.delete(`/subsidy-summary/${id}`)
  },

  // 导入补贴数据
  async importSubsidy(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await request.post<ApiResponse<ImportResult>>(
      '/subsidy-summary/import',
      formData
    )
    return response.data
  },

  // 导出补贴数据
  async exportSubsidy(params: { yearMonth?: string }): Promise<Blob> {
    const response = (await request.get('/subsidy-summary/export', {
      params,
      responseType: 'blob',
    })) as AxiosResponse<Blob>
    return response.data
  },
}

// 考勤扣款相关接口
export const attendanceApi = {
  // 获取考勤扣款列表
  async getAttendanceList(params: {
    yearMonth?: string
    name?: string
    page?: number
    pageSize?: number
  }): Promise<PaginatedResponse<AttendanceDeductionRecord>> {
    const response = await request.get<ApiResponse<PaginatedResponse<AttendanceDeductionRecord>>>(
      '/attendance-deduction',
      {
        params: {
          ...params,
          page: params.page || 1,
          pageSize: params.pageSize || 10,
        },
      }
    )
    return response.data
  },

  // 根据员工获取考勤扣款信息 - 通过列表接口查询
  async getByEmployee(name: string, yearMonth: string): Promise<AttendanceDeductionRecord | null> {
    try {
      const response = await this.getAttendanceList({
        name,
        yearMonth,
        page: 1,
        pageSize: 1,
      })
      return response.data.length > 0 ? response.data[0] : null
    } catch (error) {
      return null
    }
  },

  // 创建考勤扣款记录
  async createAttendance(data: CreateAttendanceDeductionDto): Promise<AttendanceDeductionRecord> {
    const response = await request.post<ApiResponse<AttendanceDeductionRecord>>(
      '/attendance-deduction',
      data
    )
    return response.data
  },

  // 更新考勤扣款记录
  async updateAttendance(
    id: number,
    data: UpdateAttendanceDeductionDto
  ): Promise<AttendanceDeductionRecord> {
    const response = await request.patch<ApiResponse<AttendanceDeductionRecord>>(
      `/attendance-deduction/${id}`,
      data
    )
    return response.data
  },

  // 删除考勤扣款记录
  async deleteAttendance(id: number): Promise<void> {
    await request.delete(`/attendance-deduction/${id}`)
  },

  // 导入考勤扣款数据
  async importAttendance(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await request.post<ApiResponse<ImportResult>>(
      '/attendance-deduction/import',
      formData
    )
    return response.data
  },

  // 导出考勤扣款数据
  async exportAttendance(params: { yearMonth?: string }): Promise<Blob> {
    const response = (await request.get('/attendance-deduction/export', {
      params,
      responseType: 'blob',
    })) as AxiosResponse<Blob>
    return response.data
  },
}

// 朋友圈扣款相关接口
export const friendCircleApi = {
  // 获取朋友圈扣款列表
  async getFriendCircleList(params: {
    yearMonth?: string
    name?: string
    page?: number
    pageSize?: number
  }): Promise<PaginatedResponse<FriendCirclePaymentRecord>> {
    const response = await request.get<ApiResponse<PaginatedResponse<FriendCirclePaymentRecord>>>(
      '/friend-circle-payment',
      {
        params: {
          ...params,
          page: params.page || 1,
          pageSize: params.pageSize || 10,
        },
      }
    )
    return response.data
  },

  // 根据员工获取朋友圈扣款信息 - 通过列表接口查询
  async getByEmployee(name: string, yearMonth: string): Promise<FriendCirclePaymentRecord | null> {
    try {
      const response = await this.getFriendCircleList({
        name,
        yearMonth,
        page: 1,
        pageSize: 1,
      })
      return response.data.length > 0 ? response.data[0] : null
    } catch (error) {
      return null
    }
  },

  // 创建朋友圈扣款记录
  async createFriendCircle(data: CreateFriendCirclePaymentDto): Promise<FriendCirclePaymentRecord> {
    const response = await request.post<ApiResponse<FriendCirclePaymentRecord>>(
      '/friend-circle-payment',
      data
    )
    return response.data
  },

  // 更新朋友圈扣款记录
  async updateFriendCircle(
    id: number,
    data: UpdateFriendCirclePaymentDto
  ): Promise<FriendCirclePaymentRecord> {
    const response = await request.patch<ApiResponse<FriendCirclePaymentRecord>>(
      `/friend-circle-payment/${id}`,
      data
    )
    return response.data
  },

  // 删除朋友圈扣款记录
  async deleteFriendCircle(id: number): Promise<void> {
    await request.delete(`/friend-circle-payment/${id}`)
  },

  // 导入朋友圈扣款数据
  async importFriendCircle(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await request.post<ApiResponse<ImportResult>>(
      '/friend-circle-payment/import',
      formData
    )
    return response.data
  },

  // 导出朋友圈扣款数据
  async exportFriendCircle(params: { yearMonth?: string }): Promise<Blob> {
    const response = (await request.get('/friend-circle-payment/export', {
      params,
      responseType: 'blob',
    })) as AxiosResponse<Blob>
    return response.data
  },
}

// 提成配置相关接口
export const commissionApi = {
  // 获取代理费提成配置
  async getAgencyCommission(): Promise<AgencyCommissionConfig[]> {
    const response = await request.get<ApiResponse<AgencyCommissionConfig[]>>('/commission/agency')
    return response.data
  },

  // 获取业务销售提成配置
  async getSalesCommission(): Promise<SalesCommissionConfig[]> {
    const response = await request.get<ApiResponse<SalesCommissionConfig[]>>('/commission/sales')
    return response.data
  },

  // 获取业务顾问提成配置
  async getConsultantCommission(): Promise<CommissionConfig[]> {
    const response = await request.get<ApiResponse<CommissionConfig[]>>('/commission/consultant')
    return response.data
  },

  // 获取其他业务提成配置
  async getOtherCommission(): Promise<CommissionConfig[]> {
    const response = await request.get<ApiResponse<CommissionConfig[]>>('/commission/other')
    return response.data
  },

  // 获取绩效提成配置
  async getPerformanceCommission(): Promise<PerformanceCommissionConfig[]> {
    const response =
      await request.get<ApiResponse<PerformanceCommissionConfig[]>>('/commission/performance')
    return response.data
  },

  // 根据金额查询提成比例
  async getCommissionRateByAmount(amount: number): Promise<{ rate: number; type: string }> {
    const response = await request.get<ApiResponse<{ rate: number; type: string }>>(
      '/commission/rate/amount',
      { params: { amount } }
    )
    return response.data
  },
}

// 集成化数据接口
export const integratedApi = {
  // 加载员工相关所有数据
  async loadEmployeeRelatedData(employeeName: string, yearMonth: string): Promise<RelatedData> {
    try {
      const [socialInsurance, subsidy, attendance, friendCircle] = await Promise.all([
        socialInsuranceApi.getByEmployee(employeeName, yearMonth),
        subsidyApi.getByEmployee(employeeName, yearMonth),
        attendanceApi.getByEmployee(employeeName, yearMonth),
        friendCircleApi.getByEmployee(employeeName, yearMonth),
      ])

      // 确保返回一致的数据结构
      return {
        socialInsurance: socialInsurance || undefined,
        subsidy: subsidy || undefined,
        attendance: attendance || undefined,
        friendCircle: friendCircle || undefined,
      }
    } catch (error) {
      // 发生错误时返回空的默认数据结构
      return {
        socialInsurance: undefined,
        subsidy: undefined,
        attendance: undefined,
        friendCircle: undefined,
      }
    }
  },

  // 批量获取月度数据
  async loadMonthlyData(yearMonth: string): Promise<{
    salaryData: SalaryRecord[]
    statistics: SalaryStatistics
  }> {
    try {
      const [salaryResponse, statistics] = await Promise.all([
        salaryApi.getSalaryList({ yearMonth, page: 1, pageSize: 1000 }),
        salaryApi.getSalaryStatistics(yearMonth),
      ])

      // 确保返回一致的数据结构，即使是空数据
      return {
        salaryData: salaryResponse?.data || [],
        statistics: statistics || {
          employeeCount: 0,
          totalPayable: 0,
          totalSocialInsurance: 0,
          totalTax: 0,
          totalActual: 0,
          paidCount: 0,
          unpaidCount: 0,
        },
      }
    } catch (error) {
      // 发生错误时返回空的默认数据结构
      return {
        salaryData: [],
        statistics: {
          employeeCount: 0,
          totalPayable: 0,
          totalSocialInsurance: 0,
          totalTax: 0,
          totalActual: 0,
          paidCount: 0,
          unpaidCount: 0,
        },
      }
    }
  },

  // 批量导入数据
  async batchImport(type: string, file: File): Promise<ImportResult> {
    switch (type) {
      case 'salary':
        // 薪资数据暂不支持导入，因为是计算结果
        throw new Error('薪资数据不支持导入，请使用自动生成功能')
      case 'socialInsurance':
        return await socialInsuranceApi.importSocialInsurance(file)
      case 'subsidy':
        return await subsidyApi.importSubsidy(file)
      case 'attendance':
        return await attendanceApi.importAttendance(file)
      case 'friendCircle':
        return await friendCircleApi.importFriendCircle(file)
      default:
        throw new Error(`不支持的导入类型: ${type}`)
    }
  },

  // 批量导出数据
  async batchExport(type: string, params: { yearMonth?: string }): Promise<Blob> {
    switch (type) {
      case 'salary':
        return await salaryApi.exportSalaryData(params)
      case 'socialInsurance':
        return await socialInsuranceApi.exportSocialInsurance(params)
      case 'subsidy':
        return await subsidyApi.exportSubsidy(params)
      case 'attendance':
        return await attendanceApi.exportAttendance(params)
      case 'friendCircle':
        return await friendCircleApi.exportFriendCircle(params)
      default:
        throw new Error(`不支持的导出类型: ${type}`)
    }
  },
}

// 生成SWR key的工具函数
export const getSWRKeys = {
  salaryList: (params: SalaryQueryParams) => ['salary-list', params],
  salaryDetail: (id: number) => ['salary-detail', id],
  salaryStatistics: (yearMonth: string) => ['salary-statistics', yearMonth],
  socialInsuranceList: (params: { yearMonth?: string; name?: string }) => [
    'social-insurance-list',
    params,
  ],
  socialInsuranceByEmployee: (name: string, yearMonth: string) => [
    'social-insurance-by-employee',
    name,
    yearMonth,
  ],
  subsidyList: (params: { yearMonth?: string; name?: string }) => ['subsidy-list', params],
  subsidyByEmployee: (name: string, yearMonth: string) => ['subsidy-by-employee', name, yearMonth],
  attendanceList: (params: { yearMonth?: string; name?: string }) => ['attendance-list', params],
  attendanceByEmployee: (name: string, yearMonth: string) => [
    'attendance-by-employee',
    name,
    yearMonth,
  ],
  friendCircleList: (params: { yearMonth?: string; name?: string }) => [
    'friend-circle-list',
    params,
  ],
  friendCircleByEmployee: (name: string, yearMonth: string) => [
    'friend-circle-by-employee',
    name,
    yearMonth,
  ],
  relatedData: (employeeName: string, yearMonth: string) => [
    'related-data',
    employeeName,
    yearMonth,
  ],
  monthlyData: (yearMonth: string) => ['monthly-data', yearMonth],
}
