import React from 'react'
import { Card, Space, Select, Input, DatePicker, InputNumber } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { FilterBarProps, FilterConfig } from '../types/advancedServerTable'

const { Search } = Input
const { RangePicker } = DatePicker
const { Option } = Select

const FilterBar: React.FC<FilterBarProps> = ({ filters, values, onChange }) => {
  const renderFilter = (filter: FilterConfig) => {
    const { key, type, label, placeholder, options, width, allowClear } = filter
    const value = values[key]

    switch (type) {
      case 'select':
        return (
          <div key={key}>
            <span style={{ marginRight: 8 }}>{label}：</span>
            <Select
              value={value}
              onChange={val => onChange(key, val)}
              style={{ width: width || 120 }}
              placeholder={placeholder}
              allowClear={allowClear}
            >
              {options?.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </div>
        )

      case 'search':
        return (
          <div key={key}>
            <Search
              placeholder={placeholder || `搜索${label}`}
              allowClear
              style={{ width: width || 300 }}
              value={value}
              onSearch={val => onChange(key, val)}
              onChange={e => {
                if (!e.target.value) {
                  onChange(key, '')
                }
              }}
              prefix={<SearchOutlined />}
            />
          </div>
        )

      case 'dateRange':
        return (
          <div key={key}>
            <span style={{ marginRight: 8 }}>{label}：</span>
            <RangePicker
              value={value && Array.isArray(value) ? [dayjs(value[0]), dayjs(value[1])] : null}
              onChange={dates => {
                if (dates && dates[0] && dates[1]) {
                  onChange(key, [dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')])
                } else {
                  onChange(key, null)
                }
              }}
              format="YYYY-MM-DD"
              allowClear
            />
          </div>
        )

      case 'month':
        return (
          <div key={key}>
            <span style={{ marginRight: 8 }}>{label}：</span>
            <DatePicker
              value={value ? dayjs(value) : null}
              onChange={date => {
                onChange(key, date ? date.format('YYYY-MM') : null)
              }}
              picker="month"
              format="YYYY-MM"
              placeholder={placeholder || `选择${label}`}
              allowClear
            />
          </div>
        )

      case 'year':
        return (
          <div key={key}>
            <span style={{ marginRight: 8 }}>{label}：</span>
            <DatePicker
              value={value ? dayjs(value.toString()) : null}
              onChange={date => {
                onChange(key, date ? date.year() : null)
              }}
              picker="year"
              format="YYYY"
              placeholder={placeholder || `选择${label}`}
              allowClear={allowClear}
              disabledDate={current => current && current.year() > new Date().getFullYear()}
            />
          </div>
        )

      case 'number':
        return (
          <div key={key}>
            <span style={{ marginRight: 8 }}>{label}：</span>
            <InputNumber
              value={value}
              onChange={val => onChange(key, val)}
              placeholder={placeholder}
              style={{ width: width || 120 }}
            />
          </div>
        )

      default:
        return null
    }
  }

  if (filters.length === 0) {
    return null
  }

  return (
    <Card style={{ marginBottom: 24, borderRadius: 16 }}>
      <Space size="large" wrap>
        {filters.map(renderFilter)}
      </Space>
    </Card>
  )
}

export default FilterBar
