import request from './request'
import type {
  Notification,
  CreateNotificationDto,
  NotificationQueryParams,
  NotificationListResponse,
  MarkAsReadResponse,
  MarkAllAsReadResponse,
} from '../types/notification'
import type { ApiResponse } from '../types'

// 获取通知列表
export const getNotificationList = async (
  params: NotificationQueryParams = {}
): Promise<NotificationListResponse> => {
  const queryParams = {
    page: params.page || 1,
    limit: params.limit || 10,
    ...(params.onlyNew !== undefined && { onlyNew: params.onlyNew.toString() }),
  }

  return request.get<NotificationListResponse>('/notifications', queryParams)
}

// 获取新通知（未读）
export const getNewNotifications = async (
  params: Omit<NotificationQueryParams, 'onlyNew'> = {}
): Promise<NotificationListResponse> => {
  const queryParams = {
    page: params.page || 1,
    limit: params.limit || 10,
  }

  return request.get<NotificationListResponse>('/notifications/new', queryParams)
}

// 创建通知
export const createNotification = async (
  data: CreateNotificationDto
): Promise<ApiResponse<Notification>> => {
  return request.post<ApiResponse<Notification>>('/notifications', data)
}

// 标记通知为已读
export const markNotificationAsRead = async (
  notificationId: number
): Promise<MarkAsReadResponse> => {
  return request.put<MarkAsReadResponse>(`/notifications/${notificationId}/read`)
}

// 标记所有通知为已读
export const markAllNotificationsAsRead = async (): Promise<MarkAllAsReadResponse> => {
  return request.put<MarkAllAsReadResponse>('/notifications/read-all')
}

// 删除通知记录
export const deleteNotificationRecord = async (recordId: number): Promise<ApiResponse<any>> => {
  return request.delete<ApiResponse<any>>(`/notifications/${recordId}`)
}

// 获取通知统计信息（基于现有接口计算）
export const getNotificationStats = async () => {
  try {
    // 获取所有通知
    const allResponse = await getNotificationList({ page: 1, limit: 1 })
    const total = allResponse.data.meta.total

    // 获取未读通知
    const unreadResponse = await getNewNotifications({ page: 1, limit: 1 })
    const unread = unreadResponse.data.meta.total

    return {
      total,
      unread,
    }
  } catch (error) {
    console.error('获取通知统计失败:', error)
    return {
      total: 0,
      unread: 0,
    }
  }
}
