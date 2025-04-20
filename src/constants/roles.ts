export const ROLE_MAP: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
  user: '普通用户',
  bookkeepingAccountant: '记账会计',
  consultantAccountant: '咨询会计',
  invoiceOfficerName: '开票专员',
  branch_manager: '分支经理',
  // 可以根据需要添加更多角色映射
}

export const getRoleName = (role: string): string => {
  return ROLE_MAP[role] || role
}
