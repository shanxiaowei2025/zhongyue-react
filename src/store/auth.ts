import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { User } from '../types'

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
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  immer(set => ({
    user: getUserFromStorage(),
    token: localStorage.getItem('token'),
    isAuthenticated: !!(localStorage.getItem('token') && getUserFromStorage()),
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
    logout: () =>
      set(state => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        state.user = null
        state.token = null
        state.isAuthenticated = false
      }),
  }))
)
