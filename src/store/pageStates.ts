import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

/**
 * 页面状态存储接口
 * 用于在页面切换时保存和恢复页面状态
 */
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

/**
 * 页面状态管理 store
 * 使用 Zustand + immer 实现
 */
export const usePageStates = create<PageStatesStore>()(
  immer((set, get) => ({
    // 状态存储对象
    states: {},

    // 设置状态
    setState: (key, value) =>
      set(state => {
        state.states[key] = value
      }),

    // 获取状态
    getState: key => get().states[key],

    // 清除状态
    clearState: key =>
      set(state => {
        delete state.states[key]
      }),

    // 清除所有状态
    clearAll: () =>
      set(state => {
        state.states = {}
      }),
  }))
)
