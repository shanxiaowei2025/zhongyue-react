import request from './request'
import type { ApiResponse, Permission, PermissionModule, RolePermissionMatrix } from '../types'

/**
 * 获取权限列表
 * @param params 查询参数
 */
export const getPermissionList = (params?: { role_name?: string; page_name?: string }) => {
  return request.get<ApiResponse<Permission[]>>('/permissions', params)
}

/**
 * 更新权限值
 * @param id 权限ID
 * @param data 更新数据
 */
export const updatePermission = (id: number, data: Partial<Permission>) => {
  return request.patch<ApiResponse<Permission>>(`/permissions/${id}`, data)
}

/**
 * 批量更新权限值
 * @param permissions 权限更新数据数组
 */
export const batchUpdatePermissions = (
  permissions: { id: number; permission_value: boolean }[]
) => {
  return request.post<ApiResponse<{ success: number; failed: number }>>(
    '/permissions/batch-update',
    { permissions }
  )
}

/**
 * 获取模块化权限列表
 * 按模块和角色组织的权限矩阵
 */
export const getModulePermissions = () => {
  return request.get<
    ApiResponse<{
      modules: PermissionModule[]
      rolePermissions: RolePermissionMatrix[]
    }>
  >('/permissions/modules')
}

/**
 * 检查权限
 * @param role_name 角色名称
 * @param permission_name 权限名称
 */
export const checkPermission = (role_name: string, permission_name: string) => {
  return request.get<ApiResponse<{ permission_value: boolean; permission: Permission | null }>>(
    '/permissions/check',
    { role_name, permission_name }
  )
}
