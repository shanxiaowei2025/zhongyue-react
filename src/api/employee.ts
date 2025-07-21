import request from './request'
import type {
  Employee,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  QueryEmployeeDto,
  EmployeeListResponse,
  EmployeeDeleteResponse,
} from '../types/employee'
import type { ApiResponse } from '../types'

// 创建员工
export const createEmployee = async (data: CreateEmployeeDto): Promise<Employee> => {
  const response = await request.post<ApiResponse<Employee>>('/employee', data)
  return response.data
}

// 查询员工列表
export const getEmployeeList = async (params: QueryEmployeeDto): Promise<EmployeeListResponse> => {
  const response = await request.get<ApiResponse<EmployeeListResponse>>('/employee', { params })
  return response.data
}

// 查询单个员工
export const getEmployeeById = async (id: number): Promise<Employee> => {
  const response = await request.get<ApiResponse<Employee>>(`/employee/${id}`)
  return response.data
}

// 更新员工信息
export const updateEmployee = async (id: number, data: UpdateEmployeeDto): Promise<Employee> => {
  const response = await request.patch<ApiResponse<Employee>>(`/employee/${id}`, data)
  return response.data
}

// 删除员工
export const deleteEmployee = async (id: number): Promise<EmployeeDeleteResponse> => {
  const response = await request.delete<ApiResponse<EmployeeDeleteResponse>>(`/employee/${id}`)
  return response.data
}

// 根据姓名查找员工
export const getEmployeeByName = async (name: string): Promise<Employee[]> => {
  const response = await request.get<ApiResponse<Employee[]>>('/employee/search', {
    params: { name },
  })
  return response.data
}

// 获取所有在职员工（不分页）
export const getAllActiveEmployees = async (): Promise<Employee[]> => {
  const response = await request.get<ApiResponse<Employee[]>>('/employee/active')
  return response.data
}
