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
  socialCreditCode?: string
  salesRepresentative?: string
  taxBureau?: string
  taxRegistrationType?: string
  enterpriseStatus?: string
  businessStatus?: string
  startDate?: string
  endDate?: string
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
  companyName: string | null
  dailyContact: string | null
  dailyContactPhone: string | null
  salesRepresentative: string | null
  socialCreditCode: string | null
  taxBureau: string | null
  businessSource: string | null
  taxRegistrationType: string | null
  chiefAccountant: string | null
  responsibleAccountant: string | null
  enterpriseStatus: string | null
  affiliatedEnterprises: string | null
  mainBusiness: string | null
  bossProfile: string | null
  communicationNotes: string | null
  businessScope: string | null
  businessAddress: string | null
  registeredCapital: string | null
  establishmentDate: string | null
  licenseExpiryDate: string | null
  capitalContributionDeadline: string | null
  enterpriseType: string | null
  shareholders: string | null
  supervisors: string | null
  annualInspectionPassword: string | null
  paidInCapital: string | null
  administrativeLicenses: string | null
  capitalContributionRecords: string | null
  basicBank: string | null
  basicBankAccount: string | null
  basicBankNumber: string | null
  generalBank: string | null
  generalBankAccount: string | null
  generalBankNumber: string | null
  hasOnlineBanking: string | null
  isOnlineBankingCustodian: string | null
  legalRepresentativeName: string | null
  legalRepresentativePhone: string | null
  legalRepresentativeId: string | null
  legalRepresentativeTaxPassword: string | null
  financialContactName: string | null
  financialContactPhone: string | null
  financialContactId: string | null
  financialContactTaxPassword: string | null
  taxOfficerName: string | null
  taxOfficerPhone: string | null
  taxOfficerId: string | null
  taxOfficerTaxPassword: string | null
  tripartiteAgreementAccount: string | null
  taxCategories: string | null
  personalIncomeTaxStaff: string | null
  personalIncomeTaxPassword: string | null
  legalPersonIdImages: {
    front?: string
    back?: string
  }
  otherIdImages: Record<string, string>
  businessLicenseImages: {
    main?: string
  }
  bankAccountLicenseImages: {
    basic?: string
    general?: string
  }
  supplementaryImages: Record<string, string>
  createTime: string | null
  updateTime: string | null
  submitter: string | null
  businessStatus: string | null
  bossName: string | null
}
