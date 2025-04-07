import request from './request'
import type { User, LoginForm, RegisterForm, PaginationParams, PaginatedResponse } from '../types'

// 登录
export const login = (data: LoginForm) => {
  return request.post<{ token: string; user: User }>('/auth/login', data)
}

// 注册
export const register = (data: RegisterForm) => {
  return request.post<{ token: string; user: User }>('/auth/register', data)
}

// 获取当前用户信息
export const getCurrentUser = () => {
  return request.get<User>('/users/me')
}

// 更新用户信息
export const updateUser = (data: Partial<User>) => {
  return request.put<User>('/users/me', data)
}

// 修改密码
export const changePassword = (data: { oldPassword: string; newPassword: string }) => {
  return request.put('/users/me/password', data)
}

// 获取用户列表
export const getUserList = (params: PaginationParams & { keyword?: string }) => {
  return request.get<PaginatedResponse<User>>('/users', params)
}

// 创建用户
export const createUser = (data: Partial<User> & { password: string }) => {
  return request.post<User>('/users', data)
}

// 更新指定用户
export const updateUserById = (id: string, data: Partial<User>) => {
  return request.put<User>(`/users/${id}`, data)
}

// 删除用户
export const deleteUser = (id: string) => {
  return request.delete<void>(`/users/${id}`)
}
