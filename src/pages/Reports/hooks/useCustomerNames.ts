import { useState, useEffect } from 'react'
import { getCustomerList } from '../../../api/customer'
import type { Customer } from '../../../types'

interface CustomerNameCache {
  [customerId: number]: {
    name: string
    loading: boolean
    error?: string
  }
}

export const useCustomerNames = (customerIds: number[]) => {
  const [customerNames, setCustomerNames] = useState<CustomerNameCache>({})

  useEffect(() => {
    if (!customerIds || customerIds.length === 0) {
      return
    }

    // 初始化loading状态
    const initialState: CustomerNameCache = {}
    customerIds.forEach(id => {
      if (!customerNames[id]) {
        initialState[id] = {
          name: `客户ID: ${id}`,
          loading: true,
        }
      }
    })

    if (Object.keys(initialState).length > 0) {
      setCustomerNames(prev => ({ ...prev, ...initialState }))
    }

    // 批量获取客户信息
    const fetchCustomerNames = async () => {
      const needFetchIds = customerIds.filter(id => !customerNames[id] || customerNames[id].loading)

      if (needFetchIds.length === 0) {
        return
      }

      try {
        // 使用客户列表接口批量获取，设置较大的pageSize来获取所有需要的客户
        const response = await getCustomerList({
          page: 1,
          pageSize: Math.max(needFetchIds.length, 100), // 确保能获取到所有需要的客户
        })

        if (response.code === 0 && response.data?.items) {
          const updates: CustomerNameCache = {}

          // 为所有需要获取的ID创建映射
          needFetchIds.forEach(customerId => {
            const customer = response.data.items.find((item: Customer) => item.id === customerId)
            updates[customerId] = {
              name: customer?.companyName || `客户ID: ${customerId}`,
              loading: false,
              error: customer ? undefined : '客户不存在',
            }
          })

          setCustomerNames(prev => ({ ...prev, ...updates }))
        } else {
          // 如果接口调用失败，为所有ID设置默认值
          const updates: CustomerNameCache = {}
          needFetchIds.forEach(customerId => {
            updates[customerId] = {
              name: `客户ID: ${customerId}`,
              loading: false,
              error: '获取客户信息失败',
            }
          })
          setCustomerNames(prev => ({ ...prev, ...updates }))
        }
      } catch (error) {
        console.error('批量获取客户信息失败:', error)
        // 网络错误时，为所有ID设置默认值
        const updates: CustomerNameCache = {}
        needFetchIds.forEach(customerId => {
          updates[customerId] = {
            name: `客户ID: ${customerId}`,
            loading: false,
            error: '网络错误',
          }
        })
        setCustomerNames(prev => ({ ...prev, ...updates }))
      }
    }

    fetchCustomerNames()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerIds.join(',')]) // 依赖于customerIds的字符串表示，customerNames在useCallback中处理

  // 获取客户名称的辅助函数
  const getCustomerName = (customerId: number): string => {
    const customer = customerNames[customerId]
    if (!customer) {
      return `客户ID: ${customerId}`
    }
    return customer.name
  }

  // 检查是否还有客户信息在加载中
  const isLoading = Object.values(customerNames).some(customer => customer.loading)

  return {
    customerNames,
    getCustomerName,
    isLoading,
  }
}
