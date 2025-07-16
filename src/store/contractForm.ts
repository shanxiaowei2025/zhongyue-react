import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// 合同表单完整数据结构接口
interface ContractFormData {
  // 基础合同信息
  signatory?: string | null
  contractType?: string | null

  // 甲方信息
  partyACompany?: string
  partyAAddress?: string
  partyAContact?: string
  partyAPhone?: string
  partyACreditCode?: string
  partyALegalPerson?: string
  partyAPostalCode?: string

  // 乙方信息
  partyBCompany?: string
  partyBContact?: string
  partyBPhone?: string
  partyBAddress?: string
  partyBCreditCode?: string
  partyBLegalPerson?: string
  partyBPostalCode?: string

  // 签署日期
  partyASignDate?: string
  partyBSignDate?: string

  // 委托期间（代理记账合同）
  entrustmentStartDate?: string
  entrustmentEndDate?: string

  // 业务地址
  businessEstablishmentAddress?: string

  // 服务项目勾选状态
  checkedItems?: Record<string, boolean>
  itemAmounts?: Record<string, string>
  itemDates?: Record<string, { startDate?: string; endDate?: string }>

  // 金额显示值（用于输入框显示）
  amountDisplayValues?: Record<string, string>

  // 各项服务备注
  businessRemark?: string
  taxRemark?: string
  bankRemark?: string
  socialSecurityRemark?: string
  socialRemark?: string
  licenseRemark?: string
  otherRemark?: string

  // 各项服务费用
  businessServiceFee?: number
  taxServiceFee?: number
  bankServiceFee?: number
  socialSecurityServiceFee?: number
  socialServiceFee?: number
  licenseServiceFee?: number
  otherServiceFee?: number
  totalCost?: number

  // 代理记账相关费用
  totalAgencyAccountingFee?: number
  agencyAccountingFee?: number
  accountingSoftwareFee?: number
  invoicingSoftwareFee?: number
  accountBookFee?: number
  currentChargeFee?: number

  // 服务项目数据
  businessEstablishment?: Array<Record<string, any>>
  businessChange?: Array<Record<string, any>>
  businessCancellation?: Array<Record<string, any>>
  businessOther?: Array<Record<string, any>>
  businessMaterials?: Array<Record<string, any>>
  taxMatters?: Array<Record<string, any>>
  bankMatters?: Array<Record<string, any>>
  socialSecurity?: Array<Record<string, any>>
  licenseBusiness?: Array<Record<string, any>>
  declarationService?: Array<Record<string, any>>

  // 其他业务
  otherBusiness?: string
  paymentMethod?: string

  // 客户搜索相关
  customerSearchValue?: string

  // 咨询电话
  consultPhone?: string

  // 备注
  remarks?: string

  // 印章图片
  partyAStampImage?: string

  // 支持其他动态字段
  [key: string]: any
}

interface ContractFormState {
  // 合同类型
  contractType: string | null
  // 签署方
  signatory: string | null
  // 完整的表单数据
  formData: ContractFormData
  // 最后更新时间
  lastUpdated: number | null
  // 是否正在恢复数据
  isRestoring: boolean

  // Actions
  setContractType: (contractType: string | null) => void
  setSignatory: (signatory: string | null) => void
  updateFormField: (key: string, value: any) => void
  batchUpdateFormData: (data: Partial<ContractFormData>) => void
  clearFormData: () => void
  clearAllCache: () => void
  setRestoring: (restoring: boolean) => void

  // 获取完整表单数据（包含签署方和合同类型）
  getCompleteFormData: () => ContractFormData
}

export const useContractFormStore = create<ContractFormState>()(
  persist(
    immer((set, get) => ({
      contractType: null,
      signatory: null,
      formData: {},
      lastUpdated: null,
      isRestoring: false,

      setContractType: contractType =>
        set(state => {
          state.contractType = contractType
          state.formData.contractType = contractType
          state.lastUpdated = Date.now()
          console.log('💾 [Store] 设置合同类型:', contractType)
        }),

      setSignatory: signatory =>
        set(state => {
          state.signatory = signatory
          state.formData.signatory = signatory
          state.lastUpdated = Date.now()
          console.log('💾 [Store] 设置签署方:', signatory)
        }),

      updateFormField: (key, value) =>
        set(state => {
          // 如果正在恢复数据，跳过更新
          if (state.isRestoring) {
            return
          }

          state.formData[key] = value
          state.lastUpdated = Date.now()

          // 特别记录重要字段的更新
          if (['partyACompany', 'partyASignDate', 'partyBSignDate', 'totalCost'].includes(key)) {
            console.log(`💾 [Store] 更新重要字段 ${key}:`, value)
          }
        }),

      batchUpdateFormData: data =>
        set(state => {
          // 如果正在恢复数据，跳过更新
          if (state.isRestoring) {
            console.log('⏸️ [Store] 正在恢复数据，跳过批量更新')
            return
          }

          // 深度合并数据，确保不覆盖用户输入并避免不可变性问题
          Object.keys(data).forEach(key => {
            if (data[key] !== undefined) {
              // 对象类型进行深度克隆，避免 Immer 不可变性冲突
              if (
                typeof data[key] === 'object' &&
                data[key] !== null &&
                !Array.isArray(data[key])
              ) {
                state.formData[key] = JSON.parse(JSON.stringify(data[key]))
              } else {
                state.formData[key] = data[key]
              }
            }
          })

          state.lastUpdated = Date.now()
          console.log('💾 [Store] 批量更新表单数据:', Object.keys(data))
        }),

      clearFormData: () =>
        set(state => {
          state.formData = {
            signatory: state.signatory,
            contractType: state.contractType,
          } as ContractFormData
          state.lastUpdated = Date.now()
          console.log('🧹 [Store] 清除表单数据，保留签署方和合同类型')
        }),

      clearAllCache: () =>
        set(state => {
          state.contractType = null
          state.signatory = null
          state.formData = {}
          state.lastUpdated = null
          state.isRestoring = false
          console.log('🧹 [Store] 清除所有缓存数据')
        }),

      setRestoring: restoring =>
        set(state => {
          state.isRestoring = restoring
          if (restoring) {
            console.log('🔄 [Store] 开始恢复数据模式')
          } else {
            console.log('✅ [Store] 结束恢复数据模式')
          }
        }),

      getCompleteFormData: () => {
        const state = get()
        return {
          ...state.formData,
          signatory: state.signatory,
          contractType: state.contractType,
        } as ContractFormData
      },
    })),
    {
      name: 'contract-form-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: state => ({
        contractType: state.contractType,
        signatory: state.signatory,
        formData: state.formData,
        lastUpdated: state.lastUpdated,
      }),
      // 数据恢复时的处理
      onRehydrateStorage: () => state => {
        if (state) {
          console.log('🔄 [Store] 从sessionStorage恢复缓存数据:', {
            contractType: state.contractType,
            signatory: state.signatory,
            formDataKeys: Object.keys(state.formData || {}),
            lastUpdated: state.lastUpdated ? new Date(state.lastUpdated).toLocaleString() : null,
          })
        }
      },
    }
  )
)
