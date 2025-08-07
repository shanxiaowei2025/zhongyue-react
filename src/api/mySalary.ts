import axios from 'axios'
import type { AxiosResponse } from 'axios'
import type {
  MySalaryRecord,
  MySalaryQueryParams,
  MySalaryDetail,
  MySalaryStatistics,
  MySalaryPaginatedResponse,
  MySalaryApiResponse,
  ConfirmSalaryRequest,
  ConfirmSalaryResponse,
} from '../types/mySalary'
import { useSalaryAuthStore } from '../store/salaryAuth'

// 获取API基础URL
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

// 创建带薪资token的axios实例
const createSalaryRequest = () => {
  const token = useSalaryAuthStore.getState().getValidToken()
  if (!token) {
    throw new Error('SALARY_TOKEN_REQUIRED')
  }

  return axios.create({
    baseURL: apiBaseUrl,
    timeout: 120000,
    headers: {
      'Content-Type': 'application/json',
      'X-Salary-Token': token,
      Authorization: `Bearer ${localStorage.getItem('token')}`, // 同时需要JWT token
    },
  })
}

// 我的薪资API接口
export const mySalaryApi = {
  // 获取我的薪资列表
  async getMySalaryList(
    params: MySalaryQueryParams
  ): Promise<MySalaryPaginatedResponse<MySalaryRecord>> {
    const salaryRequest = createSalaryRequest()
    const response = await salaryRequest.get<
      MySalaryApiResponse<MySalaryPaginatedResponse<MySalaryRecord>>
    >('/salary/my', {
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 10,
        ...params,
      },
    })
    return response.data.data
  },

  // 获取我的薪资详情
  async getMySalaryDetail(id: number): Promise<MySalaryRecord> {
    const salaryRequest = createSalaryRequest()
    const response = await salaryRequest.get<MySalaryApiResponse<MySalaryRecord>>(
      `/salary/my/${id}`
    )
    return response.data.data
  },

  // 确认薪资记录
  async confirmSalary(id: number): Promise<ConfirmSalaryResponse> {
    const requestBody: ConfirmSalaryRequest = {
      isConfirmed: true,
    }
    const salaryRequest = createSalaryRequest()
    const response = await salaryRequest.patch<MySalaryApiResponse<ConfirmSalaryResponse>>(
      `/salary/${id}/confirm`,
      requestBody
    )
    return response.data.data
  },

  // 获取薪资统计信息（基于薪资列表计算）
  calculateMySalaryStatistics(salaryData: MySalaryRecord[]): MySalaryStatistics {
    const currentDate = new Date()
    const currentYearMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
    const currentYear = currentDate.getFullYear()

    // 当月数据
    const currentMonthData = salaryData.find(item => item.yearMonth === currentYearMonth)

    // 本年度数据
    const yearToDateData = salaryData.filter(item =>
      item.yearMonth.startsWith(currentYear.toString())
    )

    const toNumber = (value: any): number => {
      const num = typeof value === 'string' ? parseFloat(value) : Number(value)
      return isNaN(num) ? 0 : num
    }

    return {
      currentMonth: {
        totalPayable: currentMonthData ? toNumber(currentMonthData.totalPayable) : 0,
        isConfirmed: currentMonthData ? currentMonthData.isConfirmed : false,
      },
      yearToDate: {
        totalPayable: yearToDateData.reduce((sum, item) => sum + toNumber(item.totalPayable), 0),
        totalTax: yearToDateData.reduce((sum, item) => sum + toNumber(item.personalIncomeTax), 0),
        confirmedCount: yearToDateData.filter(item => item.isConfirmed).length,
        totalCount: yearToDateData.length,
      },
    }
  },

  // 构建薪资详情数据
  buildSalaryDetail(salaryRecord: MySalaryRecord): MySalaryDetail {
    const toNumber = (value: any): number => {
      const num = typeof value === 'string' ? parseFloat(value) : Number(value)
      return isNaN(num) ? 0 : num
    }

    return {
      basic: {
        yearMonth: salaryRecord.yearMonth,
        baseSalary: toNumber(salaryRecord.baseSalary),
        workDays: 0, // 需要从后端获取
        overtimeHours: 0, // 需要从后端获取
      },
      income: {
        subsidyTotal: toNumber(salaryRecord.totalSubsidy),
        commissionTotal:
          toNumber(salaryRecord.performanceCommission) +
          toNumber(salaryRecord.businessCommission) +
          toNumber(salaryRecord.agencyFeeCommission),
        otherIncome: 0, // 其他收入
        totalIncome:
          toNumber(salaryRecord.baseSalary) +
          toNumber(salaryRecord.totalSubsidy) +
          toNumber(salaryRecord.performanceCommission) +
          toNumber(salaryRecord.businessCommission) +
          toNumber(salaryRecord.agencyFeeCommission),
      },
      deduction: {
        personalInsuranceTotal: toNumber(salaryRecord.personalInsuranceTotal),
        personalIncomeTax: toNumber(salaryRecord.personalIncomeTax),
        attendanceDeduction: 0, // 需要从后端获取
        otherDeduction: 0, // 其他扣款
        totalDeduction:
          toNumber(salaryRecord.personalInsuranceTotal) + toNumber(salaryRecord.personalIncomeTax),
      },
      payment: {
        totalPayable: toNumber(salaryRecord.totalPayable),
        bankCardOrWechat: toNumber(salaryRecord.bankCardOrWechat),
        cashPaid: toNumber(salaryRecord.cashPaid),
        corporatePayment: toNumber(salaryRecord.corporatePayment),
      },
      status: {
        isConfirmed: salaryRecord.isConfirmed,
        confirmedAt: salaryRecord.confirmedAt,
        canConfirm: !salaryRecord.isConfirmed && toNumber(salaryRecord.totalPayable) > 0,
      },
    }
  },
}

// 生成SWR key的工具函数
export const getMySalaryKeys = {
  salaryList: (params: MySalaryQueryParams) => ['my-salary-list', params],
  salaryDetail: (id: number) => ['my-salary-detail', id],
  salaryStatistics: (yearMonth?: string) => ['my-salary-statistics', yearMonth],
}
