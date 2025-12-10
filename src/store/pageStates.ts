import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'

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
 * 使用 Zustand + immer + persist 实现
 * 状态会自动保存到 localStorage，刷新后自动恢复
 */
export const usePageStates = create<PageStatesStore>()(
  persist(
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
    })),
    {
      name: 'zhongyue-page-states', // localStorage 的 key 名称
    }
  )
)
