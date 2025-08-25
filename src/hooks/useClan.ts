import useSWR, { mutate } from 'swr'
import { message } from 'antd'
import {
  getClanList,
  getClanById,
  createClan as apiCreateClan,
  updateClan as apiUpdateClan,
  deleteClan as apiDeleteClan,
  addMemberToClan as apiAddMemberToClan,
  removeMemberFromClan as apiRemoveMemberFromClan,
} from '../api/clan'
import type { Clan, ClanQueryParams } from '../types'

// SWR键生成器
export const getClanListKey = (params: ClanQueryParams) => {
  const searchStr = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  return `/clan${searchStr ? `?${searchStr}` : ''}`
}

export const getClanDetailKey = (id?: number | null) => (id ? `/clan/${id}` : null)

// Fetcher函数
export const clanListFetcher = async (url: string) => {
  const urlObj = new URL(url, window.location.origin)
  const params: ClanQueryParams = {}

  urlObj.searchParams.forEach((value, key) => {
    if (key === 'page' || key === 'pageSize') {
      params[key] = parseInt(value)
    } else if (key === 'exactMatch' || key === 'namesOnly') {
      params[key] = value === 'true'
    } else if (key === 'clanName' || key === 'memberName') {
      params[key] = value
    }
  })

  const response = await getClanList(params)
  if (response && response.code === 0) {
    // 注意：后端返回的是嵌套结构 response.data.data，其中包含完整的分页信息
    return response.data.data
  }
  throw new Error(response?.message || '获取宗族列表失败')
}

export const clanDetailFetcher = async (url: string) => {
  const id = url.split('/').pop()
  if (!id) throw new Error('缺少宗族ID')

  const response = await getClanById(parseInt(id))
  if (response && response.code === 0) {
    // 获取宗族详情，后端返回的是嵌套结构 response.data.data
    return (response.data as any).data
  }
  throw new Error(response?.message || '获取宗族详情失败')
}

// 宗族列表Hook
export const useClanList = (params: ClanQueryParams) => {
  const { data, error, isLoading, isValidating } = useSWR(getClanListKey(params), clanListFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3000,
  })

  const refreshClanList = async () => {
    await mutate(getClanListKey(params))
  }

  return {
    clanList: (data as any)?.data || [],
    pagination: {
      current: (data as any)?.page || 1,
      pageSize: (data as any)?.pageSize || 10,
      total: (data as any)?.total || 0,
      totalPages: (data as any)?.totalPages || 0,
    },
    loading: isLoading || isValidating,
    error,
    refreshClanList,
  }
}

// 宗族详情Hook
export const useClanDetail = (id?: number | null) => {
  const {
    data: clan,
    error,
    isLoading,
    isValidating,
    mutate: mutateClan,
  } = useSWR(getClanDetailKey(id), id ? clanDetailFetcher : null, {
    revalidateOnFocus: false,
  })

  const refreshClanDetail = async () => {
    if (id) {
      await mutateClan()
    }
  }

  // 创建宗族
  const createClan = async (data: { clanName: string; memberList?: string[] }) => {
    try {
      const response = await apiCreateClan(data)
      console.log('创建宗族API响应:', response) // 调试信息

      if (response && response.code === 0) {
        // 尝试多种可能的响应结构
        let clanData = null

        // 结构1: response.data.data (您提供的格式)
        if (response.data && typeof response.data === 'object' && (response.data as any).data) {
          clanData = (response.data as any).data
        }
        // 结构2: response.data (直接包含宗族数据)
        else if (response.data && typeof response.data === 'object' && (response.data as any).id) {
          clanData = response.data
        }

        console.log('提取的宗族数据:', clanData) // 调试信息

        if (clanData && clanData.id) {
          // 显示成功消息
          const successMsg = clanData.message || response.message || '创建宗族成功'
          message.success(successMsg)

          // 刷新宗族列表
          await mutate(
            (key: any) => typeof key === 'string' && key.startsWith('/clan'),
            undefined,
            {
              revalidate: true,
            }
          )

          // 返回宗族数据
          console.log('返回的宗族数据:', clanData) // 调试信息
          return clanData
        } else {
          console.error('无法提取有效的宗族数据，response:', response) // 调试信息
          throw new Error('宗族数据格式错误')
        }
      } else {
        console.error('外层响应码错误，response:', response) // 调试信息
        throw new Error(response?.message || '创建失败')
      }
    } catch (error: any) {
      // 显示错误消息
      const errorMsg =
        error.response?.data?.data?.message ||
        error.response?.data?.message ||
        error.message ||
        '创建宗族失败'
      message.error(errorMsg)
      throw error
    }
  }

  // 更新宗族
  const updateClan = async (clanId: number, data: Partial<Clan>) => {
    try {
      const response = await apiUpdateClan(clanId, data)
      if (response && response.code === 0) {
        const successMsg = (response.data as any)?.message || response.message || '更新宗族成功'
        message.success(successMsg)
        await refreshClanDetail()
        await mutate((key: any) => typeof key === 'string' && key.startsWith('/clan'), undefined, {
          revalidate: true,
        })
        return response.data
      } else {
        throw new Error(response?.message || '更新失败')
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.data?.message ||
        error.response?.data?.message ||
        error.message ||
        '更新宗族失败'
      message.error(errorMsg)
      throw error
    }
  }

  // 添加成员到宗族
  const addMemberToClan = async (clanId: number, memberName: string) => {
    try {
      const response = await apiAddMemberToClan({ id: clanId, memberName })
      if (response && response.code === 0) {
        const successMsg = (response.data as any)?.message || response.message || '添加成员成功'
        message.success(successMsg)
        await refreshClanDetail()
        await mutate((key: any) => typeof key === 'string' && key.startsWith('/clan'), undefined, {
          revalidate: true,
        })
        return response.data
      } else {
        throw new Error(response?.message || '添加成员失败')
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.data?.message ||
        error.response?.data?.message ||
        error.message ||
        '添加成员失败'
      message.error(errorMsg)
      throw error
    }
  }

  // 从宗族移除成员
  const removeMemberFromClan = async (clanId: number, memberName: string) => {
    try {
      const response = await apiRemoveMemberFromClan(clanId, memberName)
      if (response && response.code === 0) {
        const successMsg = (response.data as any)?.message || response.message || '移除成员成功'
        message.success(successMsg)
        await refreshClanDetail()
        await mutate((key: any) => typeof key === 'string' && key.startsWith('/clan'), undefined, {
          revalidate: true,
        })
        return true
      } else {
        throw new Error(response?.message || '移除成员失败')
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.data?.message ||
        error.response?.data?.message ||
        error.message ||
        '移除成员失败'
      message.error(errorMsg)
      return false
    }
  }

  // 删除宗族
  const deleteClan = async (clanId: number) => {
    try {
      const response = await apiDeleteClan(clanId)
      if (response && response.code === 0) {
        const successMsg = (response.data as any)?.message || response.message || '删除宗族成功'
        message.success(successMsg)
        await mutate((key: any) => typeof key === 'string' && key.startsWith('/clan'), undefined, {
          revalidate: true,
        })
        return true
      } else {
        throw new Error(response?.message || '删除失败')
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.data?.message ||
        error.response?.data?.message ||
        error.message ||
        '删除宗族失败'
      message.error(errorMsg)
      return false
    }
  }

  return {
    clan,
    loading: isLoading || isValidating,
    error,
    refreshClanDetail,
    createClan,
    updateClan,
    addMemberToClan,
    removeMemberFromClan,
    deleteClan,
  }
}
