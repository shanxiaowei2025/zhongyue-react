import { useMemo, useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../store/auth'
import { getPermissionList } from '../api/permissions'
import type { Permission } from '../types'

/**
 * 使用权限钩子，用于判断当前用户是否拥有指定权限
 * @returns 包含权限判断函数的对象
 */
export const usePermission = () => {
  const { user } = useAuthStore()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // 获取当前用户所有权限
  const fetchPermissions = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      // 不过滤页面名称，获取所有权限
      const response = await getPermissionList()
      if (response.code === 0 && response.data) {
        console.log('获取到所有权限列表:', response.data)
        // 记录客户管理相关的权限
        const customerPermissions = response.data.filter(p => p.page_name === '客户管理')
        console.log('客户管理相关权限:', customerPermissions)

        // 记录费用管理相关的权限
        const expensePermissions = response.data.filter(p => p.page_name === '费用管理')
        console.log('费用管理相关权限:', expensePermissions)

        // 记录当前用户角色的权限
        if (user.roles.length > 0) {
          const userRolePermissions = response.data.filter(p => user.roles.includes(p.role_name))
          console.log('当前用户角色的权限:', userRolePermissions)

          // 特别记录当前用户角色的客户管理权限
          const userCustomerPermissions = userRolePermissions.filter(
            p => p.page_name === '客户管理'
          )
          console.log('当前用户角色的客户管理权限:', userCustomerPermissions)

          // 特别记录当前用户角色的费用管理权限
          const userExpensePermissions = userRolePermissions.filter(p => p.page_name === '费用管理')
          console.log('当前用户角色的费用管理权限:', userExpensePermissions)
        }

        setPermissions(response.data)
      } else {
        throw new Error(response.message || '获取权限失败')
      }
    } catch (err) {
      console.error('获取权限列表失败:', err)
      setError(err instanceof Error ? err : new Error('未知错误'))
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchPermissions()
    }
  }, [user, fetchPermissions])

  // 检查角色是否有指定权限（考虑角色代码和角色名称）
  const hasRolePermission = useCallback(
    (role: string, permissionName: string) => {
      const permission = permissions.find(
        p =>
          // 检查角色名称
          (p.role_name === role ||
            // 检查角色对象中的code字段
            (p.role && p.role.code === role) ||
            // 检查角色对象中的name字段
            (p.role && p.role.name === role)) &&
          // 检查权限名称
          p.permission_name === permissionName
      )

      return permission && permission.permission_value === true
    },
    [permissions]
  )

  // 检查是否有指定权限
  const hasPermission = useCallback(
    (permissionName: string) => {
      if (!user || !permissions.length) {
        console.log(`权限检查[${permissionName}]: 用户未登录或权限列表为空`)
        return false
      }

      // 超级管理员始终返回true
      if (user.roles.includes('super_admin') || user.roles.includes('超级管理员')) {
        console.log(`权限检查[${permissionName}]: 用户是超级管理员，自动授予权限`)
        return true
      }

      // 打印当前检查的权限名称和用户角色
      console.log(`权限检查[${permissionName}]: 用户角色=${user.roles.join(',')}`)

      // 打印与此权限相关的所有配置
      const permissionConfigs = permissions.filter(p => p.permission_name === permissionName)
      console.log(`${permissionName}的所有权限配置:`, permissionConfigs)

      // 对于每个用户角色，检查对应权限的值
      for (const role of user.roles) {
        // 使用新方法检查角色权限
        const hasPermission = hasRolePermission(role, permissionName)

        // 调试日志
        console.log(`权限检查[${permissionName}][${role}]: ${hasPermission ? '有权限' : '无权限'}`)

        // 如果有权限，立即返回true
        if (hasPermission) {
          return true
        }
      }

      // 如果没有找到任何角色有此权限，则没有权限
      return false
    },
    [user, permissions, hasRolePermission]
  )

  // 客户管理页面相关权限
  const customerPermissions = useMemo(() => {
    // 如果权限列表为空，开启降级模式，默认所有权限为true
    if (!user || permissions.length === 0) {
      console.log('权限列表为空，开启降级模式，默认所有客户管理权限为true')
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canViewAll: true,
        canViewByLocation: true,
        canViewOwn: true,
      }
    }

    // 添加详细的权限调试信息
    const permissionResults = {
      canCreate: hasPermission('customer_action_create'),
      canEdit: hasPermission('customer_action_edit'),
      canDelete: hasPermission('customer_action_delete'),
      canViewAll: hasPermission('customer_date_view_all'),
      canViewByLocation: hasPermission('customer_date_view_by_location'),
      canViewOwn: hasPermission('customer_date_view_own'),
    }

    // 输出用户角色和权限调试信息
    console.log('当前用户角色:', user?.roles)
    console.log('客户管理权限详情:', permissionResults)

    return permissionResults
  }, [hasPermission, user, permissions.length])

  // 费用管理页面相关权限
  const expensePermissions = useMemo(() => {
    // 如果权限列表为空，开启降级模式，默认所有权限为true
    if (!user || permissions.length === 0) {
      console.log('权限列表为空，开启降级模式，默认所有费用管理权限为true')
      return {
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canAudit: true,
        canCancelAudit: true,
        canViewReceipt: true,
        canViewAll: true,
        canViewByLocation: true,
        canViewOwn: true,
      }
    }

    // 添加详细的权限调试信息
    const permissionResults = {
      canCreate: hasPermission('expense_action_create'),
      canEdit: hasPermission('expense_action_edit'),
      canDelete: hasPermission('expense_action_delete'),
      canAudit: hasPermission('expense_action_audit'),
      canCancelAudit: hasPermission('expense_action_cancel_audit'),
      canViewReceipt: hasPermission('expense_action_view_receipt'),
      canViewAll: hasPermission('expense_data_view_all'),
      canViewByLocation: hasPermission('expense_data_view_by_location'),
      canViewOwn: hasPermission('expense_data_view_own'),
    }

    // 输出用户角色和权限调试信息
    console.log('当前用户角色:', user?.roles)
    console.log('费用管理权限详情:', permissionResults)

    return permissionResults
  }, [hasPermission, user, permissions.length])

  return {
    permissions,
    loading,
    error,
    hasPermission,
    customerPermissions,
    expensePermissions,
    refreshPermissions: fetchPermissions,
  }
}
