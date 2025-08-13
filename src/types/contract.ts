// 合同状态枚举
export enum ContractStatus {
  Unsigned = '0', // 未签署
  Signed = '1', // 已签署
  Terminated = '2', // 已终止
}

// 服务项目接口
export interface ServiceItem {
  itemKey: string
  itemName: string
  amount: number
  startDate?: string // 开始日期 (YYYY-MM格式)
  endDate?: string // 结束日期 (YYYY-MM格式)
}

// 合同接口
export interface Contract {
  id: number
  contractNumber?: string
  signatory?: string
  contractType?: string
  partyACompany?: string
  partyACreditCode?: string
  partyALegalPerson?: string
  partyAPostalCode?: string
  partyAAddress?: string
  partyAContact?: string
  partyAPhone?: string
  partyBCompany?: string
  partyBCreditCode?: string
  partyBLegalPerson?: string
  partyBPostalCode?: string
  partyBAddress?: string
  partyBContact?: string
  partyBPhone?: string
  consultPhone?: string
  businessEstablishment?: ServiceItem[]
  businessEstablishmentAddress?: string
  businessChange?: ServiceItem[]
  businessCancellation?: ServiceItem[]
  businessOther?: ServiceItem[]
  businessMaterials?: ServiceItem[]
  businessRemark?: string
  businessServiceFee?: number
  taxMatters?: ServiceItem[]
  taxRemark?: string
  taxServiceFee?: number
  bankMatters?: ServiceItem[]
  bankRemark?: string
  bankServiceFee?: number
  socialSecurity?: ServiceItem[]
  socialSecurityRemark?: string
  socialSecurityServiceFee?: number
  licenseBusiness?: ServiceItem[]
  licenseRemark?: string
  licenseServiceFee?: number
  otherRemark?: string
  otherServiceFee?: number
  totalCost?: number
  partyAStampImage?: string
  partyASignDate?: string
  partyBSignDate?: string
  entrustmentStartDate?: string
  entrustmentEndDate?: string
  declarationService?: ServiceItem[]
  otherBusiness?: string
  totalAgencyAccountingFee?: number
  agencyAccountingFee?: number
  accountingSoftwareFee?: number
  invoicingSoftwareFee?: number
  accountBookFee?: number
  currentChargeFee?: number
  paymentMethod?: string
  contractStatus?: ContractStatus
  contractSignature?: string
  contractImage?: string
  encryptedCode?: string
  createTime: string
  updateTime: string
  submitter?: string
  remarks?: string
  location?: string
}

// 合同查询参数
export interface ContractQueryParams {
  page: number
  pageSize: number
  contractNumber?: string
  partyACompany?: string
  partyACreditCode?: string
  contractType?: string
  signatory?: string
  contractStatus?: ContractStatus
  partyASignDateStart?: string
  partyASignDateEnd?: string
  createTimeStart?: string
  createTimeEnd?: string
}

// 创建合同DTO
export interface CreateContractDto {
  signatory?: string
  contractType?: string
  partyACompany?: string
  partyACreditCode?: string
  partyALegalPerson?: string
  partyAPostalCode?: string
  partyAAddress?: string
  partyAContact?: string
  partyAPhone?: string
  partyBCompany?: string
  partyBCreditCode?: string
  partyBLegalPerson?: string
  partyBPostalCode?: string
  partyBAddress?: string
  partyBContact?: string
  partyBPhone?: string
  consultPhone?: string
  businessEstablishment?: ServiceItem[]
  businessEstablishmentAddress?: string
  businessChange?: ServiceItem[]
  businessCancellation?: ServiceItem[]
  businessOther?: ServiceItem[]
  businessMaterials?: ServiceItem[]
  businessRemark?: string
  businessServiceFee?: number
  taxMatters?: ServiceItem[]
  taxRemark?: string
  taxServiceFee?: number
  bankMatters?: ServiceItem[]
  bankRemark?: string
  bankServiceFee?: number
  socialSecurity?: ServiceItem[]
  socialSecurityRemark?: string
  socialSecurityServiceFee?: number
  licenseBusiness?: ServiceItem[]
  licenseRemark?: string
  licenseServiceFee?: number
  otherRemark?: string
  otherServiceFee?: number
  totalCost?: number
  partyAStampImage?: string
  partyASignDate?: string
  partyBSignDate?: string
  entrustmentStartDate?: string
  entrustmentEndDate?: string
  declarationService?: ServiceItem[]
  otherBusiness?: string
  totalAgencyAccountingFee?: number
  agencyAccountingFee?: number
  accountingSoftwareFee?: number
  invoicingSoftwareFee?: number
  accountBookFee?: number
  currentChargeFee?: number
  paymentMethod?: string
  contractStatus?: ContractStatus
  remarks?: string
  location?: string
}

// 更新合同DTO
export interface UpdateContractDto extends CreateContractDto {
  contractImage?: string
}

// 签署合同DTO
export interface SignContractDto {
  signature: string
}

// 合同列表响应
export interface ContractListResponse {
  list: Contract[]
  total: number
  currentPage: number
  pageSize: number
}
