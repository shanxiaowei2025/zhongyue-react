import React, { useState, useEffect, useRef } from 'react'
import { Popover, Select, Input, Button, Space, message } from 'antd'
import {
  mapBackendStatusToFrontend,
  mapFrontendStatusToBackend,
  getStatusDisplay,
  getMonthName,
} from '../../utils/voucherRecord'
import type { VoucherRecordMonth, VoucherStatus } from '../../types/voucherRecord'
import { VOUCHER_STATUS_MAP } from '../../types/voucherRecord'

const { TextArea } = Input

interface MonthEditPopoverProps {
  month: number
  year: number
  yearRecordId: number
  monthData?: { status: VoucherStatus; description?: string }
  children: React.ReactElement
  onUpdate: (monthData: { status: string; description?: string }) => Promise<void>
  disabled?: boolean
}

const MonthEditPopover: React.FC<MonthEditPopoverProps> = ({
  month,
  year,
  yearRecordId,
  monthData,
  children,
  onUpdate,
  disabled = false,
}) => {
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState<VoucherStatus>('not_set')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const hasInitialized = useRef(false)

  // 初始化表单数据 - 只在弹窗首次打开时初始化
  useEffect(() => {
    if (visible && !hasInitialized.current) {
      hasInitialized.current = true
      // 弹窗打开时初始化数据
      if (monthData) {
        setStatus(monthData.status)
        setDescription(monthData.description || '')
      } else {
        setStatus('not_set')
        setDescription('')
      }
    } else if (!visible) {
      // 弹窗关闭时重置初始化标记
      hasInitialized.current = false
    }
  }, [visible, monthData])

  const handleSave = async () => {
    try {
      setSaving(true)

      // 准备更新数据
      const updateData = {
        status: mapFrontendStatusToBackend(status),
        description: description.trim(),
      }

      await onUpdate(updateData)
      setVisible(false)
      message.success('月份状态更新成功')
    } catch (error) {
      console.error('更新月份状态失败:', error)
      message.error('更新失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    // 重置表单到初始状态
    if (monthData) {
      setStatus(monthData.status)
      setDescription(monthData.description || '')
    } else {
      setStatus('not_set')
      setDescription('')
    }
    setVisible(false)
  }

  const content = (
    <div className="w-64 p-2">
      <div className="mb-3">
        <div className="text-sm font-medium text-gray-900 mb-2">
          {year}年{getMonthName(month)}状态
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">整理状态</label>
            <Select value={status} onChange={setStatus} className="w-full" size="small">
              {Object.entries(VOUCHER_STATUS_MAP).map(([key, value]) => (
                <Select.Option key={key} value={key}>
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: value.color }}
                    />
                    {value.label}
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">说明</label>
            <TextArea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="请输入说明（可选）"
              rows={3}
              maxLength={200}
              size="small"
              style={{ resize: 'none' }}
            />
            <div className="text-xs text-gray-400 mt-1">{description.length}/200</div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-2 border-t">
        <Button size="small" onClick={handleCancel} disabled={saving}>
          取消
        </Button>
        <Button type="primary" size="small" onClick={handleSave} loading={saving}>
          保存
        </Button>
      </div>
    </div>
  )

  return (
    <Popover
      content={content}
      title={null}
      trigger={disabled ? [] : 'click'}
      placement="topLeft"
      open={visible}
      onOpenChange={disabled ? undefined : setVisible}
      destroyTooltipOnHide
    >
      {children}
    </Popover>
  )
}

export default MonthEditPopover
