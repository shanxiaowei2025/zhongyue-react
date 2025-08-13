import useSWR, { mutate } from 'swr'
import { message } from 'antd'
import {
  getRoleList,
  createRole as apiCreateRole,
  updateRole as apiUpdateRole,
  deleteRole as apiDeleteRole,
} from '../api/roles'
import type { Role } from '../types'

// 角色列表请求的SWR键生成器
export const getRoleListKey = () => '/roles'

// 角色列表数据获取器
export const roleListFetcher = async () => {
  return await getRoleList()
}

/**
 * 使用角色列表数据
 */
export const useRoleList = () => {
  const { data, error, isLoading } = useSWR(getRoleListKey(), roleListFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000, // 角色数据变化较少，缓存时间长一些
  })

  // 刷新角色列表
  const refreshRoleList = async () => {
    await mutate(getRoleListKey())
  }

  return {
    roles: (data?.data as Role[]) || [],
    loading: isLoading,
    error,
    refreshRoleList,
  }
}

/**
 * 角色管理操作方法
 */
export const useRoleOperations = () => {
  // 创建角色
  const createRole = async (data: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await apiCreateRole(data)
      if (response.code === 0) {
        message.success('添加角色成功')
        // 清除相关缓存
        await mutate(getRoleListKey())
        return response.data
      } else {
        message.error(response.message || '添加角色失败')
        throw new Error(response.message || '添加角色失败')
      }
    } catch (error: any) {
      console.error('添加角色失败:', error)
      throw error
    }
  }

  // 更新角色
  const updateRole = async (id: number, data: Partial<Role>) => {
    try {
      const response = await apiUpdateRole(id, data)
      if (response.code === 0) {
        message.success('更新角色成功')
        // 清除相关缓存
        await mutate(getRoleListKey())
        return response.data
      } else {
        message.error(response.message || '更新角色失败')
        throw new Error(response.message || '更新角色失败')
      }
    } catch (error: any) {
      console.error('更新角色失败:', error)
      throw error
    }
  }

  // 删除角色
  const deleteRole = async (id: number) => {
    try {
      const response = await apiDeleteRole(id)
      if (response.code === 0) {
        message.success('删除角色成功')
        // 清除相关缓存
        await mutate(getRoleListKey())
        return true
      } else {
        message.error(response.message || '删除角色失败')
        return false
      }
    } catch (error: any) {
      console.error('删除角色失败:', error)
      message.error('删除角色失败')
      return false
    }
  }

  return {
    createRole,
    updateRole,
    deleteRole,
  }
}
