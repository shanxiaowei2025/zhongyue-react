import request from './request'
import type { AxiosResponse } from 'axios'
import type {
  SalaryRecord,
  SocialInsuranceRecord,
  SubsidySummaryRecord,
  AttendanceDeductionRecord,
  FriendCirclePaymentRecord,
  DepositRecord,
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
  CreateDepositDto,
  UpdateDepositDto,
  PaginatedResponse,
  ApiResponse,
  ImportResult,
  RelatedData,
  SalaryStatistics,
  CommissionConfig,
  AgencyCommissionConfig,
  SalesCommissionConfig,
  PerformanceCommissionConfig,
  AutoGenerateSalaryResult,
} from '../types/salaryIntegrated'

// 薪资主表相关接口
export const salaryApi = {
  // 获取薪资列表（管理员）
  async getSalaryList(params: SalaryQueryParams): Promise<PaginatedResponse<SalaryRecord>> {
    const response = await request.get<ApiResponse<PaginatedResponse<SalaryRecord>>>(
      '/salary/admin',
      {
        params,
      }
    )
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

  // 确认薪资记录
  async confirmSalary(id: number): Promise<SalaryRecord> {
    const response = await request.patch<ApiResponse<SalaryRecord>>(`/salary/${id}/confirm`)
    return response.data
  },

  // 自动生成薪资（固定使用当前月份）
  async autoGenerateSalary(): Promise<AutoGenerateSalaryResult> {
    const currentMonth = new Date().toISOString().slice(0, 7)
    const response = await request.post<ApiResponse<AutoGenerateSalaryResult>>(
      `/salary/auto-generate?month=${currentMonth}`
    )

    // 添加调试日志
    console.log('autoGenerateSalary 原始响应:', response)
    console.log('autoGenerateSalary response.data:', response.data)

    // 根据实际响应结构，尝试不同的访问路径
    const responseData = response.data as any

    // 如果 response.data 直接就是我们需要的结构
    if (responseData && responseData.success && responseData.message) {
      console.log('使用直接访问 response.data')
      return responseData
    }

    // 如果需要访问 response.data.data
    if (responseData && responseData.data && responseData.data.success) {
      console.log('使用 response.data.data 访问')
      return responseData.data
    }

    // 兜底处理
    console.error('无法解析响应数据结构:', responseData)
    throw new Error('响应数据格式异常')
  },

  // 导出薪资数据
  async exportSalaryData(params: SalaryQueryParams): Promise<Blob> {
    const response = (await request.get('/salary/export', {
      params,
      responseType: 'blob',
    })) as AxiosResponse<Blob>
    return response.data
  },

  // 基于薪资列表数据计算统计信息（避免重复请求）
  calculateSalaryStatistics(salaryData: SalaryRecord[]): SalaryStatistics {
    // 安全的数值转换函数
    const toNumber = (value: any): number => {
      const num = typeof value === 'string' ? parseFloat(value) : Number(value)
      return isNaN(num) ? 0 : num
    }

    // 计算确认进度
    const confirmedCount = salaryData.filter(item => item.isConfirmed).length
    const unconfirmedCount = salaryData.length - confirmedCount

    return {
      employeeCount: salaryData.length,
      totalPayable: salaryData.reduce((sum, item) => sum + toNumber(item.totalPayable), 0),
      totalSocialInsurance: salaryData.reduce(
        (sum, item) => sum + toNumber(item.personalInsuranceTotal),
        0
      ),
      totalTax: salaryData.reduce((sum, item) => sum + toNumber(item.personalIncomeTax), 0),
      paidCount: salaryData.filter(
        item =>
          toNumber(item.bankCardOrWechat) > 0 ||
          toNumber(item.cashPaid) > 0 ||
          toNumber(item.corporatePayment) > 0
      ).length,
      unpaidCount: salaryData.filter(
        item =>
          toNumber(item.bankCardOrWechat) === 0 &&
          toNumber(item.cashPaid) === 0 &&
          toNumber(item.corporatePayment) === 0
      ).length,
      confirmedCount,
      unconfirmedCount,
      confirmationRate: salaryData.length > 0 ? (confirmedCount / salaryData.length) * 100 : 0,
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

// 保证金相关接口
export const depositApi = {
  // 获取保证金列表
  async getDepositList(params: {
    name?: string
    page?: number
    pageSize?: number
  }): Promise<PaginatedResponse<DepositRecord>> {
    const response = await request.get<ApiResponse<PaginatedResponse<DepositRecord>>>('/deposit', {
      params: {
        ...params,
        page: params.page || 1,
        pageSize: params.pageSize || 10,
      },
    })
    return response.data
  },

  // 根据员工获取保证金记录
  async getByEmployee(name: string): Promise<DepositRecord[]> {
    try {
      const response = await this.getDepositList({
        name,
        pageSize: 1000, // 获取该员工所有记录
      })
      return response.data || []
    } catch (error) {
      return []
    }
  },

  // 获取保证金详情
  async getDepositDetail(id: number): Promise<DepositRecord> {
    const response = await request.get<ApiResponse<DepositRecord>>(`/deposit/${id}`)
    return response.data
  },

  // 创建保证金记录
  async createDeposit(data: CreateDepositDto): Promise<DepositRecord> {
    const response = await request.post<ApiResponse<DepositRecord>>('/deposit', data)
    return response.data
  },

  // 更新保证金记录
  async updateDeposit(id: number, data: UpdateDepositDto): Promise<DepositRecord> {
    const response = await request.patch<ApiResponse<DepositRecord>>(`/deposit/${id}`, data)
    return response.data
  },

  // 删除保证金记录
  async deleteDeposit(id: number): Promise<void> {
    await request.delete(`/deposit/${id}`)
  },

  // 导入保证金数据
  async importDeposit(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await request.post<ApiResponse<ImportResult>>('/deposit/upload', formData)
    return response.data
  },

  // 导出保证金数据
  async exportDeposit(params?: any): Promise<Blob> {
    const response = (await request.get('/deposit/export', {
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
      // TODO: 这些API模块尚未实现，暂时返回空数据
      // const [socialInsurance, subsidy, attendance, friendCircle, deposit] = await Promise.all([
      //   socialInsuranceApi.getByEmployee(employeeName, yearMonth),
      //   subsidyApi.getByEmployee(employeeName, yearMonth),
      //   attendanceApi.getByEmployee(employeeName, yearMonth),
      //   friendCircleApi.getByEmployee(employeeName, yearMonth),
      //   depositApi.getByEmployee(employeeName),
      // ])

      // 暂时返回空的默认数据结构
      return {
        socialInsurance: undefined,
        subsidy: undefined,
        attendance: undefined,
        friendCircle: undefined,
        deposit: [],
      }
    } catch (error) {
      // 发生错误时返回空的默认数据结构
      return {
        socialInsurance: undefined,
        subsidy: undefined,
        attendance: undefined,
        friendCircle: undefined,
        deposit: [],
      }
    }
  },

  // 批量获取月度数据（优化：只请求一次薪资列表）
  async loadMonthlyData(yearMonth: string): Promise<{
    salaryData: SalaryRecord[]
    statistics: SalaryStatistics
  }> {
    try {
      // 只请求一次薪资列表数据
      const salaryResponse = await salaryApi.getSalaryList({
        yearMonth,
        page: 1,
        pageSize: 1000,
      })

      const salaryData = salaryResponse?.data || []
      // 基于获取的数据计算统计信息，避免重复请求
      const statistics = salaryApi.calculateSalaryStatistics(salaryData)

      return {
        salaryData,
        statistics,
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
          paidCount: 0,
          unpaidCount: 0,
          confirmedCount: 0,
          unconfirmedCount: 0,
          confirmationRate: 0,
        },
      }
    }
  },

  // 社保信息导入
  async importSocialInsurance(file: File): Promise<ImportResult> {
    console.log('社保导入API - 文件信息:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    })

    const formData = new FormData()
    formData.append('file', file)

    // 验证FormData内容
    console.log('FormData内容:')
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value)
    }

    const response = await request.post<ApiResponse<ImportResult>>(
      '/social-insurance/import',
      formData
    )
    return response.data
  },

  // 补贴合计导入
  async importSubsidy(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await request.post<ApiResponse<ImportResult>>(
      '/subsidy-summary/import',
      formData
    )
    return response.data
  },

  // 朋友圈扣款导入
  async importFriendCircle(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await request.post<ApiResponse<ImportResult>>(
      '/friend-circle-payment/import',
      formData
    )
    return response.data
  },

  // 考勤扣款导入
  async importAttendance(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await request.post<ApiResponse<ImportResult>>(
      '/attendance-deduction/import',
      formData
    )
    return response.data
  },

  // 保证金导入
  async importDeposit(file: File): Promise<ImportResult> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await request.post<ApiResponse<ImportResult>>('/deposit/upload', formData)
    return response.data
  },

  // 批量导入数据
  async batchImport(type: string, file: File): Promise<ImportResult> {
    switch (type) {
      case 'salary':
        // 薪资数据暂不支持导入，因为是计算结果
        throw new Error('薪资数据不支持导入，请使用自动生成功能')
      case 'socialInsurance':
        return await this.importSocialInsurance(file)
      case 'subsidy':
        return await this.importSubsidy(file)
      case 'attendance':
        return await this.importAttendance(file)
      case 'friendCircle':
        return await this.importFriendCircle(file)
      case 'deposit':
        return await this.importDeposit(file)
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
      case 'deposit':
        return await depositApi.exportDeposit(params)
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
