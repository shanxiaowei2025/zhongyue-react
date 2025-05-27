// 合同状态枚举
export enum ContractStatus {
  Unsigned = '0', // 未签署
  Signed = '1', // 已签署
  Terminated = '2', // 已终止
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
  businessEstablishment?: Array<Record<string, any>>
  businessEstablishmentAddress?: string
  businessChange?: Array<Record<string, any>>
  businessCancellation?: Array<Record<string, any>>
  businessOther?: Array<Record<string, any>>
  businessMaterials?: Array<Record<string, any>>
  businessRemark?: string
  businessServiceFee?: number
  taxMatters?: Array<Record<string, any>>
  taxRemark?: string
  taxServiceFee?: number
  bankMatters?: Array<Record<string, any>>
  bankRemark?: string
  bankServiceFee?: number
  socialSecurity?: Array<Record<string, any>>
  socialSecurityRemark?: string
  socialSecurityServiceFee?: number
  licenseBusiness?: Array<Record<string, any>>
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
  declarationService?: Array<Record<string, any>>
  otherBusiness?: string
  totalAgencyAccountingFee?: number
  agencyAccountingFee?: number
  accountingSoftwareFee?: number
  invoicingSoftwareFee?: number
  accountBookFee?: number
  paymentMethod?: string
  contractStatus?: ContractStatus
  contractSignature?: string
  createTime: string
  updateTime: string
  submitter?: string
  remarks?: string
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
  businessEstablishment?: Array<Record<string, any>>
  businessEstablishmentAddress?: string
  businessChange?: Array<Record<string, any>>
  businessCancellation?: Array<Record<string, any>>
  businessOther?: Array<Record<string, any>>
  businessMaterials?: Array<Record<string, any>>
  businessRemark?: string
  businessServiceFee?: number
  taxMatters?: Array<Record<string, any>>
  taxRemark?: string
  taxServiceFee?: number
  bankMatters?: Array<Record<string, any>>
  bankRemark?: string
  bankServiceFee?: number
  socialSecurity?: Array<Record<string, any>>
  socialSecurityRemark?: string
  socialSecurityServiceFee?: number
  licenseBusiness?: Array<Record<string, any>>
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
  declarationService?: Array<Record<string, any>>
  otherBusiness?: string
  totalAgencyAccountingFee?: number
  agencyAccountingFee?: number
  accountingSoftwareFee?: number
  invoicingSoftwareFee?: number
  accountBookFee?: number
  paymentMethod?: string
  contractStatus?: ContractStatus
  remarks?: string
}

// 更新合同DTO
export interface UpdateContractDto extends CreateContractDto {}

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
