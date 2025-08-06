import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import dayjs from 'dayjs'
import type {
  SalaryRecord,
  RelatedData,
  SalaryStatistics,
  IntegratedState,
  SearchState,
  PaginationState,
} from '../types/salaryIntegrated'

// 集成化薪资管理状态接口
interface SalaryIntegratedStore extends IntegratedState {
  // 选择操作
  setSelectedEmployee: (employee: SalaryRecord | null) => void
  setSelectedYearMonth: (yearMonth: string) => void

  // 数据操作
  setSalaryData: (data: SalaryRecord[]) => void
  setRelatedData: (data: RelatedData) => void
  setStatistics: (statistics: SalaryStatistics) => void
  setLoading: (loading: boolean) => void

  // 搜索状态操作
  setSearchState: (searchState: Partial<SearchState>) => void
  resetSearchState: () => void

  // 分页状态操作
  setPaginationState: (pagination: Partial<PaginationState>) => void
  resetPaginationState: () => void

  // 薪资数据操作
  updateSalaryRecord: (id: number, data: Partial<SalaryRecord>) => void
  removeSalaryRecord: (id: number) => void
  addSalaryRecord: (record: SalaryRecord) => void

  // 批量操作
  batchUpdateSalaryRecords: (records: SalaryRecord[]) => void
  batchRemoveSalaryRecords: (ids: number[]) => void

  // 工具方法
  getSalaryRecordById: (id: number) => SalaryRecord | undefined
  getSalaryRecordByName: (name: string) => SalaryRecord | undefined
  getSelectedEmployeeSalary: () => SalaryRecord | null

  // 重置操作
  resetAll: () => void
  resetData: () => void
}

// 初始状态
const initialState: IntegratedState = {
  selectedEmployee: null,
  selectedYearMonth: dayjs().format('YYYY-MM'),
  salaryData: [],
  relatedData: {},
  statistics: {
    totalPayable: 0,
    totalSocialInsurance: 0,
    totalTax: 0,
    employeeCount: 0,
    paidCount: 0,
    unpaidCount: 0,
    confirmedCount: 0,
    unconfirmedCount: 0,
    confirmationRate: 0,
  },
  loading: false,
  searchState: {},
  paginationState: {
    current: 1,
    pageSize: 50,
    total: 0,
  },
}

// 创建store
export const useSalaryIntegratedStore = create<SalaryIntegratedStore>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // 选择操作
      setSelectedEmployee: employee =>
        set(state => {
          state.selectedEmployee = employee
        }),

      setSelectedYearMonth: yearMonth =>
        set(state => {
          state.selectedYearMonth = yearMonth
          // 切换月份时清空相关数据
          state.relatedData = {}
          state.selectedEmployee = null
        }),

      // 数据操作
      setSalaryData: data =>
        set(state => {
          state.salaryData = data
        }),

      setRelatedData: data =>
        set(state => {
          state.relatedData = data
        }),

      setStatistics: statistics =>
        set(state => {
          state.statistics = statistics
        }),

      setLoading: loading =>
        set(state => {
          state.loading = loading
        }),

      // 搜索状态操作
      setSearchState: searchState =>
        set(state => {
          state.searchState = { ...state.searchState, ...searchState }
        }),

      resetSearchState: () =>
        set(state => {
          state.searchState = {}
        }),

      // 分页状态操作
      setPaginationState: pagination =>
        set(state => {
          state.paginationState = { ...state.paginationState, ...pagination }
        }),

      resetPaginationState: () =>
        set(state => {
          state.paginationState = {
            current: 1,
            pageSize: 50,
            total: 0,
          }
        }),

      // 薪资数据操作
      updateSalaryRecord: (id, data) =>
        set(state => {
          const index = state.salaryData.findIndex(item => item.id === id)
          if (index !== -1) {
            state.salaryData[index] = { ...state.salaryData[index], ...data }

            // 如果更新的是当前选中员工，同时更新选中状态
            if (state.selectedEmployee?.id === id) {
              state.selectedEmployee = state.salaryData[index]
            }
          }
        }),

      removeSalaryRecord: id =>
        set(state => {
          state.salaryData = state.salaryData.filter(item => item.id !== id)

          // 如果删除的是当前选中员工，清空选中状态
          if (state.selectedEmployee?.id === id) {
            state.selectedEmployee = null
            state.relatedData = {}
          }
        }),

      addSalaryRecord: record =>
        set(state => {
          // 避免重复添加
          const exists = state.salaryData.some(item => item.id === record.id)
          if (!exists) {
            state.salaryData.unshift(record)
          }
        }),

      // 批量操作
      batchUpdateSalaryRecords: records =>
        set(state => {
          records.forEach(record => {
            const index = state.salaryData.findIndex(item => item.id === record.id)
            if (index !== -1) {
              state.salaryData[index] = record
            } else {
              state.salaryData.push(record)
            }
          })

          // 更新选中员工状态
          if (state.selectedEmployee) {
            const updatedEmployee = records.find(r => r.id === state.selectedEmployee!.id)
            if (updatedEmployee) {
              state.selectedEmployee = updatedEmployee
            }
          }
        }),

      batchRemoveSalaryRecords: ids =>
        set(state => {
          state.salaryData = state.salaryData.filter(item => !ids.includes(item.id))

          // 如果删除的包含当前选中员工，清空选中状态
          if (state.selectedEmployee && ids.includes(state.selectedEmployee.id)) {
            state.selectedEmployee = null
            state.relatedData = {}
          }
        }),

      // 工具方法
      getSalaryRecordById: id => {
        const state = get()
        return state.salaryData.find(item => item.id === id)
      },

      getSalaryRecordByName: name => {
        const state = get()
        return state.salaryData.find(item => item.name === name)
      },

      getSelectedEmployeeSalary: () => {
        const state = get()
        return state.selectedEmployee
      },

      // 重置操作
      resetAll: () =>
        set(() => ({
          ...initialState,
          selectedYearMonth: dayjs().format('YYYY-MM'),
        })),

      resetData: () =>
        set(state => {
          state.salaryData = []
          state.relatedData = {}
          state.selectedEmployee = null
          state.statistics = initialState.statistics
        }),
    })),
    {
      name: 'salary-integrated-store',
      // 只持久化关键状态，不持久化数据
      partialize: state => ({
        selectedYearMonth: state.selectedYearMonth,
        searchState: state.searchState,
        paginationState: state.paginationState,
      }),
    }
  )
)

