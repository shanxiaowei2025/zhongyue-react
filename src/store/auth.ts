import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { User } from '../types'

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
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: !!localStorage.getItem('token'),
    setUser: user =>
      set(state => {
        state.user = user
      }),
    setToken: token =>
      set(state => {
        state.token = token
        state.isAuthenticated = !!token
        if (token) {
          localStorage.setItem('token', token)
        } else {
          localStorage.removeItem('token')
        }
      }),
    logout: () =>
      set(state => {
        state.user = null
        state.token = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
      }),
  }))
)
