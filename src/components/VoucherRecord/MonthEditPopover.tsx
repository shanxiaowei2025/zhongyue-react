import React, { useState, useEffect, useRef } from 'react'
import { Popover, Select, Input, Button, Form, message } from 'antd'
import { useVoucherRecordActions } from '../../hooks/useVoucherRecord'
import { useVoucherPermission } from '../../hooks/useVoucherPermission'
import {
  mapBackendStatusToFrontend,
  mapFrontendStatusToBackend,
  getStatusDisplay,
  getMonthName,
} from '../../utils/voucherRecord'
import type {
  VoucherRecordMonth,
  VoucherStatus,
  MonthStatusUpdateDto,
} from '../../types/voucherRecord'
import { VOUCHER_STATUS_MAP } from '../../types/voucherRecord'

const { TextArea } = Input

interface MonthEditPopoverProps {
  month: number
  year: number
  yearRecordId: number
  monthData?: VoucherRecordMonth
  children: React.ReactElement
  onUpdate?: () => void
}

const MonthEditPopover: React.FC<MonthEditPopoverProps> = ({
  month,
  year,
  yearRecordId,
  monthData,
  children,
  onUpdate,
}) => {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { batchUpdateMonthStatus } = useVoucherRecordActions()
  const { canEdit } = useVoucherPermission()
  const isMountedRef = useRef(true)

  // 使用useState管理表单数据
  const [formData, setFormData] = useState({
    status: 'not_set' as VoucherStatus,
    description: '',
  })

  // 组件挂载和卸载时管理状态
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 初始化表单数据
  useEffect(() => {
    if (open && monthData) {
      const currentStatus = mapBackendStatusToFrontend(monthData.status)
      setFormData({
        status: currentStatus,
        description: monthData.description || '',
      })
    } else if (open) {
      // 新建月度记录
      setFormData({
        status: 'not_set',
        description: '',
      })
    }
  }, [open, monthData])

  const handleSave = async () => {
    if (!canEdit) {
      message.error('您没有编辑权限')
      return
    }

    try {
      // 手动验证必填字段
      if (!formData.status) {
        message.error('请选择整理状态')
        return
      }

      if (!isMountedRef.current) {
        return
      }

      setSaving(true)

      const backendStatus = mapFrontendStatusToBackend(formData.status)

      const updateData: MonthStatusUpdateDto = {
        month,
        status: backendStatus,
        description: formData.description?.trim() || undefined,
      }

      const result = await batchUpdateMonthStatus(yearRecordId, [updateData])

      if (!isMountedRef.current) return
      setOpen(false)
      onUpdate?.()
      message.success('保存成功')
    } catch (error) {
      console.error('保存月度记录失败:', error)
      message.error('保存失败，请重试')
    } finally {
      if (isMountedRef.current) {
        setSaving(false)
      }
    }
  }

  const handleCancel = () => {
    setOpen(false)
    setFormData({
      status: 'not_set',
      description: '',
    })
  }

  const statusOptions = Object.entries(VOUCHER_STATUS_MAP).map(([key, value]) => ({
    value: key as VoucherStatus,
    label: (
      <div className="flex items-center gap-2">
        <span>{value.emoji}</span>
        <span>{value.label}</span>
      </div>
    ),
  }))

  const currentStatus = monthData ? mapBackendStatusToFrontend(monthData.status) : 'not_set'
  const statusDisplay = getStatusDisplay(currentStatus)

  const popoverContent = (
    <div className="w-72">
      <div className="mb-3 font-medium text-gray-800">
        {year}年{getMonthName(month)}凭证记录
      </div>

      <div>
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            整理状态 <span className="text-red-500">*</span>
          </label>
          <Select
            placeholder="请选择状态"
            options={statusOptions}
            disabled={!canEdit}
            value={formData.status}
            onChange={value => {
              setFormData(prev => ({ ...prev, status: value }))
            }}
            style={{ width: '100%' }}
          />
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">说明</label>
          <TextArea
            rows={3}
            placeholder="请输入具体说明..."
            maxLength={500}
            showCount
            disabled={!canEdit}
            value={formData.description}
            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button size="small" onClick={handleCancel}>
            取消
          </Button>
          <Button
            type="primary"
            size="small"
            loading={saving}
            onClick={handleSave}
            disabled={!canEdit}
          >
            保存
          </Button>
        </div>
      </div>

      {!canEdit && <div className="mt-2 text-xs text-gray-500">您没有编辑权限，只能查看</div>}
    </div>
  )

  // 安全的事件处理函数
  const handleChildClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // 调用原有的onClick处理函数
    if (React.isValidElement(children) && children.props) {
      const childProps = children.props as any
      if (typeof childProps.onClick === 'function') {
        childProps.onClick(e)
      }
    }
    // 只有在有编辑权限或存在月度数据时才打开弹出框
    if (canEdit || monthData) {
      setOpen(true)
    }
  }

  // 创建增强的子元素
  const enhancedChild = React.isValidElement(children) ? (
    <div
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'inline-block',
        width: '100%',
        ...(children.props as any)?.style,
      }}
      onClick={handleChildClick}
    >
      {children}
    </div>
  ) : (
    children
  )

  return (
    <Popover
      content={popoverContent}
      title={null}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="topLeft"
      overlayClassName="voucher-month-edit-popover"
      overlayStyle={{ maxWidth: '90vw' }}
    >
      {enhancedChild}
    </Popover>
  )
}

export default MonthEditPopover
