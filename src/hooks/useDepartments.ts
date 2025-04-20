import useSWR from 'swr'
import type { Department } from '../types'
import { getDepartmentList } from '../api/department'

// 部门列表请求的SWR键
const DEPARTMENTS_KEY = '/departments'

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
 * 使用SWR获取部门列表的钩子
 */
export const useDepartments = () => {
  const { data, error, isLoading } = useSWR(DEPARTMENTS_KEY, departmentListFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3000,
  })

  return {
    departments: data || [],
    isLoading,
    isError: error,
  }
}

/**
 * 获取分公司列表的钩子
 */
export const useBranchOffices = () => {
  const { departments, isLoading, isError } = useDepartments()

  // 过滤出类型为分公司的部门
  const branchOffices = departments.filter(dept => dept.type === 2)

  return {
    branchOffices,
    isLoading,
    isError,
  }
}
