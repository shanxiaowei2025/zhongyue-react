// 用户相关类型
export interface User {
  id: number
  username: string
  password: string
  nickname: string
  email: string
  avatar: string
  phone: string
  sex: 0 | 1
  status: 0 | 1
  dept_id?: number
  remark: string
  roles: string[]
  user_groups: string[]
  user_permissions: string[]
  is_superuser: boolean
  is_staff: boolean
  is_active: boolean
  is_expense_auditor: boolean
  date_joined: string
  last_login?: string
  first_name: string
  last_name: string
  create_time: string
  update_time: string
}

// 权限相关类型
export interface Permission {
  id: number
  role_name: string
  page_name: string
  permission_name: string
  permission_value: boolean
  description: string
  role_id: number
}

// 角色相关类型
export interface Role {
  id: number
  name: string
  code: string
  status: 0 | 1
  remark: string
  create_time: string
  update_time: string
}

// API 响应类型
export interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

// 分页参数类型
export interface PaginationParams {
  page: number
  pageSize: number
  keyword?: string
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// 登录表单类型
export interface LoginForm {
  username: string
  password: string
  remember?: boolean
}

// 注册表单类型
export interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthGroup {
  id: number
  name: string
}

export interface AuthPermission {
  id: number
  name: string
  content_type_id: number
  codename: string
}

export interface AuthGroupPermission {
  id: number
  group_id: number
  permission_id: number
}
