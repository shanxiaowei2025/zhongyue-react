import React from 'react'
import { DatePicker, Select, Space } from 'antd'
import { CalendarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Option } = Select

interface DateRangeFilterProps {
  value?: {
    month?: string
    year?: number
  }
  onChange?: (value: { month?: string; year?: number }) => void
  showYear?: boolean
  showMonth?: boolean
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value = {},
  onChange,
  showYear = true,
  showMonth = true,
}) => {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  // 生成年份选项（最近5年）
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  // 生成月份选项
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1}月`,
  }))

  const handleYearChange = (year: number) => {
    onChange?.({
      ...value,
      year,
    })
  }

  const handleMonthChange = (month: number) => {
    const monthStr = `${value.year || currentYear}-${month.toString().padStart(2, '0')}`
    onChange?.({
      ...value,
      month: monthStr,
    })
  }

  const handleMonthPickerChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      const monthStr = date.format('YYYY-MM')
      onChange?.({
        ...value,
        month: monthStr,
        year: date.year(),
      })
    }
  }

  return (
    <Space>
      <CalendarOutlined style={{ color: '#8c8c8c' }} />

      {showYear && showMonth ? (
        // 月份选择器（包含年月）
        <DatePicker
          picker="month"
          placeholder="选择月份"
          value={value.month ? dayjs(value.month) : dayjs()}
          onChange={handleMonthPickerChange}
          allowClear={false}
          style={{ width: 120 }}
        />
      ) : (
        <Space>
          {showYear && (
            <Select
              placeholder="选择年份"
              value={value.year || currentYear}
              onChange={handleYearChange}
              style={{ width: 100 }}
            >
              {yearOptions.map(year => (
                <Option key={year} value={year}>
                  {year}年
                </Option>
              ))}
            </Select>
          )}

          {showMonth && (
            <Select
              placeholder="选择月份"
              value={value.month ? parseInt(value.month.split('-')[1]) : currentMonth}
              onChange={handleMonthChange}
              style={{ width: 80 }}
            >
              {monthOptions.map(month => (
                <Option key={month.value} value={month.value}>
                  {month.label}
                </Option>
              ))}
            </Select>
          )}
        </Space>
      )}
    </Space>
  )
}

export default DateRangeFilter
