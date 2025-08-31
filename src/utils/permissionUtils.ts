import type { User } from '../types'

/**
 * 权限检查工具函数
 */

// 检查用户是否为超级管理员或管理员
export const isAdminUser = (user: User | null): boolean => {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return false
  }

  const adminRoles = ['super_admin', 'admin', '超级管理员', '管理员']
  return user.roles.some(role => adminRoles.includes(role))
}

// 检查用户是否为超级管理员
export const isSuperAdmin = (user: User | null): boolean => {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return false
  }

  const superAdminRoles = ['super_admin', '超级管理员']
  return user.roles.some(role => superAdminRoles.includes(role))
}

// 检查用户是否有指定角色
export const hasRole = (user: User | null, role: string): boolean => {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return false
  }

  return user.roles.includes(role)
}

// 检查用户是否有任意一个指定角色
export const hasAnyRole = (user: User | null, roles: string[]): boolean => {
  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return false
  }

  return roles.some(role => user.roles.includes(role))
}
