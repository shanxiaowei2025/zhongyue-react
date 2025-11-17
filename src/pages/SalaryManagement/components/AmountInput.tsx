import React, { useState } from 'react'
import { InputNumber, InputNumberProps } from 'antd'

interface AmountInputProps extends Omit<InputNumberProps, 'formatter' | 'parser'> {
  showCurrency?: boolean
  currency?: string
  precision?: number
}

const AmountInput: React.FC<AmountInputProps> = ({
  showCurrency = true,
  currency = '¥',
  precision = 2,
  ...props
}) => {
  // 跟踪是否正在输入（用于区分输入中和失焦后的格式化行为）
  const [isFocused, setIsFocused] = useState(false)

  const formatter = (value: string | number | undefined): string => {
    if (value === null || value === undefined || value === '') return ''

    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return ''

    // 如果正在输入（聚焦状态），使用更宽松的格式化，允许用户继续输入
    // 如果已失焦，使用完整的格式化
    if (isFocused) {
      // 输入中：只添加货币符号，不强制小数位数，让用户自由输入
      // 保持原始数值，不进行格式化，避免干扰输入
      const numStr = numValue.toString()
      return showCurrency ? `${currency} ${numStr}` : numStr
    } else {
      // 失焦后：完整格式化，包括千分位和小数点
      const formatted = numValue.toLocaleString('zh-CN', {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      })
      return showCurrency ? `${currency} ${formatted}` : formatted
    }
  }

  const parser = (value: string | undefined): number | string => {
    if (!value) return ''

    // 移除货币符号和空格
    let parsed = value.replace(/[^\d.-]/g, '')

    // 如果解析后为空，返回空字符串
    if (parsed === '' || parsed === '-') return ''

    // 确保只有一个小数点
    const parts = parsed.split('.')
    if (parts.length > 2) {
      parsed = parts[0] + '.' + parts.slice(1).join('')
    }

    // 转换为数字
    const numValue = parseFloat(parsed)
    
    // 如果正在输入，允许返回字符串格式（用于连续输入）
    // 如果已失焦，返回数字（用于最终格式化）
    if (isFocused && isNaN(numValue)) {
      // 输入中且无法解析为数字，返回原字符串（允许用户继续输入）
      return parsed
    }
    
    return isNaN(numValue) ? '' : numValue
  }

  // 处理聚焦事件
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    if (props.onFocus) {
      props.onFocus(e)
    }
  }

  // 处理失焦事件
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    // 失焦后，确保值被正确格式化
    if (props.onBlur) {
      props.onBlur(e)
    }
  }

  return (
    <InputNumber
      {...props}
      formatter={formatter}
      parser={parser}
      precision={precision}
      style={{ width: '100%', ...props.style }}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  )
}

export default AmountInput
