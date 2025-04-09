// 用户相关类型
export interface User {
  id: number
  username: string
  password: string
  nickname: string
  email: string
  avatar: string
  phone: string
  sex: 0 | 1
  status: 0 | 1
  dept_id?: number
  remark: string
  roles: string[]
  user_groups: string[]
  user_permissions: string[]
  is_superuser: boolean
  is_staff: boolean
  is_active: boolean
  is_expense_auditor: boolean
  date_joined: string
  last_login?: string
  first_name: string
  last_name: string
  create_time: string
  update_time: string
}

// 权限相关类型
export interface Permission {
  id: number
  role_name: string
  page_name: string
  permission_name: string
  permission_value: boolean
  description: string
  role_id: number
}

// 角色相关类型
export interface Role {
  id: number
  name: string
  code: string
  status: 0 | 1
  remark: string
  create_time: string
  update_time: string
}

// API 响应类型
export interface ApiResponse<T> {
  code: number
  data: T
  message: string
  timestamp?: number
}

// 分页参数类型
export interface PaginationParams {
  page: number
  pageSize: number
  keyword?: string
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// 登录表单类型
export interface LoginForm {
  username: string
  password: string
  remember?: boolean
}

// 注册表单类型
export interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthGroup {
  id: number
  name: string
}

export interface AuthPermission {
  id: number
  name: string
  content_type_id: number
  codename: string
}

export interface AuthGroupPermission {
  id: number
  group_id: number
  permission_id: number
}

// 客户相关类型
export interface Customer {
  id: number
  company_name: string | null
  daily_contact: string | null
  daily_contact_phone: string | null
  sales_representative: string | null
  social_credit_code: string | null
  tax_bureau: string | null
  business_source: string | null
  tax_registration_type: string | null
  chief_accountant: string | null
  responsible_accountant: string | null
  enterprise_status: string | null
  affiliated_enterprises: string | null
  main_business: string | null
  boss_profile: string | null
  communication_notes: string | null
  business_scope: string | null
  business_address: string | null
  registered_capital: number | null
  establishment_date: string | null
  license_expiry_date: string | null
  capital_contribution_deadline: string | null
  enterprise_type: string | null
  shareholders: string | null
  supervisors: string | null
  annual_inspection_password: string | null
  paid_in_capital: number | null
  administrative_licenses: string | null
  capital_contribution_records: string | null
  basic_bank: string | null
  basic_bank_account: string | null
  basic_bank_number: string | null
  general_bank: string | null
  general_bank_account: string | null
  general_bank_number: string | null
  has_online_banking: string | null
  is_online_banking_custodian: string | null
  legal_representative_name: string | null
  legal_representative_phone: string | null
  legal_representative_id: string | null
  legal_representative_tax_password: string | null
  financial_contact_name: string | null
  financial_contact_phone: string | null
  financial_contact_id: string | null
  financial_contact_tax_password: string | null
  tax_officer_name: string | null
  tax_officer_phone: string | null
  tax_officer_id: string | null
  tax_officer_tax_password: string | null
  tripartite_agreement_account: string | null
  tax_categories: string | null
  personal_income_tax_staff: string | null
  personal_income_tax_password: string | null
  legal_person_id_images: string
  other_id_images: string
  business_license_images: string
  bank_account_license_images: string
  supplementary_images: string
  update_time: string | null
  create_time: string | null
  submitter: string | null
  business_status: string | null
  boss_name: string | null
}
