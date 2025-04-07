import request from './request'
import type { Permission, Role } from '../types'

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
