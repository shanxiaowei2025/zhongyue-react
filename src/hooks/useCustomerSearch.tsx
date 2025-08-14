import { useState, useCallback } from 'react'
import { message } from 'antd'
import { searchCustomers } from '../api/enterpriseService'
import type { CustomerSearchOption, Enterprise } from '../types/enterpriseService'
import { useDebounce } from './useDebounce'

export type SearchType = 'companyName' | 'unifiedSocialCreditCode'

export interface UseCustomerSearchProps {
  searchType: SearchType
  onSelect?: (enterprise: Enterprise) => void
  debounceMs?: number
}

export interface UseCustomerSearchReturn {
  // 搜索状态
  loading: boolean
  options: CustomerSearchOption[]
  searchValue: string
  total: number
  hasMore: boolean
  currentPage: number

  // 搜索方法
  handleSearch: (value: string) => void
  handleSelect: (value: string, option: CustomerSearchOption) => void
  handleChange: (value: string) => void
  handleLoadMore: () => void
  resetSearch: () => void
}

export const useCustomerSearch = ({
  searchType,
  onSelect,
  debounceMs = 300,
}: UseCustomerSearchProps): UseCustomerSearchReturn => {
  const [loading, setLoading] = useState<boolean>(false)
  const [options, setOptions] = useState<CustomerSearchOption[]>([])
  const [searchValue, setSearchValue] = useState<string>('')
  const [total, setTotal] = useState<number>(0)
  const [hasMore, setHasMore] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // 防抖搜索
  const debouncedSearch = useDebounce(async (value: string, page: number = 1) => {
    if (!value || !value.trim()) {
      setOptions([])
      setTotal(0)
      setHasMore(false)
      setCurrentPage(1)
      return
    }

    try {
      setLoading(true)

      // 构建查询参数
      const params = {
        page,
        pageSize: 20,
        ...(searchType === 'companyName'
          ? { companyName: value.trim() }
          : { unifiedSocialCreditCode: value.trim() }),
      }

      const response = await searchCustomers(params)

      if (response.code === 0 && response.data) {
        const { data: enterprises, total: totalCount } = response.data

        // 转换为AutoComplete选项格式
        const newOptions: CustomerSearchOption[] = enterprises.map(enterprise => ({
          value:
            searchType === 'companyName'
              ? enterprise.companyName
              : enterprise.unifiedSocialCreditCode,
          label: (
            <div style={{ padding: '4px 0' }}>
              <div style={{ fontWeight: 'bold' }}>{enterprise.companyName}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                统一社会信用代码: {enterprise.unifiedSocialCreditCode || '未填写'}
              </div>
              {enterprise.registeredAddress && (
                <div style={{ fontSize: '12px', color: '#666' }}>
                  地址: {enterprise.registeredAddress}
                </div>
              )}
            </div>
          ),
          enterprise,
        }))

        if (page === 1) {
          setOptions(newOptions)
        } else {
          setOptions(prev => [...prev, ...newOptions])
        }

        setTotal(totalCount)
        setHasMore(page * 20 < totalCount)
        setCurrentPage(page)
      } else {
        throw new Error(response.message || '搜索失败')
      }
    } catch (error) {
      console.error('搜索企业失败:', error)
      // 错误处理由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }, debounceMs)

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      debouncedSearch(value, 1)
    },
    [debouncedSearch]
  )

  const handleSelect = useCallback(
    (value: string, option: CustomerSearchOption) => {
      setSearchValue(value)
      if (onSelect && option.enterprise) {
        onSelect(option.enterprise)
      }
    },
    [onSelect]
  )

  const handleChange = useCallback((value: string) => {
    setSearchValue(value)
    if (!value) {
      resetSearch()
    }
  }, [])

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore && searchValue) {
      debouncedSearch(searchValue, currentPage + 1)
    }
  }, [loading, hasMore, searchValue, currentPage, debouncedSearch])

  const resetSearch = useCallback(() => {
    setOptions([])
    setSearchValue('')
    setTotal(0)
    setHasMore(false)
    setCurrentPage(1)
    setLoading(false)
  }, [])

  return {
    loading,
    options,
    searchValue,
    total,
    hasMore,
    currentPage,
    handleSearch,
    handleSelect,
    handleChange,
    handleLoadMore,
    resetSearch,
  }
}
