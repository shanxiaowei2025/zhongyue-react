import React from 'react'
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
  const formatter = (value: string | number | undefined): string => {
    if (!value) return ''

    const numValue = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(numValue)) return ''

    const formatted = numValue.toLocaleString('zh-CN', {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    })

    return showCurrency ? `${currency} ${formatted}` : formatted
  }

  const parser = (value: string | undefined): string => {
    if (!value) return ''

    // 移除货币符号和空格
    let parsed = value.replace(/[^\d.-]/g, '')

    // 确保只有一个小数点
    const parts = parsed.split('.')
    if (parts.length > 2) {
      parsed = parts[0] + '.' + parts.slice(1).join('')
    }

    return parsed
  }

  return (
    <InputNumber
      {...props}
      formatter={formatter}
      parser={parser}
      precision={precision}
      style={{ width: '100%', ...props.style }}
    />
  )
}

export default AmountInput
