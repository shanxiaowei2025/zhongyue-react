import useSWR, { mutate } from 'swr'
import { message } from 'antd'
import {
  getMySubmittedInspections,
  getMyResponsibleInspections,
  getMyReviewedInspections,
  getMySubmittedInspectionDetail,
  getMyResponsibleInspectionDetail,
  getMyReviewedInspectionDetail,
  createFinancialSelfInspection,
  updateRectificationCompletion,
  approvalInspection,
  rejectInspection,
  reviewerApprovalInspection,
  reviewerRejectInspection,
  deleteFinancialSelfInspection,
  addCommunicationRecord,
} from '../api/financialSelfInspection'
import type {
  FinancialSelfInspectionQueryParams,
  CreateFinancialSelfInspectionDto,
  RectificationCompletionDto,
  ApprovalDto,
  RejectDto,
  ReviewerApprovalDto,
  ReviewerRejectDto,
} from '../types/financialSelfInspection'

// SWR键生成函数
const getSubmittedInspectionsKey = (params: FinancialSelfInspectionQueryParams) =>
  `/financial-self-inspection/my-submitted?${new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString()}`

const getResponsibleInspectionsKey = (params: FinancialSelfInspectionQueryParams) =>
  `/financial-self-inspection/my-responsible?${new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString()}`

const getReviewedInspectionsKey = (params: FinancialSelfInspectionQueryParams) =>
  `/financial-self-inspection/my-reviewed?${new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)])
  ).toString()}`

const getSubmittedDetailKey = (id: number) => `/financial-self-inspection/my-submitted/${id}`
const getResponsibleDetailKey = (id: number) => `/financial-self-inspection/my-responsible/${id}`
const getReviewedDetailKey = (id: number) => `/financial-self-inspection/my-reviewed/${id}`

// Fetcher函数
const submittedInspectionsFetcher = async (url: string) => {
  const params = new URLSearchParams(url.split('?')[1])
  const queryParams: FinancialSelfInspectionQueryParams = {}

  for (const [key, value] of params.entries()) {
    if (key === 'page' || key === 'pageSize') {
      queryParams[key] = parseInt(value)
    } else {
      queryParams[key] = value
    }
  }

  const response = await getMySubmittedInspections(queryParams)
  if (response && response.code === 0) {
    return response.data
  }
  throw new Error(response?.message || '获取我提交的自查记录失败')
}

const responsibleInspectionsFetcher = async (url: string) => {
  const params = new URLSearchParams(url.split('?')[1])
  const queryParams: FinancialSelfInspectionQueryParams = {}

  for (const [key, value] of params.entries()) {
    if (key === 'page' || key === 'pageSize') {
      queryParams[key] = parseInt(value)
    } else {
      queryParams[key] = value
    }
  }

  const response = await getMyResponsibleInspections(queryParams)
  if (response && response.code === 0) {
    return response.data
  }
  throw new Error(response?.message || '获取我负责的自查记录失败')
}

const reviewedInspectionsFetcher = async (url: string) => {
  const params = new URLSearchParams(url.split('?')[1])
  const queryParams: FinancialSelfInspectionQueryParams = {}

  for (const [key, value] of params.entries()) {
    if (key === 'page' || key === 'pageSize') {
      queryParams[key] = parseInt(value)
    } else {
      queryParams[key] = value
    }
  }

  const response = await getMyReviewedInspections(queryParams)
  if (response && response.code === 0) {
    return response.data
  }
  throw new Error(response?.message || '获取我复查的自查记录失败')
}

const submittedDetailFetcher = async (url: string) => {
  const id = parseInt(url.split('/').pop() || '0')
  const response = await getMySubmittedInspectionDetail(id)
  if (response && response.code === 0) {
    return response.data
  }
  throw new Error(response?.message || '获取提交记录详情失败')
}

const responsibleDetailFetcher = async (url: string) => {
  const id = parseInt(url.split('/').pop() || '0')
  const response = await getMyResponsibleInspectionDetail(id)
  if (response && response.code === 0) {
    return response.data
  }
  throw new Error(response?.message || '获取负责记录详情失败')
}

const reviewedDetailFetcher = async (url: string) => {
  const id = parseInt(url.split('/').pop() || '0')
  const response = await getMyReviewedInspectionDetail(id)
  if (response && response.code === 0) {
    return response.data
  }
  throw new Error(response?.message || '获取复查记录详情失败')
}

/**
 * 使用我提交的自查记录列表
 */
