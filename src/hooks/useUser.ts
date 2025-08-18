import useSWR, { mutate } from 'swr'
import { message } from 'antd'
import {
  getUserList,
  createUser as apiCreateUser,
  updateUserById as apiUpdateUser,
  deleteUser as apiDeleteUser,
  searchUsers as apiSearchUsers,
} from '../api/user'
import { getDepartmentTree } from '../api/department'
import { getRoleList } from '../api/roles'

// 用户列表请求的SWR键生成器
export const getUserListKey = (params: {
  page?: number
  pageSize?: number
  keyword?: string
  searchText?: string
  role?: string
}) => {
  const { page = 1, pageSize = 10, keyword, searchText, role } = params
  if (searchText) {
    return `/user/search?page=${page}&pageSize=${pageSize}&searchText=${searchText}`
  }
  const roleParam = role ? `&role=${role}` : ''
  return `/user?page=${page}&pageSize=${pageSize}${keyword ? `&keyword=${keyword}` : ''}${roleParam}`
}

// 用户列表数据获取器
export const userListFetcher = async (key: string) => {
  const url = new URL(key, window.location.origin)
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
  const keyword = url.searchParams.get('keyword') || ''
  const searchText = url.searchParams.get('searchText')
  const role = url.searchParams.get('role') || ''

  if (searchText) {
    // 使用搜索接口
    return await apiSearchUsers(searchText, page, pageSize)
  } else {
    // 使用常规列表接口
    return await getUserList(page, pageSize, keyword, role)
  }
}

// 部门树数据获取器
export const departmentTreeFetcher = async () => {
  return await getDepartmentTree()
}

// 角色列表数据获取器
export const roleListFetcher = async () => {
  return await getRoleList()
}

/**
 * 使用用户列表数据
 */
export const useUserList = (params: {
  page?: number
  pageSize?: number
  keyword?: string
  searchText?: string
  role?: string
}) => {
  const key = getUserListKey(params)
  const { data, error, isLoading } = useSWR(key, userListFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3000,
  })

  // 刷新用户列表
  const refreshUserList = async () => {
    await mutate(key)
  }

  return {
    users: (data?.data as any)?.items || [],
    pagination: {
      current: (data?.data as any)?.meta?.page || 1,
      pageSize: (data?.data as any)?.meta?.limit || 10,
      total: (data?.data as any)?.meta?.total || 0,
    },
    loading: isLoading,
    error,
    refreshUserList,
  }
}

/**
 * 使用部门树数据
 */
export const useDepartmentTree = () => {
  const { data, error, isLoading } = useSWR('/department/tree', departmentTreeFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // 部门数据变化较少，缓存时间长一些
  })

  return {
    departmentTree: data?.data || [],
    loading: isLoading,
    error,
  }
}

/**
 * 使用角色列表数据
 */
export const useRoleList = () => {
  const { data, error, isLoading } = useSWR('/roles', roleListFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // 角色数据变化较少，缓存时间长一些
  })

  return {
    roles: data?.data || [],
    loading: isLoading,
    error,
  }
}

/**
 * 用户管理操作方法
 */
export const useUserOperations = () => {
  // 创建用户
  const createUser = async (data: any) => {
    try {
      const response = await apiCreateUser(data)
      if (response.code === 0) {
        message.success('添加用户成功')
        // 清除相关缓存
        await mutate(key => typeof key === 'string' && key.includes('/user'), undefined, {
          revalidate: true,
        })
        return response.data
      } else {
        throw new Error(response.message || '添加用户失败')
      }
    } catch (error: any) {
      console.error('添加用户失败:', error)
      throw error
    }
  }

  // 更新用户
  const updateUser = async (id: number, data: any) => {
    try {
      const response = await apiUpdateUser(id, data)
      if (response.code === 0) {
        message.success('更新用户成功')
        // 清除相关缓存
        await mutate(key => typeof key === 'string' && key.includes('/user'), undefined, {
          revalidate: true,
        })
        return response.data
      } else {
        throw new Error(response.message || '更新用户失败')
      }
    } catch (error: any) {
      console.error('更新用户失败:', error)
      throw error
    }
  }

  // 删除用户
  const deleteUser = async (id: number) => {
    try {
      const response = await apiDeleteUser(id)
      if (response.code === 0) {
        message.success('删除用户成功')
        // 清除相关缓存
        await mutate(key => typeof key === 'string' && key.includes('/user'), undefined, {
          revalidate: true,
        })
        return true
      } else {
        throw new Error(response.message || '删除用户失败')
      }
    } catch (error: any) {
      console.error('删除用户失败:', error)
      return false
    }
  }

  return {
    createUser,
    updateUser,
    deleteUser,
  }
}
