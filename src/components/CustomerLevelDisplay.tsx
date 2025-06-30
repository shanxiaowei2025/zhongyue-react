import React from 'react'
import { Popover } from 'antd'
import { getCustomerLevelColor } from '../utils/customerLevelTips'
import CustomerLevelTipComponent from './CustomerLevelTip'

interface CustomerLevelDisplayProps {
  level?: string | null
  showPopover?: boolean
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom'
  maxWidth?: number
  className?: string
  style?: React.CSSProperties
}

const CustomerLevelDisplay: React.FC<CustomerLevelDisplayProps> = ({
  level,
  showPopover = true,
  placement = 'right',
  maxWidth,
  className = '',
  style = {}
}) => {
  // 如果没有分级信息，显示 "-"
  if (!level) {
    return (
      <span 
        className={className}
        style={{
          color: '#999',
          ...style
        }}
      >
        -
      </span>
    )
  }

  const levelColor = getCustomerLevelColor(level)
  
  const spanStyle: React.CSSProperties = {
    color: levelColor,
    fontWeight: 'bold',
    cursor: showPopover ? 'help' : 'default',
    ...style
  }

  // 如果设置了最大宽度，添加文本溢出样式
  if (maxWidth) {
    spanStyle.maxWidth = maxWidth
    spanStyle.display = 'inline-block'
    spanStyle.whiteSpace = 'nowrap'
    spanStyle.overflow = 'hidden'
    spanStyle.textOverflow = 'ellipsis'
  }

  const levelSpan = (
    <span 
      className={className}
      style={spanStyle}
      title={level}
    >
      {level}
    </span>
  )

  // 如果不显示 Popover，直接返回 span
  if (!showPopover) {
    return levelSpan
  }

  // 显示带 Popover 的版本
  return (
    <Popover
      content={<CustomerLevelTipComponent level={level} />}
      trigger={['hover', 'click']}
      placement={placement}
      overlayStyle={{ maxWidth: '90vw' }}
    >
      {levelSpan}
    </Popover>
  )
}

export default CustomerLevelDisplay 