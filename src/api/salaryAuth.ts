import request from './request'
import type { ApiResponse } from '../types'
import type {
  SalaryAuthRequest,
  SalaryAuthResponse,
  SalaryPasswordStatus,
  SetSalaryPasswordRequest,
  ChangeSalaryPasswordRequest,
  SalaryPasswordOperationResponse,
} from '../types/salaryAuth'

// 薪资认证API封装
export const salaryAuthApi = {
  /**
   * 验证薪资密码
   * POST /api/auth/salary/verify
   */
  async verifySalaryPassword(salaryPassword: string): Promise<SalaryAuthResponse> {
    const response = await request.post<
      ApiResponse<{
        salaryAccessToken: string
        expiresIn: number
        message: string
      }>
    >('/auth/salary/verify', { salaryPassword } as SalaryAuthRequest)

    return {
      success: response.code === 0,
      message: response.message || '验证成功',
      data: response.data,
    }
  },

  /**
   * 设置薪资密码（首次设置）
   * POST /api/auth/salary/set-password
   */
  async setSalaryPassword(salaryPassword: string): Promise<SalaryPasswordOperationResponse> {
    const response = await request.post<ApiResponse<null>>('/auth/salary/set-password', {
      salaryPassword,
    } as SetSalaryPasswordRequest)

    return {
      success: response.code === 0,
      message: response.message || '设置成功',
    }
  },

  /**
   * 修改薪资密码
   * POST /api/auth/salary/change-password
   */
  async changeSalaryPassword(
    currentSalaryPassword: string,
    newSalaryPassword: string
  ): Promise<SalaryPasswordOperationResponse> {
    const response = await request.post<ApiResponse<null>>('/auth/salary/change-password', {
      currentSalaryPassword,
      newSalaryPassword,
    } as ChangeSalaryPasswordRequest)

    return {
      success: response.code === 0,
      message: response.message || '修改成功',
    }
  },

  /**
   * 检查薪资密码状态
   * GET /api/auth/salary/check-password
   */
  async checkSalaryPasswordStatus(): Promise<SalaryPasswordStatus> {
    const response = await request.get<ApiResponse<SalaryPasswordStatus>>(
      '/auth/salary/check-password'
    )

    return response.data
  },
}
