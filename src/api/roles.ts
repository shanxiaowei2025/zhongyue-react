import request from './request'
import type { ApiResponse, Role } from '../types'

// 获取角色列表
export const getRoleList = () => {
  return request.get<ApiResponse<Role[]>>('/roles')
}

// 获取角色详情
export const getRole = (id: number) => {
  return request.get<ApiResponse<Role>>(`/roles/${id}`)
}

// 创建角色
export const createRole = (data: Partial<Role>) => {
  return request.post<ApiResponse<Role>>('/roles', data)
}

// 更新角色
export const updateRole = (id: number, data: Partial<Role>) => {
  return request.patch<ApiResponse<Role>>(`/roles/${id}`, data)
}

// 删除角色
export const deleteRole = (id: number) => {
  return request.delete<ApiResponse<any>>(`/roles/${id}`)
}

// 更新角色权限
export const updateRolePermissions = (id: number, permissionIds: number[]) => {
  return request.patch<ApiResponse<Role>>(`/roles/${id}/permissions`, {
    permission_ids: permissionIds,
  })
}
