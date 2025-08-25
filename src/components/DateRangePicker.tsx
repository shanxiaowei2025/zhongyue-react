import React, { useState, useEffect } from 'react'
import { DatePicker, Space, Popconfirm, Form } from 'antd'
import type { Dayjs } from 'dayjs'

interface DateRangePickerProps {
  startValue?: Dayjs | null
  endValue?: Dayjs | null
  onStartChange?: (value: Dayjs | null) => void
  onEndChange?: (value: Dayjs | null) => void
  startPlaceholder?: string
  endPlaceholder?: string
  startFieldName?: string
  style?: React.CSSProperties
  // RestrictedDatePicker 兼容属性
  startMode?: 'add' | 'edit'
  startHasPermission?: boolean
  startHasAutoFillValue?: boolean
  // 是否启用一年期限检查
  enableYearCheck?: boolean
  // 新增：表单字段名
  startFieldName_formField?: string
  endFieldName_formField?: string
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  startPlaceholder = '开始日期',
  endPlaceholder = '结束日期',
  startFieldName = '开始日期',
  style,
  startMode = 'add',
  startHasPermission = true,
  startHasAutoFillValue = false,
  enableYearCheck = true,
  startFieldName_formField,
  endFieldName_formField,
}) => {
  const [showYearWarning, setShowYearWarning] = useState(false)
  // 跟踪用户是否手动修改过日期
  const [userHasModified, setUserHasModified] = useState(false)

  // 获取表单实例
  const form = Form.useFormInstance()

  // 计算最终是否受限（与原 RestrictedDatePicker 逻辑一致）
  const finalStartIsRestricted =
    startMode === 'add' ? startHasAutoFillValue : !startHasPermission || startHasAutoFillValue

  // 开始日期的禁用日期函数
  const disabledStartDate = (current: Dayjs) => {
    // 如果有结束日期，开始日期不能晚于结束日期
    if (endValue && current.isAfter(endValue, 'month')) {
      return true
    }

    // 如果是受限模式，只允许选择相同年份的月份
    if (finalStartIsRestricted && startValue) {
      return current.year() !== startValue.year()
    }

    return false
  }

  // 结束日期的禁用日期函数
  const disabledEndDate = (current: Dayjs) => {
    if (!startValue) {
      return false
    }
    // 结束日期不能早于开始日期
    return current.isBefore(startValue, 'month')
  }

  // 生成开始日期提示信息
  const getStartTooltipTitle = () => {
    if (startMode === 'add' && startHasAutoFillValue) {
      return `该${startFieldName}已根据历史数据自动填写，年份不可修改，不可清空`
    }
    if (startMode === 'edit' && !startHasPermission) {
      return `您没有完全编辑权限，该${startFieldName}的年份不可修改，不可清空`
    }
    if (startMode === 'edit' && startHasAutoFillValue) {
      return `该${startFieldName}已根据历史数据自动填写，年份不可修改，不可清空`
    }
    return `该${startFieldName}年份不可修改，不可清空`
  }

  // 检查日期范围是否小于11个月
  const checkDateRange = (
    start: Dayjs | null | undefined,
    end: Dayjs | null | undefined,
    isUserAction: boolean = false
  ) => {
    if (!enableYearCheck || !start || !end) {
      setShowYearWarning(false)
      return
    }

    // 只有在用户手动操作时才显示警告
    if (!isUserAction && !userHasModified) {
      return
    }

    const monthsDiff = end.diff(start, 'month', true)
    setShowYearWarning(monthsDiff < 11)
  }

  // 处理开始日期变化
  const handleStartChange = (value: Dayjs | null) => {
    // 标记用户已手动修改
    setUserHasModified(true)

    // 同时更新表单字段和回调
    if (startFieldName_formField && form) {
      form.setFieldValue(startFieldName_formField, value)
    }
    onStartChange?.(value)

    // 如果结束日期已存在，检查范围（用户操作）
    if (value && endValue) {
      checkDateRange(value, endValue, true)
    }
  }

  // 处理结束日期变化
  const handleEndChange = (value: Dayjs | null) => {
    // 标记用户已手动修改
    setUserHasModified(true)

    // 同时更新表单字段和回调
    if (endFieldName_formField && form) {
      form.setFieldValue(endFieldName_formField, value)
    }
    onEndChange?.(value)

    // 如果开始日期已存在，检查范围（用户操作）
    if (startValue && value) {
      checkDateRange(startValue, value, true)
    }
  }

  // 当外部值变化时检查日期范围（不触发警告，仅用于非用户操作的情况）
  useEffect(() => {
    // 不传递 isUserAction 参数，这样就不会在初始化时显示警告
    checkDateRange(startValue, endValue, false)
  }, [startValue, endValue, enableYearCheck])

  const startDatePicker = (
    <DatePicker
      value={startValue}
      onChange={handleStartChange}
      placeholder={startPlaceholder}
      style={{ width: '100%' }}
      disabledDate={disabledStartDate}
      picker="month"
      allowClear={!finalStartIsRestricted}
      format="YYYY-MM"
    />
  )

  const endDatePicker = (
    <DatePicker
      value={endValue}
      onChange={handleEndChange}
      placeholder={endPlaceholder}
      style={{ width: '100%' }}
      disabledDate={disabledEndDate}
      picker="month"
      format="YYYY-MM"
    />
  )

  const endDatePickerWithConfirm = showYearWarning ? (
    <Popconfirm
      title="日期范围提醒"
      description="您提交的日期低于1年，请再次核对"
      okText="确认"
      cancelText="修改"
      onConfirm={() => {
        // 用户确认，隐藏警告
        setShowYearWarning(false)
      }}
      onCancel={() => {
        // 用户选择修改，清空结束日期
        onEndChange?.(null)
        setShowYearWarning(false)
      }}
      open={showYearWarning}
    >
      {endDatePicker}
    </Popconfirm>
  ) : (
    endDatePicker
  )

  return (
    <>
      {/* 隐藏的表单项用于正确注册字段到 Ant Design Form 系统 */}
      {startFieldName_formField && (
        <Form.Item name={startFieldName_formField} style={{ display: 'none' }}>
          <input type="hidden" />
        </Form.Item>
      )}
      {endFieldName_formField && (
        <Form.Item name={endFieldName_formField} style={{ display: 'none' }}>
          <input type="hidden" />
        </Form.Item>
      )}

      <Space style={style}>
        {finalStartIsRestricted ? (
          <div title={getStartTooltipTitle()}>{startDatePicker}</div>
        ) : (
          startDatePicker
        )}
        <span>至</span>
        {endDatePickerWithConfirm}
      </Space>
    </>
  )
}

export default DateRangePicker
