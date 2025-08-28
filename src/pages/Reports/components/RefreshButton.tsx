import React from 'react'
import { Button, Tooltip } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'

interface RefreshButtonProps {
  onRefresh?: () => void
  loading?: boolean
  disabled?: boolean
}

const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  loading = false,
  disabled = false,
}) => {
  return (
    <Tooltip title="刷新数据">
      <Button
        icon={<ReloadOutlined spin={loading} />}
        onClick={onRefresh}
        loading={loading}
        disabled={disabled}
      >
        刷新
      </Button>
    </Tooltip>
  )
}

export default RefreshButton
