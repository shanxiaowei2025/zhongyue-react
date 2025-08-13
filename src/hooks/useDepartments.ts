import useSWR, { mutate } from 'swr'
import { message } from 'antd'
import type { Department } from '../types'
import {
  getDepartmentTree,
  getDepartmentList,
  getDepartment,
  getDepartmentUsers,
  createDepartment as apiCreateDepartment,
  updateDepartment as apiUpdateDepartment,
  deleteDepartment as apiDeleteDepartment,
  bulkDeleteDepartments as apiBulkDeleteDepartments,
} from '../api/department'

// 部门树请求的SWR键
const DEPARTMENTS_TREE_KEY = '/departments/tree'

// 定义级联选择器选项类型
interface CascaderOption {
  value: number
  label: string
  children?: CascaderOption[]
}

/**
 * 部门树数据的fetcher函数
 */
const departmentTreeFetcher = async () => {
  const response = await getDepartmentTree()
  if (response && response.code === 0) {
    return response.data
  }
  throw new Error(response?.message || '获取部门树失败')
}

/**
 * 转换部门树为级联选择器选项
 */
const transformToCascaderOptions = (departments: any[]): CascaderOption[] => {
  const transform = (depts: any[]): CascaderOption[] => {
    return depts.map(dept => ({
      value: dept.id,
      label: dept.name,
      children: dept.children ? transform(dept.children) : undefined,
    }))
  }

  return transform(departments)
}

/**
 * 获取部门路径的辅助函数
 */
export const getDepartmentPath = (deptId: number | undefined, departments: any[]): number[] => {
  const path: number[] = []

  const findPath = (depts: any[], targetId: number): boolean => {
    for (const dept of depts) {
      if (dept.id === targetId) {
        path.push(dept.id)
        return true
      }
      if (dept.children && dept.children.length > 0) {
        path.push(dept.id)
        if (findPath(dept.children, targetId)) {
          return true
        }
        path.pop()
      }
    }
    return false
  }

  if (deptId) {
    findPath(departments, deptId)
  }

  return path
}

/**
 * 使用SWR获取部门树的钩子
 */
export const useDepartments = () => {
  const { data, error, isLoading } = useSWR(DEPARTMENTS_TREE_KEY, departmentTreeFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3000,
  })

  const departments = data ? transformToCascaderOptions(data) : []
  const rawDepartments = data || []

  return {
    departments,
    rawDepartments,
    isLoading,
    isError: error,
  }
}

/**
 * 获取分公司列表的钩子
 */
export const useBranchOffices = () => {
  const { rawDepartments, isLoading, isError } = useDepartments()

  // 递归过滤出类型为分公司的部门
  const filterBranchOffices = (depts: any[]): any[] => {
    const result: any[] = []
    depts.forEach(dept => {
      if (dept.type === 2) {
        result.push(dept)
      }
      if (dept.children && dept.children.length > 0) {
        result.push(...filterBranchOffices(dept.children))
      }
    })
    return result
  }

  const branchOffices = filterBranchOffices(rawDepartments)

  return {
    branchOffices,
    isLoading,
    isError,
  }
}

// 部门列表请求的SWR键
const DEPARTMENTS_LIST_KEY = '/departments'

/**
 * 部门列表数据的fetcher函数
 */
const departmentListFetcher = async () => {
  const response = await getDepartmentList()
  if (response && response.code === 0) {
    return response.data
  }
  throw new Error(response?.message || '获取部门列表失败')
}

/**
 * 使用部门列表数据
 */
export const useDepartmentList = () => {
  const { data, error, isLoading } = useSWR(DEPARTMENTS_LIST_KEY, departmentListFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  const refreshDepartmentList = async () => {
    await mutate(DEPARTMENTS_LIST_KEY)
  }

  return {
    departments: data || [],
    loading: isLoading,
    error,
    refreshDepartmentList,
  }
}

/**
 * 使用部门详情数据
 */
export const useDepartmentDetail = (id?: number | null) => {
  const key = id ? `/departments/${id}` : null
  const { data, error, isLoading } = useSWR(
    key,
    async (url: string) => {
      const deptId = parseInt(url.split('/').pop() || '0')
      const response = await getDepartment(deptId)
      if (response && response.code === 0) {
        return response.data
      }
      throw new Error(response?.message || '获取部门详情失败')
    },
    {
      revalidateOnFocus: false,
    }
  )

  return {
    department: data,
    loading: isLoading,
    error,
  }
}

/**
 * 使用部门用户列表
 */
export const useDepartmentUsers = (id?: number | null) => {
  const key = id ? `/departments/${id}/users` : null
  const { data, error, isLoading } = useSWR(
    key,
    async (url: string) => {
      const deptId = parseInt(url.split('/')[2])
      const response = await getDepartmentUsers(deptId)
      if (response && response.code === 0) {
        return response.data
      }
      throw new Error(response?.message || '获取部门用户失败')
    },
    {
      revalidateOnFocus: false,
    }
  )

  return {
    users: data || [],
    loading: isLoading,
    error,
  }
}

/**
 * 部门管理操作方法
 */
export const useDepartmentOperations = () => {
  // 创建部门
  const createDepartment = async (data: Partial<Department>) => {
    try {
      const response = await apiCreateDepartment(data)
      if (response.code === 0) {
        message.success('创建部门成功')
        // 清除相关缓存
        await mutate(key => typeof key === 'string' && key.includes('/departments'), undefined, {
          revalidate: true,
        })
        return response.data
      } else {
        message.error(response.message || '创建部门失败')
        throw new Error(response.message || '创建部门失败')
      }
    } catch (error: any) {
      console.error('创建部门失败:', error)
      throw error
    }
  }

  // 更新部门
  const updateDepartment = async (id: number, data: Partial<Department>) => {
    try {
      const response = await apiUpdateDepartment(id, data)
      if (response.code === 0) {
        message.success('更新部门成功')
        // 清除相关缓存
        await mutate(key => typeof key === 'string' && key.includes('/departments'), undefined, {
          revalidate: true,
        })
        return response.data
      } else {
        message.error(response.message || '更新部门失败')
        throw new Error(response.message || '更新部门失败')
      }
    } catch (error: any) {
      console.error('更新部门失败:', error)
      throw error
    }
  }

  // 删除部门
  const deleteDepartment = async (id: number) => {
    try {
      const response = await apiDeleteDepartment(id)
      if (response.code === 0) {
        message.success('删除部门成功')
        // 清除相关缓存
        await mutate(key => typeof key === 'string' && key.includes('/departments'), undefined, {
          revalidate: true,
        })
        return true
      } else {
        message.error(response.message || '删除部门失败')
        return false
      }
    } catch (error: any) {
      console.error('删除部门失败:', error)
      message.error('删除部门失败')
      return false
    }
  }

  // 批量删除部门
  const bulkDeleteDepartments = async (ids: number[]) => {
    try {
      const response = await apiBulkDeleteDepartments(ids)
      if (response.code === 0) {
        const result = response.data as any
        message.success(`批量删除完成：成功 ${result.success} 个，失败 ${result.failed} 个`)
        // 清除相关缓存
        await mutate(key => typeof key === 'string' && key.includes('/departments'), undefined, {
          revalidate: true,
        })
        return result
      } else {
        message.error(response.message || '批量删除部门失败')
        throw new Error(response.message || '批量删除部门失败')
      }
    } catch (error: any) {
      console.error('批量删除部门失败:', error)
      throw error
    }
  }

  return {
    createDepartment,
    updateDepartment,
    deleteDepartment,
    bulkDeleteDepartments,
  }
}
