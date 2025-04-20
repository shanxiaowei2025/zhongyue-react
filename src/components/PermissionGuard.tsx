import React, { ReactNode } from 'react'
import { usePermission } from '../hooks/usePermission'

interface PermissionGuardProps {
  permissionName: string
  children: ReactNode
  fallback?: ReactNode
}

/**
 * 权限守卫组件
 * 用于根据权限控制UI元素的显示
 *
 * @param permissionName 权限名称
 * @param children 有权限时显示的内容
 * @param fallback 无权限时显示的内容
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permissionName,
  children,
  fallback = null,
}) => {
  const { hasPermission } = usePermission()

  // 检查是否有权限
  if (hasPermission(permissionName)) {
    return <>{children}</>
  }

  // 无权限时显示替代内容
  return <>{fallback}</>
}

export default PermissionGuard
