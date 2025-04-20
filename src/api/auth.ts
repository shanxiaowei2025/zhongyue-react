import request from './request'
import type { LoginForm, ApiResponse } from '../types'

/**
 * 登录接口
 * @param data 登录表单数据
 */
export const login = (data: LoginForm) => {
  return request.post<ApiResponse<{
    access_token: string;
    user_info: {
      id: number;
      username: string;
      nickname: string;
      roles: string[];
      phone: string | null;
      email: string;
      avatar: string;
    }
  }>>('/auth/login', {
    username: data.username,
    password: data.password
  })
}

/**
 * 获取当前登录用户的个人资料
 */
export const getUserProfile = () => {
  return request.get<ApiResponse<{
    id: number;
    username: string;
    nickname: string;
    roles: string[];
    permissions: string[];
    phone: string | null;
    email: string;
    avatar: string;
  }>>('/auth/profile')
}