export const useSubmittedInspections = (params: FinancialSelfInspectionQueryParams) => {
  const key = getSubmittedInspectionsKey(params)
  const { data, error, isLoading } = useSWR(key, submittedInspectionsFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  const refreshSubmittedInspections = async () => {
    await mutate(key)
  }

  return {
    data: data?.items || [],
    total: data?.total || 0,
    loading: isLoading,
    error,
    refreshSubmittedInspections,
  }
}

/**
 * 使用我负责的自查记录列表
 */
export const useResponsibleInspections = (params: FinancialSelfInspectionQueryParams) => {
  const key = getResponsibleInspectionsKey(params)
  const { data, error, isLoading } = useSWR(key, responsibleInspectionsFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  const refreshResponsibleInspections = async () => {
    await mutate(key)
  }

  return {
    data: data?.items || [],
    total: data?.total || 0,
    loading: isLoading,
    error,
    refreshResponsibleInspections,
  }
}

/**
 * 使用我复查的自查记录列表
 */
export const useReviewedInspections = (params: FinancialSelfInspectionQueryParams) => {
  const key = getReviewedInspectionsKey(params)
  const { data, error, isLoading } = useSWR(key, reviewedInspectionsFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  const refreshReviewedInspections = async () => {
    await mutate(key)
  }

  return {
    data: data?.items || [],
    total: data?.total || 0,
    loading: isLoading,
    error,
    refreshReviewedInspections,
  }
}

/**
 * 使用我提交的自查记录详情
 */
export const useSubmittedInspectionDetail = (id?: number | null) => {
  const key = id ? getSubmittedDetailKey(id) : null
  const { data, error, isLoading } = useSWR(key, submittedDetailFetcher, {
    revalidateOnFocus: false,
  })

  return {
    data,
    loading: isLoading,
    error,
  }
}

/**
 * 使用我负责的自查记录详情
 */
export const useResponsibleInspectionDetail = (id?: number | null) => {
  const key = id ? getResponsibleDetailKey(id) : null
  const { data, error, isLoading } = useSWR(key, responsibleDetailFetcher, {
    revalidateOnFocus: false,
  })

  return {
    data,
    loading: isLoading,
    error,
  }
}

/**
 * 使用我复查的自查记录详情
 */
export const useReviewedInspectionDetail = (id?: number | null) => {
  const key = id ? getReviewedDetailKey(id) : null
  const { data, error, isLoading } = useSWR(key, reviewedDetailFetcher, {
    revalidateOnFocus: false,
  })

  return {
    data,
    loading: isLoading,
    error,
  }
}

/**
 * 财务自查操作方法
 */
export const useFinancialSelfInspectionOperations = () => {
  // 创建自查记录
  const createInspection = async (data: CreateFinancialSelfInspectionDto) => {
    try {
      const response = await createFinancialSelfInspection(data)
      if (response.code === 0) {
        message.success('创建成功')
        // 清除相关缓存
        await mutate(
          key => typeof key === 'string' && key.includes('/financial-self-inspection'),
          undefined,
          {
            revalidate: true,
          }
        )
        return response.data
      } else {
        message.error(response.message || '创建失败')
        throw new Error(response.message || '创建失败')
      }
    } catch (error: any) {
      console.error('创建自查记录失败:', error)
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          message.error(error.response.data.message.join(', '))
        } else {
          message.error(error.response.data.message)
        }
      } else if (!error.message.includes('创建失败')) {
        message.error('创建失败，请重试')
      }
      throw error
    }
  }

  // 添加沟通记录
  const updateCommunicationRecord = async (id: number, result: string) => {
    try {
      const response = await addCommunicationRecord(id, { result })
      if (response.code === 0) {
        message.success('沟通记录添加成功')
        // 清除相关缓存
        await mutate(
          key => typeof key === 'string' && key.includes('/financial-self-inspection'),
          undefined,
          {
            revalidate: true,
          }
        )
        return response.data
      } else {
        message.error(response.message || '沟通记录添加失败')
        throw new Error(response.message || '沟通记录添加失败')
      }
    } catch (error: any) {
      console.error('沟通记录添加失败:', error)
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          message.error(error.response.data.message.join(', '))
        } else {
          message.error(error.response.data.message)
        }
      } else if (!error.message.includes('沟通记录添加失败')) {
        message.error('沟通记录添加失败，请重试')
      }
      throw error
    }
  }

  // 更新整改记录
  const updateRectification = async (id: number, data: RectificationCompletionDto) => {
    try {
      const response = await updateRectificationCompletion(id, data)
      if (response.code === 0) {
        message.success('整改提交成功')
        // 清除相关缓存
        await mutate(
          key => typeof key === 'string' && key.includes('/financial-self-inspection'),
          undefined,
          {
            revalidate: true,
          }
        )
        return response.data
      } else {
        message.error(response.message || '整改提交失败')
        throw new Error(response.message || '整改提交失败')
      }
    } catch (error: any) {
      console.error('整改提交失败:', error)
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          message.error(error.response.data.message.join(', '))
        } else {
          message.error(error.response.data.message)
        }
      } else if (!error.message.includes('整改提交失败')) {
        message.error('整改提交失败，请重试')
      }
      throw error
    }
  }

  // 审核通过
  const approveInspection = async (id: number, data: ApprovalDto) => {
    try {
      const response = await approvalInspection(id, data)
      if (response.code === 0) {
        message.success('审核通过成功')
        // 清除相关缓存
        await mutate(
          key => typeof key === 'string' && key.includes('/financial-self-inspection'),
          undefined,
          {
            revalidate: true,
          }
        )
        return response.data
      } else {
        message.error(response.message || '审核通过失败')
        throw new Error(response.message || '审核通过失败')
      }
    } catch (error: any) {
      console.error('审核通过失败:', error)
      if (!error.message.includes('审核通过失败')) {
        message.error('审核通过失败，请重试')
      }
      throw error
    }
  }

  // 审核退回
  const rejectInspectionData = async (id: number, data: RejectDto) => {
    try {
      const response = await rejectInspection(id, data)
      if (response.code === 0) {
        message.success('审核退回成功')
        // 清除相关缓存
        await mutate(
          key => typeof key === 'string' && key.includes('/financial-self-inspection'),
          undefined,
          {
            revalidate: true,
          }
        )
        return response.data
      } else {
        message.error(response.message || '审核退回失败')
        throw new Error(response.message || '审核退回失败')
      }
    } catch (error: any) {
      console.error('审核退回失败:', error)
      if (!error.message.includes('审核退回失败')) {
        message.error('审核退回失败，请重试')
      }
      throw error
    }
  }

  // 复查审核通过
  const reviewerApproveInspection = async (id: number, data: ReviewerApprovalDto) => {
    try {
      const response = await reviewerApprovalInspection(id, data)
      if (response.code === 0) {
        message.success('复查审核通过成功')
        // 清除相关缓存
        await mutate(
          key => typeof key === 'string' && key.includes('/financial-self-inspection'),
          undefined,
          {
            revalidate: true,
          }
        )
        return response.data
      } else {
        message.error(response.message || '复查审核通过失败')
        throw new Error(response.message || '复查审核通过失败')
      }
    } catch (error: any) {
      console.error('复查审核通过失败:', error)
      if (!error.message.includes('复查审核通过失败')) {
        message.error('复查审核通过失败，请重试')
      }
      throw error
    }
  }

  // 复查审核退回
  const reviewerRejectInspectionData = async (id: number, data: ReviewerRejectDto) => {
    try {
      const response = await reviewerRejectInspection(id, data)
      if (response.code === 0) {
        message.success('复查审核退回成功')
        // 清除相关缓存
        await mutate(
          key => typeof key === 'string' && key.includes('/financial-self-inspection'),
          undefined,
          {
            revalidate: true,
          }
        )
        return response.data
      } else {
        message.error(response.message || '复查审核退回失败')
        throw new Error(response.message || '复查审核退回失败')
      }
    } catch (error: any) {
      console.error('复查审核退回失败:', error)
      if (!error.message.includes('复查审核退回失败')) {
        message.error('复查审核退回失败，请重试')
      }
      throw error
    }
  }

  // 删除自查记录
  const deleteInspection = async (id: number) => {
    try {
      const response = await deleteFinancialSelfInspection(id)
      if (response.code === 0) {
        message.success('删除成功')
        // 清除相关缓存
        await mutate(
          key => typeof key === 'string' && key.includes('/financial-self-inspection'),
          undefined,
          {
            revalidate: true,
          }
        )
        return true
      } else {
        message.error(response.message || '删除失败')
        return false
      }
    } catch (error: any) {
      console.error('删除失败:', error)
      message.error('删除失败，请重试')
      return false
    }
  }

  return {
    createInspection,
    updateRectification,
    approveInspection,
    rejectInspectionData,
    reviewerApproveInspection,
    reviewerRejectInspectionData,
    deleteInspection,
    updateCommunicationRecord,
  }
}
