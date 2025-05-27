import request from './request'
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
export const signContract = (id: number, data: SignContractDto) => {
  return request.post<ApiResponse<Contract>>(`/contract/${id}/sign`, data)
}
