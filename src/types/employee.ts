export interface Employee {
  id: number
  name: string
  departmentId?: number
  employeeType?: string
  commissionRatePosition?: string
  position?: string
  rank?: string
  isResigned: boolean
  baseSalary?: number
  resume?: ResumeFile[]
  birthday?: string
  actualBirthday?: string
  idCardNumber?: string
  bankCardNumber?: string
  bankName?: string
  hireDate?: string
  workYears?: number
  createdAt: string
  updatedAt: string
}

export interface ResumeFile {
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  uploadTime: string
}

export interface CreateEmployeeDto {
  name: string
  departmentId?: number
  employeeType?: string
  commissionRatePosition?: string
  position?: string
  rank?: string
  isResigned?: boolean
  baseSalary?: number
  resume?: ResumeFile[]
  birthday?: string
  actualBirthday?: string
  idCardNumber?: string
  bankCardNumber?: string
  bankName?: string
  hireDate?: string
  workYears?: number
}

export interface UpdateEmployeeDto {
  name?: string
  departmentId?: number
  employeeType?: string
  commissionRatePosition?: string
  position?: string
  rank?: string
  isResigned?: boolean
  baseSalary?: number
  resume?: ResumeFile[]
  birthday?: string
  actualBirthday?: string
  bankCardNumber?: string
  bankName?: string
  hireDate?: string
  workYears?: number
}

export interface QueryEmployeeDto {
  page?: number
  pageSize?: number
  name?: string
  departmentId?: number
  employeeType?: string
  commissionRatePosition?: string
  position?: string
  rank?: string
  isResigned?: boolean
  actualBirthday?: string
  idCardNumber?: string
}

export interface EmployeeListResponse {
  items: Employee[]
  total: number
  page: number
  pageSize: number
}

export interface EmployeeDeleteResponse {
  id: number
  deleted: boolean
}
