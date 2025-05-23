import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { message } from 'antd'
import type { User } from '../types'

// 超时时间设置为30分钟（毫秒）
const INACTIVITY_TIMEOUT = 30 * 60 * 1000

// 获取本地存储的用户信息
const getUserFromStorage = (): User | null => {
  const userString = localStorage.getItem('user')
  if (userString) {
    try {
      return JSON.parse(userString)
    } catch (error) {
      console.error('解析用户信息失败', error)
      return null
    }
  }
  return null
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  inactivityTimer: number | null
  passwordUpdatedAt: string | null
  isPasswordExpired: boolean
  passwordModalVisible: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setPasswordUpdatedAt: (date: string | null) => void
  checkPasswordExpiration: () => boolean
  showPasswordModal: () => void
  hidePasswordModal: () => void
  logout: () => void
  resetTimer: () => void
  startTimer: () => void
  clearTimer: () => void
}

export const useAuthStore = create<AuthState>()(
  immer(set => ({
    user: getUserFromStorage(),
    token: localStorage.getItem('token'),
    isAuthenticated: !!(localStorage.getItem('token') && getUserFromStorage()),
    inactivityTimer: null,
    passwordUpdatedAt: localStorage.getItem('passwordUpdatedAt'),
    isPasswordExpired: false,
    passwordModalVisible: false,
    
    setUser: user =>
      set(state => {
        state.user = user
        if (user) {
          localStorage.setItem('user', JSON.stringify(user))
        } else {
          localStorage.removeItem('user')
        }
        state.isAuthenticated = !!(state.token && user)
      }),
      
    setToken: token =>
      set(state => {
        state.token = token
        if (token) {
          localStorage.setItem('token', token)
        } else {
          localStorage.removeItem('token')
        }
        state.isAuthenticated = !!(token && state.user)
      }),
    
    setPasswordUpdatedAt: (date) =>
      set(state => {
        state.passwordUpdatedAt = date
        if (date) {
          localStorage.setItem('passwordUpdatedAt', date)
        } else {
          localStorage.removeItem('passwordUpdatedAt')
        }
        // 检查密码是否过期
        state.isPasswordExpired = state.checkPasswordExpiration()
      }),
    
    checkPasswordExpiration: () => {
      const passwordUpdatedAt = localStorage.getItem('passwordUpdatedAt')
      if (!passwordUpdatedAt) return false
      
      const lastUpdate = new Date(passwordUpdatedAt)
      const now = new Date()
      
      // 计算相差的毫秒数
      const diffTime = now.getTime() - lastUpdate.getTime()
      
      // 3个月的毫秒数 (大约90天)
      const threeMonths = 90 * 24 * 60 * 60 * 1000
      
      // 如果超过3个月，返回true表示密码已过期
      return diffTime > threeMonths
    },
    
    showPasswordModal: () =>
      set(state => {
        state.passwordModalVisible = true
      }),
      
    hidePasswordModal: () =>
      set(state => {
        state.passwordModalVisible = false
      }),
      
    logout: () =>
      set(state => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('passwordUpdatedAt')
        state.user = null
        state.token = null
        state.isAuthenticated = false
        state.passwordUpdatedAt = null
        state.isPasswordExpired = false
        // 清除超时计时器
        if (state.inactivityTimer) {
          window.clearTimeout(state.inactivityTimer)
          state.inactivityTimer = null
        }
      }),

    // 重置计时器
    resetTimer: () =>
      set(state => {
        if (state.inactivityTimer) {
          window.clearTimeout(state.inactivityTimer)
          state.inactivityTimer = null
        }
        if (state.isAuthenticated) {
          state.inactivityTimer = window.setTimeout(() => {
            useAuthStore.getState().logout()
            // 使用更友好的消息提示，而不是alert
            message.warning('您的登录已过期，请重新登录')
            window.location.href = '/login'
          }, INACTIVITY_TIMEOUT) as unknown as number
        }
      }),

    // 开始计时器
    startTimer: () =>
      set(state => {
        if (state.isAuthenticated && !state.inactivityTimer) {
          state.inactivityTimer = window.setTimeout(() => {
            useAuthStore.getState().logout()
            message.warning('您的登录已过期，请重新登录')
            window.location.href = '/login'
          }, INACTIVITY_TIMEOUT) as unknown as number
        }
      }),

    // 清除计时器
    clearTimer: () =>
      set(state => {
        if (state.inactivityTimer) {
          window.clearTimeout(state.inactivityTimer)
          state.inactivityTimer = null
        }
      })
  }))
)
