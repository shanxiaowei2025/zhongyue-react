import request from './request'
import { publicRequest } from './request'
import type {
  Contract,
  ContractQueryParams,
  CreateContractDto,
  UpdateContractDto,
  SignContractDto,
  ContractListResponse,
} from '../types/contract'
import type { ApiResponse } from '../types'

// 获取合同列表
export const getContractList = (params: ContractQueryParams) => {
  return request.get<ApiResponse<ContractListResponse>>('/contract', params)
}

// 获取合同详情
export const getContractById = (id: number) => {
  return request.get<ApiResponse<Contract>>(`/contract/${id}`)
}

// 创建合同
export const createContract = (data: CreateContractDto) => {
  return request.post<ApiResponse<Contract>>('/contract', data)
}

// 更新合同
export const updateContract = (id: number, data: UpdateContractDto) => {
  return request.patch<ApiResponse<Contract>>(`/contract/${id}`, data)
}

// 删除合同
export const deleteContract = (id: number) => {
  return request.delete<ApiResponse<void>>(`/contract/${id}`)
}

// 签署合同
export const signContract = (id: number, data: { signature: string }) => {
  return request.post(`/contract/${id}/sign`, data)
}

// 生成合同临时token
export const generateContractToken = (contractId: number) => {
  return request.get(`/contract-token?id=${contractId}`)
}

// 验证token有效性
export const validateContractToken = (token: string) => {
  return publicRequest.get(`/contract-token/validate/${token}`)
}

// 获取合同图片（通过token）
export const getContractImageByToken = (token: string) => {
  return publicRequest.get(`/contract-token/image?token=${token}`)
}

// 保存合同签名（通过token）
export const saveContractSignature = (data: {
  contractId: number
  token: string
  signatureFileName: string
}) => {
  return publicRequest.post('/contract-token/signature', data)
}
