import useSWR, { mutate } from 'swr'
import { message } from 'antd'
import type {
  Contract,
  ContractQueryParams,
  CreateContractDto,
  UpdateContractDto,
  SignContractDto,
  ContractListResponse,
} from '../types/contract'
import {
  getContractList,
  getContractById,
  createContract as createContractApi,
  updateContract as updateContractApi,
  deleteContract as deleteContractApi,
  signContract as signContractApi,
} from '../api/contract'

// 生成合同列表的缓存key
export const getContractListKey = (params: ContractQueryParams) => {
  return ['/contract', params]
}

// 生成合同详情的缓存key
export const getContractDetailKey = (id?: number | null) => (id ? `/contract/${id}` : null)

// 合同列表数据获取器
export const contractListFetcher = async ([url, params]: [string, ContractQueryParams]) => {
  try {
    const response = await getContractList(params)
    console.log('合同列表API响应:', response)

    if (response.code === 0 && response.data) {
      return response.data
    } else {
      throw new Error(response.message || '获取合同列表失败')
    }
  } catch (error) {
    console.error('获取合同列表失败:', error)
    if (error instanceof Error) {
      message.error(`获取合同列表失败: ${error.message}`)
    } else {
      message.error('获取合同列表失败')
    }
    throw error
  }
}

// 合同详情数据获取器
export const contractDetailFetcher = async (url: string) => {
  try {
    const id = parseInt(url.split('/').pop() || '0', 10)
    if (!id) {
      throw new Error('合同ID无效')
    }

    const response = await getContractById(id)
    console.log('合同详情API响应:', response)

    if (response.code === 0 && response.data) {
      return response.data
    } else {
      throw new Error(response.message || '获取合同详情失败')
    }
  } catch (error) {
    console.error('获取合同详情失败:', error)
    if (error instanceof Error) {
      message.error(`获取合同详情失败: ${error.message}`)
    } else {
      message.error('获取合同详情失败')
    }
    throw error
  }
}

// 合同列表Hook
export const useContractList = (params: ContractQueryParams) => {
  const key = getContractListKey(params)
  const { data, error, isLoading } = useSWR<ContractListResponse>(key, contractListFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
  })

  // 刷新合同列表
  const refreshContractList = async () => {
    await mutate(key)
  }

  // 删除合同
  const removeContract = async (id: number) => {
    try {
      const response = await deleteContractApi(id)
      if (response.code === 0) {
        message.success('删除合同成功')
        await refreshContractList()
        return true
      } else {
        throw new Error(response.message || '删除合同失败')
      }
    } catch (error) {
      console.error('删除合同失败:', error)
      if (error instanceof Error) {
        message.error(`删除合同失败: ${error.message}`)
      } else {
        message.error('删除合同失败')
      }
      return false
    }
  }

  // 签署合同
  const doSignContract = async (id: number, signData: SignContractDto) => {
    try {
      const response = await signContractApi(id, signData)
      if (response.code === 0) {
        message.success('合同签署成功')
        await refreshContractList()
        // 同时刷新合同详情缓存
        await mutate(getContractDetailKey(id))
        return response.data
      } else {
        throw new Error(response.message || '合同签署失败')
      }
    } catch (error) {
      console.error('合同签署失败:', error)
      if (error instanceof Error) {
        message.error(`合同签署失败: ${error.message}`)
      } else {
        message.error('合同签署失败')
      }
      throw error
    }
  }

  return {
    data: data?.list || [],
    total: data?.total || 0,
    currentPage: data?.currentPage || 1,
    pageSize: data?.pageSize || 10,
    isLoading,
    error,
    refreshContractList,
    removeContract,
    doSignContract,
  }
}

// 合同详情Hook
export const useContractDetail = (id?: number | null) => {
  const key = getContractDetailKey(id)
  const { data, error, isLoading } = useSWR<Contract>(key, contractDetailFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    errorRetryCount: 3,
  })

  // 刷新合同详情
  const refreshContractDetail = async () => {
    if (key) {
      await mutate(key)
    }
  }

  // 更新合同
  const updateContractData = async (contractId: number, updateData: UpdateContractDto) => {
    try {
      const response = await updateContractApi(contractId, updateData)
      if (response.code === 0) {
        message.success('更新合同成功')
        await refreshContractDetail()
        // 同时刷新合同列表缓存
        await mutate(key => Array.isArray(key) && key[0] === '/contract', undefined, {
          revalidate: true,
        })
        return response.data
      } else {
        throw new Error(response.message || '更新合同失败')
      }
    } catch (error) {
      console.error('更新合同失败:', error)
      if (error instanceof Error) {
        message.error(`更新合同失败: ${error.message}`)
      } else {
        message.error('更新合同失败')
      }
      throw error
    }
  }

  // 创建合同
  const createContractData = async (createData: CreateContractDto) => {
    try {
      const response = await createContractApi(createData)
      if (response.code === 0) {
        message.success('创建合同成功')
        // 刷新所有合同列表缓存
        await mutate(key => Array.isArray(key) && key[0] === '/contract', undefined, {
          revalidate: true,
        })
        return response.data
      } else {
        throw new Error(response.message || '创建合同失败')
      }
    } catch (error) {
      console.error('创建合同失败:', error)
      if (error instanceof Error) {
        message.error(`创建合同失败: ${error.message}`)
      } else {
        message.error('创建合同失败')
      }
      throw error
    }
  }

  return {
    data,
    isLoading,
    error,
    refreshContractDetail,
    updateContractData,
    createContractData,
  }
}
