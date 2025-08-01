import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// 员工表单数据结构接口
interface EmployeeFormData {
  // 基本信息
  name?: string
  departmentIds?: number[]
  employeeType?: string
  position?: string
  rank?: string
  commissionRatePosition?: string
  isResigned?: boolean

  // 薪资信息
  baseSalary?: number
  payrollCompany?: string
  workYears?: number

  // 个人信息
  birthday?: any // dayjs对象或字符串
  actualBirthday?: string
  idCardNumber?: string
  bankCardNumber?: string
  bankName?: string
  hireDate?: any // dayjs对象或字符串

  // 简历文件
  resume?: any

  // 支持其他动态字段
  [key: string]: any
}

interface EmployeeFormState {
  // 表单数据按路径存储，支持多个员工编辑页面
  formDataByPath: Record<string, EmployeeFormData>
  // 最后更新时间
  lastUpdated: number | null
  // 是否正在恢复数据
  isRestoring: boolean

  // Actions
  updateFormField: (path: string, key: string, value: any) => void
  batchUpdateFormData: (path: string, data: Partial<EmployeeFormData>) => void
  clearFormData: (path: string) => void
  clearAllCache: () => void
  setRestoring: (restoring: boolean) => void
  getFormData: (path: string) => EmployeeFormData
  hasFormData: (path: string) => boolean
}

export const useEmployeeFormStore = create<EmployeeFormState>()(
  persist(
    immer((set, get) => ({
      formDataByPath: {},
      lastUpdated: null,
      isRestoring: false,

      updateFormField: (path, key, value) =>
        set(state => {
          // 如果正在恢复数据，跳过更新
          if (state.isRestoring) {
            return
          }

          if (!state.formDataByPath[path]) {
            state.formDataByPath[path] = {}
          }

          state.formDataByPath[path][key] = value
          state.lastUpdated = Date.now()

          // 特别记录重要字段的更新
          if (['name', 'baseSalary', 'payrollCompany'].includes(key)) {
            console.log(`💾 [EmployeeStore] 更新重要字段 ${path}/${key}:`, value)
          }
        }),

      batchUpdateFormData: (path, data) =>
        set(state => {
          // 如果正在恢复数据，跳过更新
          if (state.isRestoring) {
            console.log('⏸️ [EmployeeStore] 正在恢复数据，跳过批量更新')
            return
          }

          if (!state.formDataByPath[path]) {
            state.formDataByPath[path] = {}
          }

          // 深度合并数据
          Object.keys(data).forEach(key => {
            if (data[key] !== undefined) {
              // 对象类型进行深度克隆，避免 Immer 不可变性冲突
              if (
                typeof data[key] === 'object' &&
                data[key] !== null &&
                !Array.isArray(data[key]) &&
                !data[key]?.format // 排除dayjs对象
              ) {
                state.formDataByPath[path][key] = JSON.parse(JSON.stringify(data[key]))
              } else {
                state.formDataByPath[path][key] = data[key]
              }
            }
          })

          state.lastUpdated = Date.now()
          console.log(`💾 [EmployeeStore] 批量更新表单数据 ${path}:`, Object.keys(data))
        }),

      clearFormData: path =>
        set(state => {
          delete state.formDataByPath[path]
          state.lastUpdated = Date.now()
          console.log(`🧹 [EmployeeStore] 清除表单数据: ${path}`)
        }),

      clearAllCache: () =>
        set(state => {
          state.formDataByPath = {}
          state.lastUpdated = null
          state.isRestoring = false
          console.log('🧹 [EmployeeStore] 清除所有缓存数据')
        }),

      setRestoring: restoring =>
        set(state => {
          state.isRestoring = restoring
          if (restoring) {
            console.log('🔄 [EmployeeStore] 开始恢复数据模式')
          } else {
            console.log('✅ [EmployeeStore] 结束恢复数据模式')
          }
        }),

      getFormData: path => {
        const state = get()
        return state.formDataByPath[path] || {}
      },

      hasFormData: path => {
        const state = get()
        return !!state.formDataByPath[path] && Object.keys(state.formDataByPath[path]).length > 0
      },
    })),
    {
      name: 'employee-form-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: state => ({
        formDataByPath: state.formDataByPath,
        lastUpdated: state.lastUpdated,
      }),
      // 数据恢复时的处理
      onRehydrateStorage: () => state => {
        if (state) {
          console.log('🔄 [EmployeeStore] 从sessionStorage恢复缓存数据:', {
            paths: Object.keys(state.formDataByPath || {}),
            lastUpdated: state.lastUpdated ? new Date(state.lastUpdated).toLocaleString() : null,
          })
        }
      },
    }
  )
)
