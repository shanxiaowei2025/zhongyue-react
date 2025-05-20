import { User } from '.';

// 费用状态枚举
export enum ExpenseStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2
}

// 费用实体接口
export interface Expense {
  id: number;
  companyName: string;
  companyType: string;
  companyLocation: string;
  licenseType: string;
  licenseFee: number;
  brandFee: number;
  recordSealFee: number;
  generalSealFee: number;
  agencyType: string;
  agencyFee: number;
  accountingSoftwareFee: number;
  accountingSoftwareStartDate: string;
  accountingSoftwareEndDate: string;
  addressFee: number;
  addressStartDate: string;
  addressEndDate: string;
  agencyStartDate: string;
  agencyEndDate: string;
  businessType: string;
  contractType: string;
  contractImage: string;
  invoiceSoftwareFee: number;
  invoiceSoftwareStartDate: string;
  invoiceSoftwareEndDate: string;
  insuranceTypes: string;
  insuredCount: number;
  socialInsuranceAgencyFee: number;
  socialInsuranceStartDate: string;
  socialInsuranceEndDate: string;
  statisticalReportFee: number;
  statisticalStartDate: string;
  statisticalEndDate: string;
  changeBusiness: string;
  changeFee: number;
  administrativeLicense: string;
  administrativeLicenseFee: number;
  otherBusiness: string;
  otherBusinessFee: number;
  proofOfCharge: string[];
  totalFee: number;
  salesperson: string;
  createdAt: string;
  updatedAt: string;
  chargeDate: string;
  chargeMethod: string;
  auditor?: string;
  auditDate?: string;
  status: ExpenseStatus;
  rejectReason?: string; // 退回原因
  receiptRemarks?: string;
  internalRemarks?: string;
}

// 费用创建DTO
export interface CreateExpenseDto {
  companyName?: string;
  companyType?: string;
  companyLocation?: string;
  licenseType?: string;
  licenseFee?: number;
  brandFee?: number;
  recordSealFee?: number;
  generalSealFee?: number;
  agencyType?: string;
  agencyFee?: number;
  accountingSoftwareFee?: number;
  accountingSoftwareStartDate?: string;
  accountingSoftwareEndDate?: string;
  addressFee?: number;
  addressStartDate?: string;
  addressEndDate?: string;
  agencyStartDate?: string;
  agencyEndDate?: string;
  businessType?: string;
  contractType?: string;
  contractImage?: string;
  invoiceSoftwareFee?: number;
  invoiceSoftwareStartDate?: string;
  invoiceSoftwareEndDate?: string;
  insuranceTypes?: string;
  insuredCount?: number;
  socialInsuranceAgencyFee?: number;
  socialInsuranceStartDate?: string;
  socialInsuranceEndDate?: string;
  statisticalReportFee?: number;
  statisticalStartDate?: string;
  statisticalEndDate?: string;
  changeBusiness?: string;
  changeFee?: number;
  administrativeLicense?: string;
  administrativeLicenseFee?: number;
  otherBusiness?: string;
  otherBusinessFee?: number;
  proofOfCharge?: string[];
  totalFee?: number;
  salesperson?: string;
  chargeDate?: string;
  chargeMethod?: string;
  receiptRemarks?: string;
  internalRemarks?: string;
}

// 费用更新DTO
export interface UpdateExpenseDto extends CreateExpenseDto {
  auditor?: string;
  auditDate?: string;
  status?: ExpenseStatus;
  rejectReason?: string; // 退回原因
}

// 费用列表查询参数
export interface ExpenseQueryParams {
  page: number;
  pageSize: number;
  companyName?: string;
  status?: ExpenseStatus;
  salesperson?: string;
  startDate?: string;
  endDate?: string;
  dateRange?: any; // 前端日期范围选择器值
}

// 费用审核DTO
export interface AuditExpenseDto {
  status: ExpenseStatus;
  reason?: string;
}

// 取消审核DTO
export interface CancelAuditDto {
  cancelReason: string;
}

// 收据视图DTO
export interface ReceiptViewDto {
  id?: number;
  companyName?: string;
  chargeDate?: string;
  totalFee?: number;
  chargeMethod?: string;
  remarks?: string;
  salesperson?: string;
  auditor?: string;
  auditDate?: string;
  companyType?: string;
  companyLocation?: string;
  status?: ExpenseStatus;
  licenseFee?: number;
  brandFee?: number;
  recordSealFee?: number;
  generalSealFee?: number;
  agencyFee?: number;
  accountingSoftwareFee?: number;
  addressFee?: number;
  invoiceSoftwareFee?: number;
  socialInsuranceAgencyFee?: number;
  statisticalReportFee?: number;
  changeFee?: number;
  administrativeLicenseFee?: number;
  otherBusinessFee?: number;
  receiptRemarks?: string;
} 