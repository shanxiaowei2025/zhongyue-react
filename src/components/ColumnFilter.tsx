import React, { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  Button,
  Checkbox,
  Input,
  InputNumber,
  Space,
  Divider,
  Empty,
} from 'antd'
import {
  FilterOutlined,
  SearchOutlined,
} from '@ant-design/icons'

export interface FilterOption {
  label: string
  value: any
  count?: number
}

export interface ColumnFilterProps {
  // 筛选类型
  type: 'text' | 'select' | 'number' | 'range'
  // 数据源
  data: any[]
  // 数据字段名
  dataIndex: string
  // 当前筛选值
  filteredValue?: any[]
  // 筛选变更回调
  onFilter: (filteredValue: any[] | null) => void
  // 自定义选项（用于select类型）
  options?: FilterOption[]
  // 格式化显示函数
  formatter?: (value: any) => string
  // 最大显示选项数量
  maxOptions?: number
}

const ColumnFilter: React.FC<ColumnFilterProps> = ({
  type,
  data,
  dataIndex,
  filteredValue = [],
  onFilter,
  options,
  formatter,
  maxOptions = 100,
}) => {
  const [visible, setVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedValues, setSelectedValues] = useState<any[]>(filteredValue)
  const [rangeMin, setRangeMin] = useState<number | null>(null)
  const [rangeMax, setRangeMax] = useState<number | null>(null)
  const [textFilterValue, setTextFilterValue] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })
  const [isComposing, setIsComposing] = useState(false)
  const [isUserInteracting, setIsUserInteracting] = useState(false)
  
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // 当外部筛选值变化时，同步内部状态
  useEffect(() => {
    // 如果用户正在交互，不要覆盖用户的选择
    if (isUserInteracting) {
      return
    }
    
    const newValues = filteredValue || []
    // 只有在值真正不同时才更新状态，避免无限循环
    setSelectedValues(prev => {
      const prevSorted = [...prev].sort()
      const newSorted = [...newValues].sort()
      if (JSON.stringify(prevSorted) !== JSON.stringify(newSorted)) {
        return newValues
      }
      return prev
    })
    
    if (type === 'text' && filteredValue && filteredValue.length > 0) {
      const newTextValue = String(filteredValue[0] || '')
      setTextFilterValue(prev => prev !== newTextValue ? newTextValue : prev)
    } else if (type === 'text') {
      setTextFilterValue(prev => prev !== '' ? '' : prev)
    }
  }, [filteredValue, type, isUserInteracting])

  // 计算下拉框位置
  const calculatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      })
    }
  }

  // 处理点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        visible &&
        dropdownRef.current &&
        buttonRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsUserInteracting(false) // 点击外部关闭时重置交互状态
        setVisible(false)
      }
    }

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('scroll', calculatePosition)
      window.addEventListener('resize', calculatePosition)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('scroll', calculatePosition)
      window.removeEventListener('resize', calculatePosition)
    }
  }, [visible])

  // 获取唯一值选项
  const uniqueOptions = useMemo(() => {
    if (options) {
      return options
    }

    const uniqueValues = new Map<any, number>()
    
    data.forEach(item => {
      const value = item[dataIndex]
      if (value !== null && value !== undefined && value !== '') {
        uniqueValues.set(value, (uniqueValues.get(value) || 0) + 1)
      }
    })

    return Array.from(uniqueValues.entries())
      .map(([value, count]) => ({
        label: formatter ? formatter(value) : String(value),
        value,
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(0, maxOptions)
  }, [data, dataIndex, options, formatter, maxOptions])

  // 筛选后的选项
  const filteredOptions = useMemo(() => {
    if (!searchText) return uniqueOptions
    
    return uniqueOptions.filter(option =>
      option.label.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [uniqueOptions, searchText])

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!visible) {
      calculatePosition()
      // 打开筛选框时，清空选择状态，让用户重新选择（替换而不是累加）
      setSelectedValues([])
      setSearchText('')
      setRangeMin(null)
      setRangeMax(null)
      setTextFilterValue('')
      setIsUserInteracting(false)
    } else {
      setIsUserInteracting(false) // 关闭时也重置交互状态
    }
    setVisible(!visible)
  }

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsUserInteracting(true)
    
    const allValues = filteredOptions.map(option => option.value)
    const allSelected = allValues.every(value => selectedValues.includes(value))
    
    if (allSelected) {
      // 如果全部已选中，则取消选择这些项
      setSelectedValues(prev => prev.filter(value => !allValues.includes(value)))
    } else {
      // 如果没有全部选中，则选中所有项
      setSelectedValues(prev => [...new Set([...prev, ...allValues])])
    }
  }

  const handleDeselectAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsUserInteracting(true)
    const currentFilteredValues = filteredOptions.map(option => option.value)
    setSelectedValues(prev => prev.filter(value => !currentFilteredValues.includes(value)))
  }

  const handleCheckboxChange = (value: any) => {
    return (e: any) => {
      e.stopPropagation()
      setIsUserInteracting(true)
      const checked = e.target.checked
      if (checked) {
        setSelectedValues(prev => {
          if (!prev.includes(value)) {
            return [...prev, value]
          }
          return prev
        })
      } else {
        setSelectedValues(prev => prev.filter(v => v !== value))
      }
    }
  }

  const handleConfirm = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (type === 'text') {
      const trimmedValue = textFilterValue.trim()
      onFilter(trimmedValue ? [trimmedValue] : null)
    } else if (type === 'range') {
      const rangeFilter = []
      if (rangeMin !== null) rangeFilter.push(['>=', rangeMin])
      if (rangeMax !== null) rangeFilter.push(['<=', rangeMax])
      onFilter(rangeFilter.length > 0 ? rangeFilter : null)
    } else {
      onFilter(selectedValues.length > 0 ? selectedValues : null)
    }
    setIsUserInteracting(false)
    setVisible(false)
  }

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedValues([])
    setSearchText('')
    setRangeMin(null)
    setRangeMax(null)
    setTextFilterValue('')
    setIsUserInteracting(false)
    onFilter(null)
    setVisible(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    setTextFilterValue(e.target.value)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    setSearchText(e.target.value)
  }

  // 中文输入法支持
  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  const handleCompositionEnd = () => {
    setIsComposing(false)
  }

  const renderTextFilter = () => (
    <div 
      ref={dropdownRef}
      style={{ 
        padding: 12, 
        width: 280, 
        backgroundColor: '#fff', 
        borderRadius: 8, 
        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
        border: '1px solid #d9d9d9'
      }}
    >
      <Input
        placeholder="输入筛选内容"
        value={textFilterValue}
        onChange={handleInputChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        onPressEnter={() => {
          if (!isComposing) {
            handleConfirm({} as React.MouseEvent<Element>)
          }
        }}
        suffix={<SearchOutlined />}
        autoFocus
        style={{ marginBottom: 12 }}
      />
      <Space>
        <Button 
          size="small" 
          type="primary" 
          onClick={handleConfirm}
        >
          确定
        </Button>
        <Button 
          size="small" 
          onClick={handleReset}
          disabled={!textFilterValue.trim()}
        >
          重置
        </Button>
      </Space>
    </div>
  )

  const renderSelectFilter = () => (
    <div 
      ref={dropdownRef}
      style={{ 
        padding: 12, 
        width: 320, 
        maxHeight: 420, 
        backgroundColor: '#fff', 
        borderRadius: 8, 
        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
        border: '1px solid #d9d9d9',
        overflow: 'hidden'
      }}
    >
      <Input
        placeholder="搜索选项..."
        value={searchText}
        onChange={handleSearchChange}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        suffix={<SearchOutlined />}
        autoFocus
        style={{ marginBottom: 12 }}
      />
      
      <div style={{ marginBottom: 12 }}>
        <Space>
                  <Button 
          size="small" 
          onClick={handleSelectAll}
          disabled={filteredOptions.length === 0}
        >
            {(() => {
              const allValues = filteredOptions.map(option => option.value)
              const allSelected = allValues.every(value => selectedValues.includes(value))
              return allSelected ? '取消全选' : `全选 ${filteredOptions.length > 0 ? `(${filteredOptions.length})` : ''}`
            })()}
          </Button>
                  <Button 
          size="small" 
          onClick={handleDeselectAll}
          disabled={selectedValues.filter(value => 
            filteredOptions.some(option => option.value === value)
          ).length === 0}
        >
            清空
          </Button>
        </Space>
        {selectedValues.length > 0 && (
          <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
            已选择 {selectedValues.length} 项
          </div>
        )}
      </div>

      <Divider style={{ margin: '8px 0' }} />

      <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 12 }}>
        {filteredOptions.length > 0 ? (
          filteredOptions.map(option => {
            const isChecked = selectedValues.includes(option.value)
            return (
              <div 
                key={String(option.value)} 
                style={{ padding: '6px 0' }}
              >
                <Checkbox
                  checked={isChecked}
                  onChange={handleCheckboxChange(option.value)}
                >
                  <span style={{ fontSize: '13px' }}>
                    {option.label} {option.count && `(${option.count})`}
                  </span>
                </Checkbox>
              </div>
            )
          })
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配项" />
        )}
      </div>
      
      <Divider style={{ margin: '8px 0' }} />
      
      <Space>
        <Button 
          size="small" 
          type="primary" 
          onClick={handleConfirm}
        >
          确定
        </Button>
        <Button 
          size="small" 
          onClick={handleReset}
          disabled={selectedValues.length === 0}
        >
          重置
        </Button>
      </Space>
    </div>
  )

  const renderRangeFilter = () => (
    <div 
      ref={dropdownRef}
      style={{ 
        padding: 12, 
        width: 280, 
        backgroundColor: '#fff', 
        borderRadius: 8, 
        boxShadow: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
        border: '1px solid #d9d9d9'
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 6, fontSize: '13px', color: '#666' }}>最小值</div>
        <InputNumber
          placeholder="最小值"
          value={rangeMin}
          onChange={setRangeMin}
          style={{ width: '100%' }}
          precision={2}
          onClick={e => e.stopPropagation()}
        />
      </div>
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ marginBottom: 6, fontSize: '13px', color: '#666' }}>最大值</div>
        <InputNumber
          placeholder="最大值"
          value={rangeMax}
          onChange={setRangeMax}
          style={{ width: '100%' }}
          precision={2}
          onClick={e => e.stopPropagation()}
        />
      </div>

      <Divider style={{ margin: '8px 0' }} />
      
      <Space>
        <Button 
          size="small" 
          type="primary" 
          onClick={handleConfirm}
        >
          确定
        </Button>
        <Button 
          size="small" 
          onClick={handleReset}
          disabled={rangeMin === null && rangeMax === null}
        >
          重置
        </Button>
      </Space>
    </div>
  )

  const renderFilterContent = () => {
    switch (type) {
      case 'text':
        return renderTextFilter()
      case 'range':
        return renderRangeFilter()
      case 'select':
      case 'number':
      default:
        return renderSelectFilter()
    }
  }

  const hasFilter = filteredValue && filteredValue.length > 0

  return (
    <>
      <Button
        ref={buttonRef}
        type="text"
        size="small"
        icon={<FilterOutlined />}
        style={{
          color: hasFilter ? '#1890ff' : visible ? '#1890ff' : '#999',
          backgroundColor: hasFilter ? '#e6f7ff' : visible ? '#f0f0f0' : 'transparent',
          padding: 0,
          border: hasFilter ? '1px solid #91d5ff' : 'none',
          boxShadow: 'none',
          borderRadius: '2px',
        }}
        onClick={handleToggle}
      />
      
      {visible && createPortal(
        <div
          style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            zIndex: 1050,
          }}
        >
          {renderFilterContent()}
        </div>,
        document.body
      )}
    </>
  )
}

export default ColumnFilter 