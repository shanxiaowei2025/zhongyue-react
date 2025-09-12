// 用户相关类型
export interface User {
  id: number
  username: string
  password: string
  avatar: string | null
  phone: string | null
  idCardNumber?: string
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
  department?: {
    id: number
    name: string
  }
}

// 部门相关类型
export interface Department {
  id: number
  name: string
  type: number // 1: 部门, 2: 分公司
  parent_id: number | null
  description?: string
  createTime?: string
  updateTime?: string
  principal?: string
  phone?: string
  email?: string
  remark?: string
  status?: number
  sort?: number
  create_time?: string
  update_time?: string
  children?: Department[]
}

export interface DepartmentTreeNode extends Department {
  children?: DepartmentTreeNode[]
  remark?: string
}

export interface DepartmentQueryParams {
  keyword?: string
  status?: 0 | 1
  type?: 1 | 2 | 3
  parent_id?: number | null
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
  role?: {
    id: number
    name: string
    code: string
    status: number
    remark: string
    create_time: string
    update_time: string
  }
}

// 模块化权限相关类型
export interface PermissionModule {
  module_name: string // 模块名称
  permissions: PermissionItem[] // 该模块下的权限项
}

export interface PermissionItem {
  name: string // 权限名称
  code: string // 权限代码
  description: string // 权限描述
}

export interface RolePermissionMatrix {
  role: Role // 角色信息
  permissions: Record<string, boolean> // 该角色拥有的权限，key为权限代码
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
  permissions?: Permission[] // 角色拥有的权限列表
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
  companyName?: string
  unifiedSocialCreditCode?: string
  customerLevel?: string | string[]
  enterpriseType?: string | string[]
  taxBureau?: string | string[]
  enterpriseStatus?: string | string[]
  businessStatus?: string | string[]
  location?: string | string[]
  consultantAccountant?: string | string[]
  bookkeepingAccountant?: string | string[]
  industryCategory?: string | string[]
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

// 宗族相关类型
export interface Clan {
  id: number
  clanName: string
  memberList: string[]
  createTime: string
  updateTime: string
}

export interface ClanListItem {
  id: number
  clanName: string
}

// 宗族查询参数
export interface ClanQueryParams {
  page?: number
  pageSize?: number
  clanName?: string
  memberName?: string
  exactMatch?: boolean
  namesOnly?: boolean
}

// 宗族分页响应
export interface ClanPaginatedResponse {
  data: Clan[] | ClanListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// 客户相关类型
export interface Customer {
  id: number
  companyName: string
  unifiedSocialCreditCode: string
  customerLevel?: string
  consultantAccountant: string
  bookkeepingAccountant: string
  invoiceOfficer: string
  enterpriseType: string
  taxNumber: string
  registeredAddress: string
  location: string
  businessAddress: string
  taxBureau: string
  clanId?: number // 新增宗族ID字段
  clan?: Clan // 新增宗族详情字段（populate时包含）
  bossProfile: string
  enterpriseProfile: string
  industryCategory: string
  industrySubcategory: string
  hasTaxBenefits: boolean
  businessPublicationPassword: string
  licenseExpiryDate: string
  registeredCapital: number
  capitalContributionDeadline: string
  paidInCapital: PaidInCapitalItem[]
  legalPersonIdImages: {
    front?: ImageTypeWithRemarks
    back?: ImageTypeWithRemarks
  }
  otherIdImages: Record<string, ImageType>
  businessLicenseImages: {
    main?: ImageTypeWithRemarks
    copy?: ImageTypeWithRemarks
  }
  bankAccountLicenseImages: {
    basic?: ImageTypeWithRemarks
    general?: ImageTypeWithRemarks
  }
  supplementaryImages: Record<string, ImageType>
  administrativeLicense: AdministrativeLicenseItem[]
  actualResponsibles: ActualResponsibleItem[]
  actualResponsibleRemark: string
  publicBank: string
  bankAccountNumber: string
  publicBankOpeningDate: string
  onlineBankingArchiveNumber: string
  basicDepositAccountNumber?: string
  generalAccountBank?: string
  generalAccountNumber?: string
  generalAccountOpeningDate?: string
  taxReportLoginMethod: string
  legalRepresentativeName: string
  legalRepresentativePhone: string
  legalRepresentativePhone2?: string
  legalRepresentativeId: string
  legalRepresentativeTaxPassword: string
  taxOfficerName: string
  taxOfficerPhone: string
  taxOfficerId: string
  taxOfficerTaxPassword: string
  invoicingSoftware: string
  invoicingNotes: string
  invoiceOfficerName: string
  invoiceOfficerPhone: string
  invoiceOfficerId: string
  invoiceOfficerTaxPassword: string
  financialContactName: string
  financialContactPhone: string
  financialContactId: string
  financialContactTaxPassword: string
  taxCategories: string
  socialInsuranceTypes: string
  insuredPersonnel: string
  tripartiteAgreementAccount: string
  personalIncomeTaxPassword: string
  personalIncomeTaxStaff: string
  // 删除了 enterpriseInfoSheetNumber 字段
  // 删除了 sealStorageNumber 字段，移动到档案存放信息中
  // 新增档案存放信息字段
  sealStorageNumber?: string // 印章存放档案编号 (从税务信息移动过来)
  paperArchiveNumber?: string // 纸质资料档案编号
  onlineBankingStorageNumber?: string // 网银托管存放编号
  archiveStorageRemarks?: string // 档案存放备注
  enterpriseStatus?: 'normal' | 'abnormal' | 'cancelled' | 'revoked'
  businessStatus?: 'normal' | 'logged_out' | 'logging_out' | 'lost' | 'waiting_transfer'
  createTime: string
  updateTime: string
  submitter: string
  remarks: string
}

export interface ImageType {
  fileName?: string
  url?: string
}

export interface ImageTypeWithRemarks extends ImageType {
  remarks?: string // 图片备注
}

export interface PaidInCapitalItem {
  name: string
  contributionDate: string | null // 后端是Date类型或null，前端用string或null存储
  amount: number
  images: Record<string, ImageType>
}

export interface AdministrativeLicenseItem {
  licenseType: string
  startDate: string | null // 后端是Date类型或null，前端用string或null存储
  expiryDate: string | null // 后端是Date类型或null，前端用string或null存储
  images: Record<string, ImageType>
}

export interface ActualResponsibleItem {
  name: string
  phone: string
}

export type RoleType = 'super_admin' | 'admin' | 'register_specialist' | string
