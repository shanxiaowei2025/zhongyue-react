import { useMemo } from 'react'
import { useAuthStore } from '../store/auth'
import type { VoucherRecordPermissions } from '../types/voucherRecord'

/**
 * 凭证记录权限管理Hook
 * 基于用户角色判断凭证记录相关操作权限
 */
export const useVoucherPermission = (): VoucherRecordPermissions => {
  const { user } = useAuthStore()

  return useMemo(() => {
    if (!user?.roles || user.roles.length === 0) {
      return {
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: false,
      }
    }

    const roles = user.roles.map(role => role.toLowerCase())

    // 管理员和超级管理员拥有所有权限
    if (roles.includes('admin') || roles.includes('super_admin') || roles.includes('superadmin')) {
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
      }
    }

    // 记账会计权限：查看、创建、编辑、删除、导出
    if (roles.includes('bookkeepingaccountant') || roles.includes('bookkeeping_accountant')) {
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: true,
      }
    }

    // 顾问会计权限：查看、导出
    if (roles.includes('consultantaccountant') || roles.includes('consultant_accountant')) {
      return {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canExport: true,
      }
    }

    // 其他用户默认无权限
    return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canExport: false,
    }
  }, [user])
}

/**
 * 检查是否有特定权限
 */
export const useHasVoucherPermission = (permission: keyof VoucherRecordPermissions): boolean => {
  const permissions = useVoucherPermission()
  return permissions[permission]
}

/**
 * 获取权限提示信息
 */
export const useVoucherPermissionTips = () => {
  const permissions = useVoucherPermission()
  const { user } = useAuthStore()

  return useMemo(() => {
    const tips: Record<keyof VoucherRecordPermissions, string> = {
      canView: permissions.canView ? '' : '您没有查看凭证记录的权限',
      canCreate: permissions.canCreate ? '' : '您没有创建凭证记录的权限',
      canEdit: permissions.canEdit ? '' : '您没有编辑凭证记录的权限',
      canDelete: permissions.canDelete ? '' : '您没有删除凭证记录的权限',
      canExport: permissions.canExport ? '' : '您没有导出凭证记录的权限',
    }

    const roleNames = user?.roles?.join('、') || '未知角色'
    const generalTip = `当前角色：${roleNames}。如需更多权限，请联系管理员。`

    return {
      tips,
      generalTip,
      hasAnyPermission: Object.values(permissions).some(Boolean),
    }
  }, [permissions, user])
}

export default useVoucherPermission
