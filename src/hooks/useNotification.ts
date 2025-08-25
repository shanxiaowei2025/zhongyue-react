import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { message } from 'antd'
import {
  getNotificationList,
  getNewNotifications,
  createNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationRecord,
} from '../api/notification'
import type { NotificationQueryParams, CreateNotificationDto } from '../types/notification'

// SWR Key生成函数
export const getNotificationListKey = (params: NotificationQueryParams) => {
  return ['/notifications', params]
}

export const getNewNotificationsKey = (params: Omit<NotificationQueryParams, 'onlyNew'>) => {
  return ['/notifications/new', params]
}

// SWR Fetcher函数
const notificationListFetcher = ([, params]: [string, NotificationQueryParams]) => {
  return getNotificationList(params)
}

const newNotificationsFetcher = ([, params]: [
  string,
  Omit<NotificationQueryParams, 'onlyNew'>,
]) => {
  return getNewNotifications(params)
}

// 通知列表Hook
export const useNotificationList = (params: NotificationQueryParams = {}) => {
  const validParams = {
    page: params.page || 1,
    limit: params.limit || 10,
    ...params,
  }

  const { data, error, isLoading, isValidating } = useSWR(
    getNotificationListKey(validParams),
    notificationListFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
    }
  )

  // 刷新通知列表
  const refreshNotificationList = async () => {
    await mutate(getNotificationListKey(validParams))
  }

  return {
    notifications: data?.data.items || [],
    meta: data?.data.meta || { total: 0, page: 1, limit: 10 },
    isLoading,
    isValidating,
    error,
    refreshNotificationList,
  }
}

// 新通知Hook
export const useNewNotifications = (params: Omit<NotificationQueryParams, 'onlyNew'> = {}) => {
  const validParams = {
    page: params.page || 1,
    limit: params.limit || 999, // 移除数量限制，获取所有未读通知
  }

  const { data, error, isLoading, isValidating } = useSWR(
    getNewNotificationsKey(validParams),
    newNotificationsFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
    }
  )

  return {
    newNotifications: data?.data.items || [],
    meta: data?.data.meta || { total: 0, page: 1, limit: 10 },
    isLoading,
    isValidating,
    error,
  }
}

// 通知操作Hook
export const useNotificationActions = () => {
  const [isCreating, setIsCreating] = useState(false)
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false)
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 创建通知
  const createNotificationAction = async (data: CreateNotificationDto) => {
    setIsCreating(true)
    try {
      const response = await createNotification(data)
      if (response.code === 0) {
        message.success('通知创建成功')
        // 刷新所有相关的通知缓存
        await mutate(
          key =>
            Array.isArray(key) && (key[0] === '/notifications' || key[0] === '/notifications/new')
        )
        return true
      } else {
        throw new Error(response.message || '创建通知失败')
      }
    } catch (error) {
      console.error('创建通知失败:', error)
      message.error(error instanceof Error ? error.message : '创建通知失败')
      return false
    } finally {
      setIsCreating(false)
    }
  }

  // 标记通知为已读
  const markAsReadAction = async (notificationId: number) => {
    setIsMarkingAsRead(true)
    try {
      const response = await markNotificationAsRead(notificationId)
      if (response.code === 0) {
        // 刷新所有相关的通知缓存
        await mutate(
          key =>
            Array.isArray(key) && (key[0] === '/notifications' || key[0] === '/notifications/new')
        )
        return true
      } else {
        throw new Error(response.message || '标记已读失败')
      }
    } catch (error) {
      console.error('标记已读失败:', error)
      message.error(error instanceof Error ? error.message : '标记已读失败')
      return false
    } finally {
      setIsMarkingAsRead(false)
    }
  }

  // 标记所有通知为已读
  const markAllAsReadAction = async () => {
    setIsMarkingAllAsRead(true)
    try {
      const response = await markAllNotificationsAsRead()
      if (response.code === 0) {
        message.success(`已标记 ${response.data.data.count} 条通知为已读`)
        // 刷新所有相关的通知缓存
        await mutate(
          key =>
            Array.isArray(key) && (key[0] === '/notifications' || key[0] === '/notifications/new')
        )
        return true
      } else {
        throw new Error(response.message || '标记全部已读失败')
      }
    } catch (error) {
      console.error('标记全部已读失败:', error)
      message.error(error instanceof Error ? error.message : '标记全部已读失败')
      return false
    } finally {
      setIsMarkingAllAsRead(false)
    }
  }

  // 删除通知记录
  const deleteNotificationAction = async (recordId: number) => {
    setIsDeleting(true)
    try {
      const response = await deleteNotificationRecord(recordId)
      if (response.code === 0) {
        message.success('通知删除成功')
        // 刷新所有相关的通知缓存
        await mutate(
          key =>
            Array.isArray(key) && (key[0] === '/notifications' || key[0] === '/notifications/new')
        )
        return true
      } else {
        throw new Error(response.message || '删除通知失败')
      }
    } catch (error) {
      console.error('删除通知失败:', error)
      message.error(error instanceof Error ? error.message : '删除通知失败')
      return false
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    createNotificationAction,
    markAsReadAction,
    markAllAsReadAction,
    deleteNotificationAction,
    isCreating,
    isMarkingAsRead,
    isMarkingAllAsRead,
    isDeleting,
  }
}
