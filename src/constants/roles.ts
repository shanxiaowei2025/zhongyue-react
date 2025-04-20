import { useEffect, useState } from 'react'
import request from '../api/request'

// 定义角色类型接口
export interface Role {
  id: number
  name: string
  code: string
  status: number
  remark: string
  create_time: string
  update_time: string
  permissions: any[]
}

// 静态角色映射表（仅作为后备方案）
export const ROLE_MAP: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
  user: '普通用户',
  bookkeepingAccountant: '记账会计',
  consultantAccountant: '咨询会计',
  invoiceOfficerName: '开票专员',
  branch_manager: '分支经理',
  expense_auditor: '费用审核员',
  admin_specialist: '行政专员',
  register_specialist: '注册专员',
  sales_specialist: '销售专员',
  // 可以根据需要添加更多角色映射
}

// 角色缓存对象
let roleCache: Record<string, string> = { ...ROLE_MAP }
let isRoleCacheInitialized = false

// 从API加载角色映射
export const loadRolesFromAPI = async (): Promise<Record<string, string>> => {
  try {
    const response = await request.get<{
      data: Role[]
      code: number
      message: string
    }>('/roles')

    if (response && response.code === 0 && response.data) {
      const roles = response.data
      const newRoleMap: Record<string, string> = {}

      // 将API返回的角色数据转换为映射表
      roles.forEach(role => {
        newRoleMap[role.code] = role.name
      })

      // 更新缓存
      roleCache = { ...ROLE_MAP, ...newRoleMap }
      isRoleCacheInitialized = true

      return roleCache
    }
    return ROLE_MAP
  } catch (error) {
    console.error('获取角色列表失败', error)
    return ROLE_MAP
  }
}

// 初始化角色缓存
export const initRoleCache = (): void => {
  // 检查是否已登录，避免在未登录状态下发起请求
  const token = localStorage.getItem('token')
  if (!isRoleCacheInitialized && token) {
    loadRolesFromAPI().catch(console.error)
  }
}

// 获取角色中文名称
export const getRoleName = (role: string): string => {
  // 先尝试从缓存获取
  if (roleCache[role]) {
    return roleCache[role]
  }

  // 如果缓存中没有且未初始化过，则初始化缓存
  if (!isRoleCacheInitialized) {
    initRoleCache()
  }

  // 返回角色编码本身作为后备方案
  return roleCache[role] || role
}

// 创建React Hook来使用动态角色映射
export const useRoleNames = () => {
  const [roleMap, setRoleMap] = useState<Record<string, string>>(roleCache)
  const [loading, setLoading] = useState(!isRoleCacheInitialized)

  useEffect(() => {
    if (!isRoleCacheInitialized) {
      setLoading(true)
      loadRolesFromAPI()
        .then(newRoleMap => {
          setRoleMap(newRoleMap)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [])

  // 获取角色名称函数
  const getRoleNameFromMap = (role: string): string => {
    return roleMap[role] || role
  }

  return { roleMap, getRoleNameFromMap, loading }
}

// 在应用启动时初始化角色缓存，但仅当满足条件时
const token = localStorage.getItem('token')
if (token) {
  initRoleCache()
}
