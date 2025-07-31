import request from './request'

// 提成类型定义
export interface AgencyCommission {
  id?: number
  agencyCount: string
  minCommissionBase: number
  feeRange: string
  commissionRate: number
  createdAt?: string
  updatedAt?: string
}

export interface BusinessSalesCommission {
  id?: number
  type: string
  baseSalary: number
  feeRange: string
  commissionRate: number
  createdAt?: string
  updatedAt?: string
}

export interface BusinessConsultantCommission {
  id?: number
  feeRange: string
  commissionRate: number
  createdAt?: string
  updatedAt?: string
}

export interface BusinessOtherCommission {
  id?: number
  feeRange: string
  commissionRate: number
  createdAt?: string
  updatedAt?: string
}

export interface PerformanceCommission {
  id?: number
  pLevel?: string
  gradeLevel?: string
  householdCount?: string
  baseSalary?: number
  performance?: number
  createdAt?: string
  updatedAt?: string
}

// 提成比率查询参数
export interface CommissionRateQuery {
  amount: number
  type: 'agency' | 'sales' | 'consultant' | 'other'
  agencyCount?: number
  salesType?: string
}

// 提成比率查询结果
export interface CommissionRateResult {
  found: boolean
  commissionRate?: number
  record?: any
  calculatedAmount?: number
}

// API请求函数
export const commissionApi = {
  // 代理费提成
  agency: {
    create: (data: Omit<AgencyCommission, 'id' | 'createdAt' | 'updatedAt'>) =>
      request.post<AgencyCommission>('/commission/agency', data),

    list: () => request.get<AgencyCommission[]>('/commission/agency'),

    getById: (id: number) => request.get<AgencyCommission>(`/commission/agency/${id}`),

    update: (id: number, data: Partial<AgencyCommission>) =>
      request.patch<AgencyCommission>(`/commission/agency/${id}`, data),

    delete: (id: number) => request.delete(`/commission/agency/${id}`),
  },

  // 业务销售提成
  sales: {
    create: (data: Omit<BusinessSalesCommission, 'id' | 'createdAt' | 'updatedAt'>) =>
      request.post<BusinessSalesCommission>('/commission/sales', data),

    list: () => request.get<BusinessSalesCommission[]>('/commission/sales'),

    getById: (id: number) => request.get<BusinessSalesCommission>(`/commission/sales/${id}`),

    update: (id: number, data: Partial<BusinessSalesCommission>) =>
      request.patch<BusinessSalesCommission>(`/commission/sales/${id}`, data),

    delete: (id: number) => request.delete(`/commission/sales/${id}`),
  },

  // 业务顾问提成
  consultant: {
    create: (data: Omit<BusinessConsultantCommission, 'id' | 'createdAt' | 'updatedAt'>) =>
      request.post<BusinessConsultantCommission>('/commission/consultant', data),

    list: () => request.get<BusinessConsultantCommission[]>('/commission/consultant'),

    getById: (id: number) =>
      request.get<BusinessConsultantCommission>(`/commission/consultant/${id}`),

    update: (id: number, data: Partial<BusinessConsultantCommission>) =>
      request.patch<BusinessConsultantCommission>(`/commission/consultant/${id}`, data),

    delete: (id: number) => request.delete(`/commission/consultant/${id}`),
  },

  // 业务其他提成
  other: {
    create: (data: Omit<BusinessOtherCommission, 'id' | 'createdAt' | 'updatedAt'>) =>
      request.post<BusinessOtherCommission>('/commission/other', data),

    list: () => request.get<BusinessOtherCommission[]>('/commission/other'),

    getById: (id: number) => request.get<BusinessOtherCommission>(`/commission/other/${id}`),

    update: (id: number, data: Partial<BusinessOtherCommission>) =>
      request.patch<BusinessOtherCommission>(`/commission/other/${id}`, data),

    delete: (id: number) => request.delete(`/commission/other/${id}`),
  },

  // 绩效提成
  performance: {
    create: (data: Omit<PerformanceCommission, 'id' | 'createdAt' | 'updatedAt'>) =>
      request.post<PerformanceCommission>('/commission/performance', data),

    list: () => request.get<PerformanceCommission[]>('/commission/performance'),

    getById: (id: number) => request.get<PerformanceCommission>(`/commission/performance/${id}`),

    update: (id: number, data: Partial<PerformanceCommission>) =>
      request.patch<PerformanceCommission>(`/commission/performance/${id}`, data),

    delete: (id: number) => request.delete(`/commission/performance/${id}`),
  },

  // 智能提成比率查询
  getCommissionRate: (params: CommissionRateQuery) =>
    request.get<CommissionRateResult>('/commission/rate/amount', { params }),
}

export default commissionApi