// 选择器hooks，用于优化性能
export const useSalaryIntegratedSelectors = () => {
  const selectedEmployee = useSalaryIntegratedStore(state => state.selectedEmployee)
  const selectedYearMonth = useSalaryIntegratedStore(state => state.selectedYearMonth)
  const salaryData = useSalaryIntegratedStore(state => state.salaryData)
  const relatedData = useSalaryIntegratedStore(state => state.relatedData)
  const statistics = useSalaryIntegratedStore(state => state.statistics)
  const loading = useSalaryIntegratedStore(state => state.loading)
  const searchState = useSalaryIntegratedStore(state => state.searchState)
  const paginationState = useSalaryIntegratedStore(state => state.paginationState)

  return {
    selectedEmployee,
    selectedYearMonth,
    salaryData,
    relatedData,
    statistics,
    loading,
    searchState,
    paginationState,
  }
}

// 操作方法hooks
export const useSalaryIntegratedActions = () => {
  const setSelectedEmployee = useSalaryIntegratedStore(state => state.setSelectedEmployee)
  const setSelectedYearMonth = useSalaryIntegratedStore(state => state.setSelectedYearMonth)
  const setSalaryData = useSalaryIntegratedStore(state => state.setSalaryData)
  const setRelatedData = useSalaryIntegratedStore(state => state.setRelatedData)
  const setStatistics = useSalaryIntegratedStore(state => state.setStatistics)
  const setLoading = useSalaryIntegratedStore(state => state.setLoading)
  const setSearchState = useSalaryIntegratedStore(state => state.setSearchState)
  const resetSearchState = useSalaryIntegratedStore(state => state.resetSearchState)
  const setPaginationState = useSalaryIntegratedStore(state => state.setPaginationState)
  const resetPaginationState = useSalaryIntegratedStore(state => state.resetPaginationState)
  const updateSalaryRecord = useSalaryIntegratedStore(state => state.updateSalaryRecord)
  const removeSalaryRecord = useSalaryIntegratedStore(state => state.removeSalaryRecord)
  const addSalaryRecord = useSalaryIntegratedStore(state => state.addSalaryRecord)
  const batchUpdateSalaryRecords = useSalaryIntegratedStore(state => state.batchUpdateSalaryRecords)
  const batchRemoveSalaryRecords = useSalaryIntegratedStore(state => state.batchRemoveSalaryRecords)
  const getSalaryRecordById = useSalaryIntegratedStore(state => state.getSalaryRecordById)
  const getSalaryRecordByName = useSalaryIntegratedStore(state => state.getSalaryRecordByName)
  const getSelectedEmployeeSalary = useSalaryIntegratedStore(
    state => state.getSelectedEmployeeSalary
  )
  const resetAll = useSalaryIntegratedStore(state => state.resetAll)
  const resetData = useSalaryIntegratedStore(state => state.resetData)

  return {
    setSelectedEmployee,
    setSelectedYearMonth,
    setSalaryData,
    setRelatedData,
    setStatistics,
    setLoading,
    setSearchState,
    resetSearchState,
    setPaginationState,
    resetPaginationState,
    updateSalaryRecord,
    removeSalaryRecord,
    addSalaryRecord,
    batchUpdateSalaryRecords,
    batchRemoveSalaryRecords,
    getSalaryRecordById,
    getSalaryRecordByName,
    getSelectedEmployeeSalary,
    resetAll,
    resetData,
  }
}

// 计算派生状态的hooks
export const useSalaryIntegratedComputed = () => {
  const { salaryData, selectedEmployee, statistics } = useSalaryIntegratedSelectors()

  // 过滤后的薪资数据
  const filteredSalaryData = salaryData.filter(item => {
    // 这里可以根据搜索条件进行过滤
    return true
  })

  // 已发放员工数量
  const paidEmployeeCount = salaryData.filter(item => item.bankCardOrWechat > 0).length

  // 未发放员工数量
  const unpaidEmployeeCount = salaryData.length - paidEmployeeCount

  // 平均薪资
  const averageSalary =
    salaryData.length > 0
      ? salaryData.reduce((sum, item) => sum + item.totalPayable, 0) / salaryData.length
      : 0

  return {
    filteredSalaryData,
    paidEmployeeCount,
    unpaidEmployeeCount,
    averageSalary,
    totalEmployeeCount: salaryData.length,
  }
}
