import request from './request'
import type { LoginForm, ApiResponse } from '../types'

/**
 * 登录接口
 * @param data 登录表单数据
 */
export const login = (data: LoginForm) => {
  return request.post<
    ApiResponse<{
      access_token: string
      user_info: {
        id: number
        username: string
        nickname: string
        roles: string[]
        phone: string | null
        email: string
        avatar: string
      }
    }>
  >('/auth/login', {
    username: data.username,
    password: data.password,
  })
}

/**
 * 获取当前登录用户的个人资料
 */
export const getUserProfile = () => {
  return request.get<
    ApiResponse<{
      id: number
      username: string
      nickname: string
      roles: string[]
      permissions: string[]
      phone: string | null
      email: string
      avatar: string
    }>
  >('/auth/profile')
}

export interface UpdateUserParams {
  username?: string
  password?: string
  dept_id?: number
  isActive?: boolean
  phone?: string
  email?: string
}

/**
 * 更新当前登录用户的个人资料
 */
export const updateUserProfile = (id: number, data: UpdateUserParams) => {
  // 普通用户使用新接口更新自己的资料
  return request.put<ApiResponse<any>>('/auth/profile', {
    email: data.email,
    phone: data.phone,
  })
}

/**
 * 修改当前登录用户的密码
 */
export const changePassword = (data: { oldPassword: string; newPassword: string }) => {
  return request.put<ApiResponse<null>>('/auth/change-password', data)
}
