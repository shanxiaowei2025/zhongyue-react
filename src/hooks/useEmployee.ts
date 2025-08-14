import useSWR, { mutate } from 'swr'
import { message } from 'antd'
import {
  getEmployeeList,
  getEmployeeById,
  createEmployee as apiCreateEmployee,
  updateEmployee as apiUpdateEmployee,
  deleteEmployee as apiDeleteEmployee,
  getAllActiveEmployees,
} from '../api/employee'
import type {
  Employee,
  QueryEmployeeDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
} from '../types/employee'

/**
 * 员工列表请求的SWR键生成器
 */
export const getEmployeeListKey = (params: QueryEmployeeDto) => {
  const { page, pageSize, ...searchParams } = params
  const searchStr = Object.entries(searchParams)
    .filter(([_, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join('&')

  return `/employee?page=${page}&pageSize=${pageSize}${searchStr ? `&${searchStr}` : ''}`
}

/**
 * 员工详情请求的SWR键生成器
 */
export const getEmployeeDetailKey = (id?: number | null) => (id ? `/employee/${id}` : null)

/**
 * 员工列表数据的fetcher函数
 */
export const employeeListFetcher = async (url: string) => {
  const urlObj = new URL(url, window.location.origin)
  const page = urlObj.searchParams.get('page') || '1'
  const pageSize = urlObj.searchParams.get('pageSize') || '10'

  const searchParams: Record<string, any> = {}
  urlObj.searchParams.forEach((value, key) => {
    if (key !== 'page' && key !== 'pageSize') {
      searchParams[key] = value
    }
  })

  const response = await getEmployeeList({
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    ...searchParams,
  })

  return response
}

/**
 * 员工详情数据的fetcher函数
 */
export const employeeDetailFetcher = async (url: string) => {
  const id = parseInt(url.split('/').pop() || '0')
  return await getEmployeeById(id)
}

/**
 * 使用员工列表数据
 */
export const useEmployeeList = (params: QueryEmployeeDto) => {
  const key = getEmployeeListKey(params)
  const {
    data,
    error,
    isLoading,
    mutate: mutateSelf,
  } = useSWR(key, employeeListFetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  const refreshEmployeeList = () => {
    mutateSelf()
  }

  const removeEmployee = (id: number) => {
    if (data) {
      const newData = {
        ...data,
        items: data.items.filter(item => item.id !== id),
        total: data.total - 1,
      }
      mutateSelf(newData, false)
    }
  }

  const updateEmployeeInList = (id: number, updatedEmployee: Employee) => {
    if (data) {
      const newData = {
        ...data,
        items: data.items.map(item => (item.id === id ? updatedEmployee : item)),
      }
      mutateSelf(newData, false)
    }
  }

  const addEmployeeToList = (newEmployee: Employee) => {
    if (data) {
      const newData = {
        ...data,
        items: [newEmployee, ...data.items],
        total: data.total + 1,
      }
      mutateSelf(newData, false)
    }
  }

  return {
    employees: data?.items || [],
    total: data?.total || 0,
    isLoading,
    error,
    refreshEmployeeList,
    removeEmployee,
    updateEmployeeInList,
    addEmployeeToList,
  }
}

/**
 * 使用员工详情数据
 */
export const useEmployeeDetail = (id?: number | null) => {
  const key = getEmployeeDetailKey(id)
  const {
    data,
    error,
    isLoading,
    mutate: mutateSelf,
  } = useSWR(key, employeeDetailFetcher, {
    revalidateOnFocus: false,
  })

  return {
    employee: data,
    isLoading,
    error,
    refreshEmployee: mutateSelf,
  }
}

/**
 * 创建员工
 */
export const useCreateEmployee = () => {
  const createEmployee = async (data: CreateEmployeeDto) => {
    try {
      const newEmployee = await apiCreateEmployee(data)

      // 清除相关缓存
      mutate(key => typeof key === 'string' && key.startsWith('/employee?'), undefined, {
        revalidate: true,
      })

      message.success('员工创建成功')
      return newEmployee
    } catch (error: any) {
      console.error('创建员工失败:', error)
      throw error
    }
  }

  return { createEmployee }
}

/**
 * 更新员工
 */
export const useUpdateEmployee = () => {
  const updateEmployee = async (id: number, data: UpdateEmployeeDto) => {
    try {
      const updatedEmployee = await apiUpdateEmployee(id, data)

      // 清除相关缓存
      mutate(key => typeof key === 'string' && key.startsWith('/employee'), undefined, {
        revalidate: true,
      })

      message.success('员工信息更新成功')
      return updatedEmployee
    } catch (error: any) {
      console.error('更新员工信息失败:', error)
      throw error
    }
  }

  return { updateEmployee }
}

/**
 * 删除员工
 */
export const useDeleteEmployee = () => {
  const deleteEmployee = async (id: number) => {
    try {
      const result = await apiDeleteEmployee(id)

      // 清除相关缓存
      mutate(key => typeof key === 'string' && key.startsWith('/employee'), undefined, {
        revalidate: true,
      })

      message.success('员工删除成功')
      return result
    } catch (error: any) {
      console.error('删除员工失败:', error)
      throw error
    }
  }

  return { deleteEmployee }
}

/**
 * 获取所有在职员工
 */
export const useActiveEmployees = () => {
  const { data, error, isLoading } = useSWR('/employee/active', () => getAllActiveEmployees(), {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  })

  return {
    activeEmployees: data || [],
    isLoading,
    error,
  }
}
