import React, { useState, useEffect, useRef } from 'react'
import { Card, Select, Button, DatePicker, Form, Input, Space, Spin, Empty, message } from 'antd'
import { PlusOutlined, ExportOutlined, EditOutlined } from '@ant-design/icons'
import { useCustomerVoucherRecords, useVoucherRecordActions } from '../../hooks/useVoucherRecord'
import { useVoucherPermission } from '../../hooks/useVoucherPermission'
import MonthEditPopover from './MonthEditPopover'
import BatchOperations from './BatchOperations'
import {
  mapBackendStatusToFrontend,
  getStatusDisplay,
  getMonthName,
  calculateCompletionRate,
} from '../../utils/voucherRecord'
import type { VoucherRecordYear, CreateVoucherRecordYearDto } from '../../types/voucherRecord'
import dayjs from 'dayjs'

const { TextArea } = Input

interface VoucherRecordCompactProps {
  customerId: number
  onExport?: (customerId: number, year?: number) => void
  exportLoading?: boolean
}

const VoucherRecordCompact: React.FC<VoucherRecordCompactProps> = ({
  customerId,
  onExport,
  exportLoading = false,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [currentRecord, setCurrentRecord] = useState<VoucherRecordYear | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const isMountedRef = useRef(true)

  // 使用useState管理表单数据，替代Form实例
  const [formData, setFormData] = useState({
    storageLocation: '',
    handler: '',
    withdrawalRecord: '',
    generalRemarks: '',
  })

  const { records, isLoading, mutate } = useCustomerVoucherRecords(customerId)
  const { createYear, updateYear, loading } = useVoucherRecordActions()
  const { canView, canCreate, canEdit, canExport } = useVoucherPermission()

  // 组件挂载和卸载时管理状态
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // 当选择年份变化时，更新当前记录
  useEffect(() => {
    const record = records.find(r => r.year === selectedYear)
    setCurrentRecord(record || null)
    setIsCreating(!record)

    if (record) {
      // 更新表单数据
      setFormData({
        storageLocation: record.storageLocation || '',
        handler: record.handler || '',
        withdrawalRecord: record.withdrawalRecord || '',
        generalRemarks: record.generalRemarks || '',
      })
    } else {
      // 重置表单数据
      setFormData({
        storageLocation: '',
        handler: '',
        withdrawalRecord: '',
        generalRemarks: '',
      })
    }
  }, [selectedYear, records])

  // 权限检查
  if (!canView) {
    return (
      <Card size="small">
        <Empty description="您没有查看凭证记录的权限" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    )
  }

  const handleCreateYear = async () => {
    if (!canCreate) {
      message.error('您没有创建权限')
      return
    }

    try {
      if (!isMountedRef.current) return

      const createData: CreateVoucherRecordYearDto = {
        customerId,
        year: selectedYear,
        ...formData,
      }

      await createYear(createData)
      if (!isMountedRef.current) return
      await mutate()
    } catch (error) {
      console.error('创建年度记录失败:', error)
    }
  }

  const handleUpdateYear = async () => {
    if (!canEdit || !currentRecord) {
      message.error('您没有编辑权限')
      return
    }

    try {
      if (!isMountedRef.current) return

      await updateYear(currentRecord.id, formData)
      if (!isMountedRef.current) return
      await mutate()
    } catch (error) {
      console.error('更新年度记录失败:', error)
    }
  }

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedYear(date.year())
    }
  }

  const handleMonthUpdate = async () => {
    await mutate()
  }

  const handleExport = () => {
    if (!canExport) {
      message.error('您没有导出权限')
      return
    }
    onExport?.(customerId, selectedYear)
  }

  if (isLoading) {
    return (
      <Card size="small">
        <div className="text-center py-8">
          <Spin size="large" />
          <div className="mt-2 text-gray-500">加载中...</div>
        </div>
      </Card>
    )
  }

  // 渲染月份网格
  const renderMonthsGrid = () => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1)
    const monthsData = currentRecord?.months || []

    return (
      <div className="grid grid-cols-6 gap-2 mb-4">
        {months.map(month => {
          const monthData = monthsData.find(m => m.month === month)
          const status = mapBackendStatusToFrontend(monthData?.status)
          const statusDisplay = getStatusDisplay(status)

          return (
            <MonthEditPopover
              key={month}
              month={month}
              year={selectedYear}
              yearRecordId={currentRecord?.id || 0}
              monthData={monthData}
              onUpdate={handleMonthUpdate}
            >
              <div
                className={`
                  relative p-2 rounded border text-center cursor-pointer transition-all duration-200
                  hover:shadow-md hover:-translate-y-0.5
                  ${currentRecord ? 'border-solid' : 'border-dashed border-gray-300'}
                `}
                style={{
                  backgroundColor: currentRecord ? `${statusDisplay.color}15` : '#f5f5f5',
                  borderColor: currentRecord ? statusDisplay.color : '#d9d9d9',
                  color: currentRecord ? statusDisplay.color : '#8c8c8c',
                }}
              >
                <div className="text-xs font-medium mb-1">{getMonthName(month)}</div>
                <div className="text-xs opacity-80">
                  {currentRecord ? statusDisplay.label : '未设置'}
                </div>
                {monthData?.description && (
                  <div
                    className="text-xs text-gray-500 mt-1 truncate"
                    title={monthData.description}
                  >
                    {monthData.description}
                  </div>
                )}
              </div>
            </MonthEditPopover>
          )
        })}
      </div>
    )
  }

  return (
    <Card size="small" className="voucher-record-compact" styles={{ body: { padding: '16px' } }}>
      {/* 头部控制区 */}
      <div className="flex justify-between items-center mb-4">
        <Space>
          <DatePicker
            picker="year"
            value={dayjs(`${selectedYear}-01-01`)}
            onChange={handleYearChange}
            style={{ width: 120 }}
            size="small"
            placeholder="选择年份"
          />
          {isCreating && canCreate && (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              loading={loading}
              onClick={handleCreateYear}
            >
              新增年度
            </Button>
          )}
        </Space>

        <Space>
          {canExport && (
            <Button
              size="small"
              icon={<ExportOutlined />}
              onClick={handleExport}
              loading={exportLoading}
            >
              导出
            </Button>
          )}
        </Space>
      </div>

      {/* 年度信息 */}
      {(currentRecord || isCreating) && (
        <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3">年度信息</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">存放位置</label>
              <Input
                placeholder="请输入存放位置"
                disabled={!canEdit && !isCreating}
                value={formData.storageLocation}
                onChange={e => setFormData(prev => ({ ...prev, storageLocation: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">经手人</label>
              <Input
                placeholder="请输入经手人"
                disabled={!canEdit && !isCreating}
                value={formData.handler}
                onChange={e => setFormData(prev => ({ ...prev, handler: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">取走记录</label>
              <Input
                placeholder="请输入取走记录"
                disabled={!canEdit && !isCreating}
                value={formData.withdrawalRecord}
                onChange={e => setFormData(prev => ({ ...prev, withdrawalRecord: e.target.value }))}
              />
            </div>
          </div>

          {/* 通用备注 */}
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">通用备注</label>
            <TextArea
              rows={3}
              placeholder="请输入通用备注信息..."
              disabled={!canEdit && !isCreating}
              value={formData.generalRemarks}
              onChange={e => {
                setFormData(prev => ({ ...prev, generalRemarks: e.target.value }))
              }}
            />
          </div>

          {(canEdit || isCreating) && (
            <div className="flex justify-end mt-3">
              <Button
                type="primary"
                size="small"
                loading={loading}
                onClick={isCreating ? handleCreateYear : handleUpdateYear}
              >
                {isCreating ? '创建' : '保存'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 月份状态网格 */}
      {currentRecord ? (
        <>
          {renderMonthsGrid()}

          {/* 批量操作 */}
          <BatchOperations
            yearRecordId={currentRecord.id}
            year={selectedYear}
            onUpdate={handleMonthUpdate}
            size="small"
            className="mb-4"
          />
        </>
      ) : (
        <Empty description={`${selectedYear}年度记录不存在`} image={Empty.PRESENTED_IMAGE_SIMPLE}>
          {canCreate && (
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              loading={loading}
              onClick={handleCreateYear}
            >
              创建{selectedYear}年度记录
            </Button>
          )}
        </Empty>
      )}
    </Card>
  )
}

export default VoucherRecordCompact
