import { useEffect, useCallback, useRef, useState } from 'react'

/**
 * 防抖Hook - 限制函数调用频率
 * @param fn 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @param deps 依赖数组，当这些依赖变化时重新创建防抖函数
 * @returns 防抖处理后的函数
 */
export function useDebounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const fnRef = useRef<T>(fn)

  // 更新函数引用
  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  // 清除定时器
  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current)
      }
    }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(
    ((...args: any[]) => {
      if (timeout.current) {
        clearTimeout(timeout.current)
      }
      timeout.current = setTimeout(() => {
        fnRef.current(...args)
      }, delay)
    }) as T,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [delay, ...deps]
  )
}

/**
 * 防抖值Hook - 对一个值进行防抖处理
 * @param value 需要防抖的值
 * @param delay 延迟时间（毫秒）
 * @returns 防抖处理后的值
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}
