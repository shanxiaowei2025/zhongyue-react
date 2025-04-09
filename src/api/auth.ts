import request from './request'
import type { Permission, Role, LoginForm, ApiResponse } from '../types'

// 登录接口
export const login = (data: LoginForm) => {
  return request.post<ApiResponse<{
    access_token: string;
    user_info: {
      id: number;
      username: string;
      roles: string[];
      phone: string | null;
      email: string;
    }
  }>>('/auth/login', {
    username: data.username,
    password: data.password
  })
}

// 获取所有权限
export const getAllPermissions = () => {
  return request.get<Permission[]>('/permissions')
}

// 获取所有角色
export const getAllRoles = () => {
  return request.get<Role[]>('/roles')
}

// 创建角色
export const createRole = (data: Omit<Role, 'id'>) => {
  return request.post<Role>('/roles', data)
}

// 更新角色
export const updateRole = (id: string, data: Partial<Role>) => {
  return request.put<Role>(`/roles/${id}`, data)
}

// 删除角色
export const deleteRole = (id: string) => {
  return request.delete(`/roles/${id}`)
}

// 分配角色权限
export const assignRolePermissions = (roleId: string, permissionIds: string[]) => {
  return request.put(`/roles/${roleId}/permissions`, { permissionIds })
}
