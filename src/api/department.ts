import request from './request'
import type { ApiResponse, Department, DepartmentQueryParams, DepartmentTreeNode } from '../types'

/**
 * 获取部门列表
 * @param params 查询参数
 */
export const getDepartmentList = (params?: DepartmentQueryParams) => {
  return request.get<ApiResponse<Department[]>>('/departments', params)
}

/**
 * 获取部门树形结构
 */
export const getDepartmentTree = () => {
  return request.get<ApiResponse<DepartmentTreeNode[]>>('/departments/tree')
}

/**
 * 获取单个部门详情
 * @param id 部门ID
 */
export const getDepartment = (id: number) => {
  return request.get<ApiResponse<Department>>(`/departments/${id}`)
}

/**
 * 获取部门下的用户列表
 * @param id 部门ID
 */
export const getDepartmentUsers = (id: number) => {
  return request.get<ApiResponse<any[]>>(`/departments/${id}/users`)
}

/**
 * 创建部门
 * @param data 部门数据
 */
export const createDepartment = (data: Partial<Department>) => {
  return request.post<ApiResponse<Department>>('/departments', data)
}

/**
 * 更新部门
 * @param id 部门ID
 * @param data 更新数据
 */
export const updateDepartment = (id: number, data: Partial<Department>) => {
  return request.patch<ApiResponse<Department>>(`/departments/${id}`, data)
}

/**
 * 删除部门
 * @param id 部门ID
 */
export const deleteDepartment = (id: number) => {
  return request.delete<ApiResponse<any>>(`/departments/${id}`)
}

/**
 * 批量删除部门
 * @param ids 部门ID数组
 */
export const bulkDeleteDepartments = (ids: number[]) => {
  return request.post<ApiResponse<{success: number, failed: number}>>('/departments/bulk-delete', { ids })
} 