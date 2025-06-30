import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface ContractFormState {
  // 合同类型
  contractType: string | null
  // 签署方
  signatory: string | null
  // 表单数据（不限制字段）
  formData: Record<string, any>
  // 最后更新时间
  lastUpdated: number | null
  // 当前表单路径
  currentPath: string | null

  // Actions
  setContractType: (contractType: string | null) => void
  setSignatory: (signatory: string | null) => void
  updateFormField: (key: string, value: any) => void
  updateFormData: (data: Record<string, any>) => void
  clearForm: () => void
  clearFormData: () => void
  clearAllFormCache: () => void
}

export const useContractFormStore = create<ContractFormState>()(
  persist(
    immer((set) => ({
      contractType: null,
      signatory: null,
      formData: {},
      lastUpdated: null,
      currentPath: null,

      setContractType: (contractType) =>
        set((state) => {
          state.contractType = contractType
          state.lastUpdated = Date.now()
        }),

      setSignatory: (signatory) =>
        set((state) => {
          state.signatory = signatory
          state.lastUpdated = Date.now()
        }),

      updateFormField: (key, value) =>
        set((state) => {
          state.formData[key] = value
          state.lastUpdated = Date.now()
        }),

      updateFormData: (data) =>
        set((state) => {
          // 合并数据而不是替换，保留用户可能清空的字段
          state.formData = { ...state.formData, ...data }
          state.lastUpdated = Date.now()
        }),

      clearForm: () =>
        set((state) => {
          state.contractType = null
          state.signatory = null
          state.formData = {}
          state.lastUpdated = Date.now()
        }),

      clearFormData: () =>
        set((state) => {
          state.formData = {}
          state.lastUpdated = Date.now()
        }),

      clearAllFormCache: () => {
        // 清理内存状态
        set((state) => {
          state.contractType = null
          state.signatory = null
          state.formData = {}
          state.lastUpdated = Date.now()
          state.currentPath = null
        })
        
        // 延迟清理 sessionStorage，确保状态更新完成
        setTimeout(() => {
          try {
            sessionStorage.removeItem('contract-form-storage')
            console.log('🧹 已彻底清理合同表单缓存（内存 + sessionStorage）')
          } catch (error) {
            console.error('清理 sessionStorage 失败:', error)
          }
        }, 0)
      },
    })),
    {
      name: 'contract-form-storage', // localStorage的key名称
      storage: createJSONStorage(() => sessionStorage), // 使用sessionStorage而不是localStorage
      partialize: (state) => ({
        // 只持久化这些字段
        contractType: state.contractType,
        signatory: state.signatory,
        formData: state.formData,
        lastUpdated: state.lastUpdated,
        currentPath: state.currentPath,
      }),
    }
  )
) 