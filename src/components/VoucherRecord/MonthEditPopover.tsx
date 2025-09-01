import React, { useState, useEffect } from 'react'
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
  const [form] = Form.useForm()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { batchUpdateMonthStatus } = useVoucherRecordActions()
  const { canEdit } = useVoucherPermission()

  // 初始化表单数据
  useEffect(() => {
    if (open && monthData) {
      const currentStatus = mapBackendStatusToFrontend(monthData.status)
      form.setFieldsValue({
        status: currentStatus,
        description: monthData.description || '',
      })
    } else if (open) {
      // 新建月度记录
      form.setFieldsValue({
        status: 'not_set',
        description: '',
      })
    }
  }, [open, monthData, form])

  const handleSave = async () => {
    if (!canEdit) {
      message.error('您没有编辑权限')
      return
    }

    try {
      const values = await form.validateFields()
      setSaving(true)

      const updateData: MonthStatusUpdateDto = {
        month,
        status: mapFrontendStatusToBackend(values.status),
        description: values.description?.trim() || undefined,
      }

      await batchUpdateMonthStatus(yearRecordId, [updateData])
      setOpen(false)
      onUpdate?.()
    } catch (error) {
      console.error('保存月度记录失败:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setOpen(false)
    form.resetFields()
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

      <Form form={form} layout="vertical" size="small">
        <Form.Item
          name="status"
          label="整理状态"
          rules={[{ required: true, message: '请选择整理状态' }]}
        >
          <Select placeholder="请选择状态" options={statusOptions} disabled={!canEdit} />
        </Form.Item>

        <Form.Item name="description" label="说明">
          <TextArea
            rows={3}
            placeholder="请输入具体说明..."
            maxLength={500}
            showCount
            disabled={!canEdit}
          />
        </Form.Item>

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
      </Form>

      {!canEdit && <div className="mt-2 text-xs text-gray-500">您没有编辑权限，只能查看</div>}
    </div>
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
      {React.cloneElement(children as React.ReactElement<any>, {
        style: {
          ...(children.props as any)?.style,
          cursor: 'pointer',
          transition: 'all 0.2s',
        },
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation()
          ;(children.props as any)?.onClick?.(e)
          if (canEdit || monthData) {
            setOpen(true)
          }
        },
      })}
    </Popover>
  )
}

export default MonthEditPopover
