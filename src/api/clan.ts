import request from './request'
import type { Clan, ClanQueryParams, ClanPaginatedResponse, ApiResponse } from '../types'

// 获取宗族列表（支持分页和简化列表）
export const getClanList = (params: ClanQueryParams = {}) => {
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value))
    }
  })

  const queryString = queryParams.toString()
  return request.get<ApiResponse<ClanPaginatedResponse>>(
    `/clan${queryString ? `?${queryString}` : ''}`
  )
}

// 获取宗族详情
export const getClanById = (id: number) => {
  return request.get<ApiResponse<Clan>>(`/clan/${id}`)
}

// 创建宗族
export const createClan = (data: { clanName: string; memberList?: string[] }) => {
  return request.post<ApiResponse<Clan>>('/clan', data)
}

// 更新宗族
export const updateClan = (id: number, data: Partial<Clan>) => {
  const { createTime: _createTime, updateTime: _updateTime, ...cleanData } = data
  return request.patch<ApiResponse<Clan>>(`/clan/${id}`, cleanData)
}

// 删除宗族
export const deleteClan = (id: number) => {
  return request.delete<ApiResponse<void>>(`/clan/${id}`)
}

// 添加成员到宗族
export const addMemberToClan = (data: { id: number; memberName: string }) => {
  return request.post<ApiResponse<{ id: number; memberName: string }>>('/clan/members', data)
}

// 从宗族中删除成员
export const removeMemberFromClan = (clanId: number, memberName: string) => {
  return request.delete<ApiResponse<void>>(
    `/clan/${clanId}/members/${encodeURIComponent(memberName)}`
  )
}
