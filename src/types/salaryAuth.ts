// 薪资认证相关类型定义
export interface SalaryAuthRequest {
  salaryPassword: string
}

export interface SalaryAuthResponse {
  success: boolean
  message: string
  data: {
    salaryAccessToken: string
    expiresIn: number
    message: string
  }
}

export interface SalaryPasswordStatus {
  hasPassword: boolean
  passwordSetAt?: string
}

export interface SetSalaryPasswordRequest {
  salaryPassword: string
}

export interface ChangeSalaryPasswordRequest {
  currentSalaryPassword: string
  newSalaryPassword: string
}

export interface SalaryPasswordOperationResponse {
  success: boolean
  message: string
}

// 薪资token信息
export interface SalaryTokenInfo {
  token: string
  expiresAt: number // 时间戳
}
