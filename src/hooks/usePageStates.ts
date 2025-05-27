import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface PageStatesStore {
  // 存储各页面的状态，键为状态 ID，值为任意类型
  states: Record<string, any>

  // 设置状态
  setState: (key: string, value: any) => void

  // 获取状态
  getState: (key: string) => any

  // 清除状态
  clearState: (key: string) => void

  // 清除所有状态
  clearAll: () => void
}

export const usePageStatesStore = create<PageStatesStore>()(
  persist(
    (set, get) => ({
      states: {},

      setState: (key, value) =>
        set(state => ({
          states: {
            ...state.states,
            [key]: value,
          },
        })),

      getState: key => get().states[key],

      clearState: key =>
        set(state => {
          const newStates = { ...state.states }
          delete newStates[key]
          return { states: newStates }
        }),

      clearAll: () => set({ states: {} }),
    }),
    {
      name: 'zhongyue-page-states',
    }
  )
)

// Hook 用于组件中使用页面状态
export const usePageStates = <T>(key: string, initialState: T): [T, (value: T) => void] => {
  const { getState, setState } = usePageStatesStore()
  const state = getState(key) || initialState

  const setPageState = (value: T) => {
    setState(key, value)
  }

  return [state, setPageState]
}
