import request from './request'
import {
  BusinessOption,
  CreateBusinessOptionDto,
  UpdateBusinessOptionDto,
  BusinessOptionQueryParams,
} from '../types/businessOption'

// 获取业务选项列表
export const getBusinessOptions = (params?: BusinessOptionQueryParams) => {
  return request.get<{
    data: {
      list: BusinessOption[]
      total: number
    }
    code: number
    message: string
  }>('/business-options', params)
}

// 根据类别获取业务选项
export const getBusinessOptionsByCategory = (category: string) => {
  return request.get<{
    data: BusinessOption[]
    code: number
    message: string
  }>(`/business-options/category/${category}`)
}

// 创建业务选项
export const createBusinessOption = (data: CreateBusinessOptionDto) => {
  return request.post<{
    data: BusinessOption
    code: number
    message: string
  }>('/business-options', data)
}

// 更新业务选项
export const updateBusinessOption = (id: number, data: UpdateBusinessOptionDto) => {
  return request.patch<{
    data: BusinessOption
    code: number
    message: string
  }>(`/business-options/${id}`, data)
}

// 删除业务选项
export const deleteBusinessOption = (id: number) => {
  return request.delete<{
    code: number
    message: string
  }>(`/business-options/${id}`)
}
