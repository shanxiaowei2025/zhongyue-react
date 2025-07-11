import React from 'react'
import { AutoComplete, Spin } from 'antd'
import { useCustomerSearch, SearchType } from '../hooks/useCustomerSearch'
import type { Enterprise } from '../types/enterpriseService'

export interface CustomerAutoCompleteProps {
  value?: string
  placeholder?: string
  searchType: SearchType
  onSelect?: (enterprise: Enterprise) => void
  onChange?: (value: string) => void
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
}

const CustomerAutoComplete: React.FC<CustomerAutoCompleteProps> = ({
  value,
  placeholder,
  searchType,
  onSelect,
  onChange,
  disabled,
  style,
  className,
}) => {
  const {
    loading,
    options,
    total,
    hasMore,
    handleSearch,
    handleSelect,
    handleChange,
    handleLoadMore,
  } = useCustomerSearch({
    searchType,
    onSelect,
  })

  const handleValueChange = (val: string) => {
    handleChange(val)
    if (onChange) {
      onChange(val)
    }
  }

  const handleOptionSelect = (val: string, option: any) => {
    handleSelect(val, option)
  }

  const getPlaceholder = () => {
    if (placeholder) return placeholder
    return searchType === 'companyName'
      ? '请输入企业名称进行搜索'
      : '请输入统一社会信用代码进行搜索'
  }

  return (
    <AutoComplete
      value={value}
      placeholder={getPlaceholder()}
      options={options}
      onSearch={handleSearch}
      onSelect={handleOptionSelect}
      onChange={handleValueChange}
      disabled={disabled}
      style={style}
      className={className}
      filterOption={false}
      notFoundContent={
        loading ? (
          <div style={{ textAlign: 'center', padding: '12px' }}>
            <Spin size="small" />
            <span style={{ marginLeft: '8px' }}>搜索中...</span>
          </div>
        ) : value && options.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '12px', color: '#999' }}>暂无匹配结果</div>
        ) : null
      }
      dropdownRender={menu => (
        <div>
          {menu}
          {hasMore && (
            <div
              style={{
                padding: '8px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                borderTop: '1px solid #f0f0f0',
                color: '#1890ff',
              }}
              onClick={handleLoadMore}
            >
              {loading ? '加载中...' : '加载更多'}
            </div>
          )}
          {total > 0 && (
            <div
              style={{
                padding: '4px 16px',
                textAlign: 'center',
                fontSize: '12px',
                color: '#666',
                borderTop: total > options.length ? 'none' : '1px solid #f0f0f0',
              }}
            >
              共找到 {total} 条结果
            </div>
          )}
        </div>
      )}
    />
  )
}

export default CustomerAutoComplete
