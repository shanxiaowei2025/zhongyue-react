import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SalaryTokenInfo } from '../types/salaryAuth'

interface SalaryAuthState {
  // 薪资token信息
  tokenInfo: SalaryTokenInfo | null

  // Actions
  setToken: (tokenInfo: SalaryTokenInfo) => void
  clearToken: () => void
  isTokenValid: () => boolean
  getValidToken: () => string | null
}

export const useSalaryAuthStore = create<SalaryAuthState>()(
  persist(
    (set, get) => ({
      tokenInfo: null,

      setToken: (tokenInfo: SalaryTokenInfo) => {
        set({ tokenInfo })
      },

      clearToken: () => {
        set({ tokenInfo: null })
      },

      isTokenValid: () => {
        const { tokenInfo } = get()
        if (!tokenInfo) return false

        // 检查token是否过期
        const now = Date.now()
        return tokenInfo.expiresAt > now
      },

      getValidToken: () => {
        const { tokenInfo, isTokenValid } = get()
        if (!tokenInfo || !isTokenValid()) {
          return null
        }
        return tokenInfo.token
      },
    }),
    {
      name: 'salary-auth-storage',
      partialize: state => ({ tokenInfo: state.tokenInfo }),
    }
  )
)
