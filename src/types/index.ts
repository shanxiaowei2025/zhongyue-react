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
  taxNumber?: string
  enterpriseType?: string
  taxBureau?: string
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
  companyName: string
  unifiedSocialCreditCode: string
  consultantAccountant: string
  bookkeepingAccountant: string
  invoiceOfficer: string
  enterpriseType: string
  taxNumber: string
  registeredAddress: string
  location: string
  businessAddress: string
  taxBureau: string
  affiliatedEnterprises: string
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
    front?: ImageType
    back?: ImageType
  }
  otherIdImages: Record<string, ImageType>
  businessLicenseImages: {
    main?: ImageType
  }
  bankAccountLicenseImages: {
    basic?: ImageType
    general?: ImageType
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
  enterpriseInfoSheetNumber: string
  sealStorageNumber: string
  enterpriseStatus?: 'active' | 'inactive' | 'pending'
  businessStatus?: 'normal' | 'terminated' | 'suspended'
  createTime: string
  updateTime: string
  submitter: string
  remarks: string
}

export interface ImageType {
  fileName?: string
  url?: string
}

export interface PaidInCapitalItem {
  name: string;
  contributionDate: string; // 后端是Date类型，前端用string存储
  amount: number;
  images: Record<string, ImageType>;
}

export interface AdministrativeLicenseItem {
  licenseType: string;
  startDate: string; // 后端是Date类型，前端用string存储
  expiryDate: string; // 后端是Date类型，前端用string存储
  images: Record<string, ImageType>;
}

export interface ActualResponsibleItem {
  name: string;
  phone: string;
}

export type RoleType = 'super_admin' | 'admin' | 'register_specialist' | string
