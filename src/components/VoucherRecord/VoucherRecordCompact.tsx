import React, { useState, useEffect } from 'react'
import { Card, Select, Button, Collapse, Form, Input, Space, Spin, Empty, message } from 'antd'
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
  isValidYear,
} from '../../utils/voucherRecord'
import type { VoucherRecordYear, CreateVoucherRecordYearDto } from '../../types/voucherRecord'

const { TextArea } = Input
const { Panel } = Collapse

interface VoucherRecordCompactProps {
  customerId: number
  onDetailEdit?: (yearRecordId: number) => void
  onExport?: (customerId: number, year?: number) => void
}

const VoucherRecordCompact: React.FC<VoucherRecordCompactProps> = ({
  customerId,
  onDetailEdit,
  onExport,
}) => {
  const [form] = Form.useForm()
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [currentRecord, setCurrentRecord] = useState<VoucherRecordYear | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const { records, isLoading, mutate } = useCustomerVoucherRecords(customerId)
  const { createYear, updateYear, loading } = useVoucherRecordActions()
  const { canView, canCreate, canEdit, canExport } = useVoucherPermission()

  // 生成年份选项（当前年份前后5年）
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)
    .filter(isValidYear)
    .map(year => ({ label: `${year}年`, value: year }))

  // 当选择年份变化时，更新当前记录
  useEffect(() => {
    const record = records.find(r => r.year === selectedYear)
    setCurrentRecord(record || null)
    setIsCreating(!record)

    if (record) {
      form.setFieldsValue({
        storageLocation: record.storageLocation || '',
        handler: record.handler || '',
        withdrawalRecord: record.withdrawalRecord || '',
        generalRemarks: record.generalRemarks || '',
      })
    } else {
      form.resetFields()
    }
  }, [selectedYear, records, form])

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
      const values = await form.validateFields()
      const createData: CreateVoucherRecordYearDto = {
        customerId,
        year: selectedYear,
        ...values,
      }

      await createYear(createData)
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
      const values = await form.validateFields()
      await updateYear(currentRecord.id, values)
      await mutate()
    } catch (error) {
      console.error('更新年度记录失败:', error)
    }
  }

  const handleYearChange = (year: number) => {
    setSelectedYear(year)
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

  const handleDetailEdit = () => {
    if (currentRecord) {
      onDetailEdit?.(currentRecord.id)
    }
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
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></div>
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
          <Select
            value={selectedYear}
            onChange={handleYearChange}
            options={yearOptions}
            style={{ width: 120 }}
            size="small"
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
          {currentRecord && canEdit && (
            <Button size="small" icon={<EditOutlined />} onClick={handleDetailEdit}>
              详细编辑
            </Button>
          )}
          {canExport && (
            <Button size="small" icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
          )}
        </Space>
      </div>

      {/* 年度信息折叠面板 */}
      {(currentRecord || isCreating) && (
        <Collapse
          size="small"
          className="mb-4"
          items={[
            {
              key: 'yearInfo',
              label: '年度信息',
              children: (
                <Form form={form} layout="vertical" size="small">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Form.Item name="storageLocation" label="存放位置">
                      <Input placeholder="请输入存放位置" disabled={!canEdit && !isCreating} />
                    </Form.Item>
                    <Form.Item name="handler" label="经手人">
                      <Input placeholder="请输入经手人" disabled={!canEdit && !isCreating} />
                    </Form.Item>
                    <Form.Item name="withdrawalRecord" label="取走记录">
                      <Input placeholder="请输入取走记录" disabled={!canEdit && !isCreating} />
                    </Form.Item>
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
                </Form>
              ),
            },
          ]}
        />
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

          {/* 通用备注 */}
          <Form form={form} layout="vertical" size="small">
            <Form.Item name="generalRemarks" label="通用备注">
              <TextArea
                rows={3}
                placeholder="请输入通用备注信息..."
                disabled={!canEdit}
                onChange={async e => {
                  if (canEdit && currentRecord) {
                    try {
                      await updateYear(currentRecord.id, {
                        generalRemarks: e.target.value,
                      })
                    } catch (error) {
                      console.error('更新备注失败:', error)
                    }
                  }
                }}
              />
            </Form.Item>
          </Form>
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
