import request from './request'
import type {
  User,
  LoginForm,
  RegisterForm,
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
} from '../types'

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
export const getUserList = (page = 1, limit = 10, keyword?: string) => {
  const params: any = { page, limit }
  if (keyword) {
    params.keyword = keyword
  }
  return request.get<ApiResponse<PaginatedResponse<User>>>('/users', params)
}

// 搜索用户
export const searchUsers = (username: string, page = 1, limit = 10) => {
  return request.get<ApiResponse<PaginatedResponse<User>>>('/users/search', {
    username,
    page,
    limit
  })
}

// 获取用户详情
export const getUser = (id: number) => {
  return request.get<ApiResponse<User>>(`/users/${id}`)
}

// 创建用户
export const createUser = (data: Partial<User>) => {
  return request.post<ApiResponse<User>>('/users', data)
}

// 更新用户
export const updateUserById = (id: number, data: Partial<User>) => {
  return request.patch<ApiResponse<User>>(`/users/${id}`, data)
}

// 删除用户
export const deleteUser = (id: number) => {
  return request.delete<ApiResponse<any>>(`/users/${id}`)
}
