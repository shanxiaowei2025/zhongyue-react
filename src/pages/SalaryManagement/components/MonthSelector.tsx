import React from 'react'
import { DatePicker, Button, Space } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'

interface MonthSelectorProps {
  value: string // YYYY-MM 格式
  onChange: (yearMonth: string) => void
  disabled?: boolean
  allowClear?: boolean
  placeholder?: string
  showQuickButtons?: boolean
}

const MonthSelector: React.FC<MonthSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  allowClear = false,
  placeholder = '选择月份',
  showQuickButtons = true,
}) => {
  const currentValue = value ? dayjs(value, 'YYYY-MM') : null

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      onChange(date.format('YYYY-MM'))
    } else if (allowClear) {
      onChange('')
    }
  }

  const handlePrevMonth = () => {
    const newDate = currentValue ? currentValue.subtract(1, 'month') : dayjs().subtract(1, 'month')
    onChange(newDate.format('YYYY-MM'))
  }

  const handleNextMonth = () => {
    const newDate = currentValue ? currentValue.add(1, 'month') : dayjs().add(1, 'month')
    onChange(newDate.format('YYYY-MM'))
  }

  const handleCurrentMonth = () => {
    onChange(dayjs().format('YYYY-MM'))
  }

  return (
    <Space.Compact>
      {showQuickButtons && (
        <Button
          icon={<LeftOutlined />}
          onClick={handlePrevMonth}
          disabled={disabled}
          title="上月"
        />
      )}

      <DatePicker
        picker="month"
        value={currentValue}
        onChange={handleDateChange}
        disabled={disabled}
        allowClear={allowClear}
        placeholder={placeholder}
        format="YYYY年MM月"
        style={{ minWidth: '120px' }}
      />

      {showQuickButtons && (
        <>
          <Button
            icon={<RightOutlined />}
            onClick={handleNextMonth}
            disabled={disabled}
            title="下月"
          />
          <Button onClick={handleCurrentMonth} disabled={disabled} type="link" size="small">
            本月
          </Button>
        </>
      )}
    </Space.Compact>
  )
}

export default MonthSelector
