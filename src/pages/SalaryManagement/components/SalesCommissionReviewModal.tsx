import React, { useMemo } from 'react'
import { Alert, Button, Modal, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { SalesCommissionReviewRecord } from '../../../types/salaryIntegrated'
import AmountInput from './AmountInput'

const { Text } = Typography

export interface SalesCommissionReviewItem extends SalesCommissionReviewRecord {
  originalBaseSalary: number
}

interface SalesCommissionReviewModalProps {
  open: boolean
  data: SalesCommissionReviewItem[]
  loading?: boolean
  onCancel: () => void
  onBaseSalaryChange: (name: string, value: number) => void
  onConfirm: () => void
}

const formatCurrency = (value: number) =>
  value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const renderBaseSalarySummary = (items: SalesCommissionReviewItem[]) => {
  if (items.length === 0) {
    return '暂无'
  }

  return items
    .map(item => `${item.name}(${formatCurrency(item.baseSalary)})`)
    .join('、')
}

const SalesCommissionReviewModal: React.FC<SalesCommissionReviewModalProps> = ({
  open,
  data,
  loading = false,
  onCancel,
  onBaseSalaryChange,
  onConfirm,
}) => {
  const { overThresholdItems, underOrEqualThresholdItems } = useMemo(() => {
    const overThreshold = data.filter(item => item.commissionTotal > 12000)
    const underOrEqualThreshold = data.filter(item => item.commissionTotal <= 12000)

    return {
      overThresholdItems: overThreshold,
      underOrEqualThresholdItems: underOrEqualThreshold,
    }
  }, [data])

  const columns: ColumnsType<SalesCommissionReviewItem> = [
    {
      title: '销售专员姓名',
      dataIndex: 'name',
      key: 'name',
      width: 140,
      fixed: 'left',
    },
    {
      title: '提成明细',
      key: 'commissionDetails',
      width: 360,
      render: (_, record) => (
        <div className="space-y-1">
          <div>基础业务提成：{formatCurrency(record.businessCommissionOwn)}</div>
          <div>外包业务提成：{formatCurrency(record.businessCommissionOutsource)}</div>
          <div>特殊业务提成：{formatCurrency(record.specialBusinessCommission)}</div>
          <div>代理费提成：{formatCurrency(record.agencyCommission)}</div>
        </div>
      ),
    },
    {
      title: '提成总和',
      dataIndex: 'commissionTotal',
      key: 'commissionTotal',
      width: 180,
      render: value => {
        const commissionTotal = Number(value || 0)
        const isOverThreshold = commissionTotal > 12000

        return (
          <div className="flex items-center gap-2">
            <Text strong>{formatCurrency(commissionTotal)}</Text>
            <Tag color={isOverThreshold ? 'red' : 'blue'}>
              {isOverThreshold ? '> 12000' : '<= 12000'}
            </Tag>
          </div>
        )
      },
    },
    {
      title: '基础工资',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 220,
      render: (_, record) => (
        <AmountInput
          min={0}
          precision={2}
          value={record.baseSalary}
          onChange={value => {
            const nextValue =
              typeof value === 'number' ? value : Number(value || 0)
            onBaseSalaryChange(record.name, Number.isNaN(nextValue) ? 0 : nextValue)
          }}
        />
      ),
    },
  ]

  return (
    <Modal
      title="销售专员本月提成信息"
      open={open}
      onCancel={onCancel}
      width={1180}
      destroyOnClose
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          取消
        </Button>,
        <Button key="confirm" type="primary" loading={loading} onClick={onConfirm}>
          保存并生成
        </Button>,
      ]}
    >
      <div className="space-y-4">
        <Alert
          type="info"
          showIcon
          message={`提成总和大于 12000 共 ${overThresholdItems.length} 人，小于等于 12000 共 ${underOrEqualThresholdItems.length} 人`}
          description={
            <div className="space-y-1">
              <div>提成总和大于 12000 的基础工资：{renderBaseSalarySummary(overThresholdItems)}</div>
              <div>
                提成总和小于等于 12000 的基础工资：
                {renderBaseSalarySummary(underOrEqualThresholdItems)}
              </div>
            </div>
          }
        />

        <Table<SalesCommissionReviewItem>
          rowKey="name"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={false}
          scroll={{ x: 980, y: 420 }}
          locale={{ emptyText: '本月暂无销售专员薪资数据' }}
        />
      </div>
    </Modal>
  )
}

export default SalesCommissionReviewModal
