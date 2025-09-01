import React, { useState } from 'react'
import { Button, Space, Popconfirm, message, Tooltip } from 'antd'
import { useVoucherRecordActions } from '../../hooks/useVoucherRecord'
import { useVoucherPermission } from '../../hooks/useVoucherPermission'
import { BATCH_OPERATION_CONFIGS, generateBatchUpdateData } from '../../utils/voucherRecord'
import type { BatchOperationType } from '../../types/voucherRecord'

interface BatchOperationsProps {
  yearRecordId: number
  year: number
  onUpdate?: () => void
  disabled?: boolean
  size?: 'small' | 'middle' | 'large'
  className?: string
}

const BatchOperations: React.FC<BatchOperationsProps> = ({
  yearRecordId,
  year,
  onUpdate,
  disabled = false,
  size = 'small',
  className = '',
}) => {
  const [loading, setLoading] = useState<BatchOperationType | null>(null)
  const { batchUpdateMonthStatus } = useVoucherRecordActions()
  const { canEdit } = useVoucherPermission()

  const handleBatchOperation = async (operationType: BatchOperationType) => {
    if (!canEdit) {
      message.error('您没有编辑权限')
      return
    }

    setLoading(operationType)
    try {
      const updateData = generateBatchUpdateData(operationType)
      await batchUpdateMonthStatus(yearRecordId, updateData)
      onUpdate?.()
    } catch (error) {
      console.error('批量操作失败:', error)
    } finally {
      setLoading(null)
    }
  }

  const isDisabled = disabled || !canEdit

  return (
    <div className={`batch-operations ${className}`}>
      <div className="text-xs text-gray-500 mb-2">快速设置：</div>
      <Space wrap size="small">
        {BATCH_OPERATION_CONFIGS.map(config => (
          <Tooltip
            key={config.type}
            title={isDisabled ? '您没有编辑权限' : `将所有月份设置为${config.label}`}
          >
            <Popconfirm
              title={`确认批量操作`}
              description={`确定要将${year}年所有月份设置为"${config.label}"吗？`}
              onConfirm={() => handleBatchOperation(config.type)}
              okText="确定"
              cancelText="取消"
              disabled={isDisabled}
            >
              <Button
                size={size}
                loading={loading === config.type}
                disabled={isDisabled}
                style={{
                  borderColor: config.color,
                  color: config.color,
                }}
                className="hover:bg-opacity-10"
                onMouseEnter={e => {
                  if (!isDisabled) {
                    e.currentTarget.style.backgroundColor = `${config.color}15`
                  }
                }}
                onMouseLeave={e => {
                  if (!isDisabled) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {config.label}
              </Button>
            </Popconfirm>
          </Tooltip>
        ))}
      </Space>

      {!canEdit && (
        <div className="text-xs text-gray-400 mt-2">您没有编辑权限，无法进行批量操作</div>
      )}
    </div>
  )
}

export default BatchOperations
