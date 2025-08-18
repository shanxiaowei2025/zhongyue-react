import type { ApiResponse } from './index'

// 通知基础类型
export interface Notification {
  id: number
  notificationId: number
  title: string
  content: string
  type: string
  createdBy: number
  createdAt: string
  readStatus: number // 0: 未读, 1: 已读
  readAt: string | null
}

// 创建通知DTO
export interface CreateNotificationDto {
  title: string
  content: string
  type?: string
  targetUsers?: number[]
  targetRoles?: string[]
  targetDepts?: number[]
}

// 查询通知参数
export interface NotificationQueryParams {
  page?: number
  limit?: number
  onlyNew?: boolean
}

// 通知列表响应
export interface NotificationListResponse
  extends ApiResponse<{
    items: Notification[]
    meta: {
      total: number
      page: number
      limit: number
    }
  }> {}

// 标记已读响应
export interface MarkAsReadResponse
  extends ApiResponse<{
    notificationId: number
    readAt: string
  }> {}

// 标记全部已读响应
export interface MarkAllAsReadResponse
  extends ApiResponse<{
    data: {
      count: number
      readAt: string
    }
  }> {}

// WebSocket通知事件数据
export interface WebSocketNotificationData {
  id: number
  title: string
  content: string
  type: string
  createdBy: number
  createdAt: string
}

// 通知统计信息
export interface NotificationStats {
  total: number
  unread: number
}
