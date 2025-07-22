import useSWR from 'swr'
import type { Department } from '../types'
import { getDepartmentTree } from '../api/department'

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
