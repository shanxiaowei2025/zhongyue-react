import React, { useState } from 'react'
import { Card, Select, Button, DatePicker, Space, Spin, Empty, Descriptions } from 'antd'
import { ExportOutlined } from '@ant-design/icons'
import { useCustomerVoucherRecords } from '../../hooks/useVoucherRecord'
import { useVoucherPermission } from '../../hooks/useVoucherPermission'
import {
  mapBackendStatusToFrontend,
  getStatusDisplay,
  getMonthName,
} from '../../utils/voucherRecord'
import type { VoucherRecordYear } from '../../types/voucherRecord'
import dayjs from 'dayjs'

interface VoucherRecordReadOnlyProps {
  customerId: number
  onExport?: (customerId: number, year?: number) => void
  exportLoading?: boolean
}

const VoucherRecordReadOnly: React.FC<VoucherRecordReadOnlyProps> = ({
  customerId,
  onExport,
  exportLoading = false,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())

  const { records, isLoading } = useCustomerVoucherRecords(customerId)
  const { canView, canExport } = useVoucherPermission()

  // 当前选中年份的记录
  const currentRecord = records.find(r => r.year === selectedYear)

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedYear(date.year())
    }
  }

  const handleExport = () => {
    if (!canExport) {
      return
    }
    onExport?.(customerId, selectedYear)
  }

  // 权限检查
  if (!canView) {
    return (
      <Card size="small">
        <Empty description="您没有查看凭证记录的权限" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Card>
    )
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

  // 渲染月份网格（只读）
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
            <div
              key={month}
              className="relative p-2 rounded border text-center"
              style={{
                backgroundColor: `${statusDisplay.color}15`,
                borderColor: statusDisplay.color,
                color: statusDisplay.color,
              }}
            >
              <div className="text-xs font-medium mb-1">{getMonthName(month)}</div>
              <div className="text-xs">{statusDisplay.label}</div>
              {monthData?.description && (
                <div className="text-xs text-gray-500 mt-1 truncate" title={monthData.description}>
                  {monthData.description}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <Card size="small" className="voucher-record-readonly" styles={{ body: { padding: '16px' } }}>
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

      {currentRecord ? (
        <>
          {/* 年度信息（只读显示） */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">年度信息</h4>
            <Descriptions bordered size="small" column={2} className="mb-4">
              <Descriptions.Item label="存放位置">
                {currentRecord.storageLocation || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="经手人">{currentRecord.handler || '-'}</Descriptions.Item>
              <Descriptions.Item label="取走记录" span={2}>
                {currentRecord.withdrawalRecord || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="通用备注" span={2}>
                {currentRecord.generalRemarks || '-'}
              </Descriptions.Item>
            </Descriptions>
          </div>

          {/* 月份状态网格 */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">月度状态</h4>
            {renderMonthsGrid()}
          </div>
        </>
      ) : (
        <Empty description={`${selectedYear}年度记录不存在`} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </Card>
  )
}

export default VoucherRecordReadOnly
