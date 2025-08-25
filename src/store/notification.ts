import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { NotificationStats, WebSocketNotificationData } from '../types/notification'
import { getNotificationStats } from '../api/notification'

interface NotificationState {
  // 通知统计
  stats: NotificationStats

  // WebSocket连接状态
  isWebSocketConnected: boolean

  // 加载状态
  isLoadingStats: boolean

  // 操作方法
  updateStats: () => Promise<void>
  addNewNotification: (notification: WebSocketNotificationData) => void
  setWebSocketConnected: (connected: boolean) => void
  reset: () => void
}

const initialState = {
  stats: {
    total: 0,
    unread: 0,
  },
  isWebSocketConnected: false,
  isLoadingStats: false,
}

export const useNotificationStore = create<NotificationState>()(
  immer(set => ({
    ...initialState,

    // 更新通知统计
    updateStats: async () => {
      set(state => {
        state.isLoadingStats = true
      })

      try {
        const stats = await getNotificationStats()
        set(state => {
          state.stats = stats
          state.isLoadingStats = false
        })
      } catch (error) {
        console.error('更新通知统计失败:', error)
        set(state => {
          state.isLoadingStats = false
        })
      }
    },

    // 添加新通知（来自WebSocket）- 仅更新统计，SWR会自动获取新数据
    addNewNotification: () => {
      set(state => {
        // 更新统计
        state.stats.total += 1
        state.stats.unread += 1
      })
    },

    // 设置WebSocket连接状态
    setWebSocketConnected: (connected: boolean) => {
      set(state => {
        state.isWebSocketConnected = connected
      })
    },

    // 重置状态
    reset: () => {
      set(state => {
        Object.assign(state, initialState)
      })
    },
  }))
)
