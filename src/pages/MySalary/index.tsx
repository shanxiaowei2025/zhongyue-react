import React, { useState } from 'react'
import { Button, Spin, message, DatePicker, Table, Tag, Modal } from 'antd'
import {
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMySalary } from '../../hooks/useMySalary'
import MySalaryDetails from './components/MySalaryDetails'
import type { MySalaryRecord } from '../../types/mySalary'

const { MonthPicker } = DatePicker

const MySalary: React.FC = () => {
  const { selectedRecord, selectedYearMonth, salaryList, loading, operations, refreshData } =
    useMySalary()

  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)

  const handleMonthChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      const yearMonth = date.format('YYYY-MM')
      operations.switchMonth(yearMonth)
    }
  }

  const handleViewRecord = (record: MySalaryRecord) => {
    operations.selectRecord(record)
    setDetailModalVisible(true)
  }

  const handleConfirmSalary = async (record: MySalaryRecord) => {
    try {
      setConfirmingId(record.id)
      await operations.confirmSalary(record.id)
      message.success('薪资确认成功')
    } catch (error) {
      // 错误已在hook中处理
    } finally {
      setConfirmingId(null)
    }
  }

  const handleConfirmInModal = async () => {
    if (!selectedRecord) return

    try {
      setConfirmingId(selectedRecord.id)
      await operations.confirmSalary(selectedRecord.id)
      setDetailModalVisible(false)
      message.success('薪资确认成功')
    } catch (error) {
      // 错误已在hook中处理
    } finally {
      setConfirmingId(null)
    }
  }

  // 格式化货币
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return '¥0.00'
    }
    const numAmount = Number(amount)
    return `¥${numAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
  }

  // 表格列定义
  const columns: ColumnsType<MySalaryRecord> = [
    {
      title: '月份',
      dataIndex: 'yearMonth',
      key: 'yearMonth',
      width: 100,
      render: (yearMonth: string) => dayjs(yearMonth).format('YYYY-MM'),
      fixed: 'left',
    },
    {
      title: '基本工资',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 120,
      render: (value: number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '补贴合计',
      dataIndex: 'totalSubsidy',
      key: 'totalSubsidy',
      width: 120,
      render: (value: number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '绩效提成',
      dataIndex: 'performanceCommission',
      key: 'performanceCommission',
      width: 120,
      render: (value: number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '应发工资',
      dataIndex: 'totalPayable',
      key: 'totalPayable',
      width: 130,
      render: (value: number) => (
        <span className="font-semibold text-green-600">{formatCurrency(value)}</span>
      ),
      align: 'right',
    },
    {
      title: '社保个人',
      dataIndex: 'personalInsuranceTotal',
      key: 'personalInsuranceTotal',
      width: 120,
      render: (value: number) => <span className="text-red-600">-{formatCurrency(value)}</span>,
      align: 'right',
    },
    {
      title: '个人所得税',
      dataIndex: 'personalIncomeTax',
      key: 'personalIncomeTax',
      width: 120,
      render: (value: number) => <span className="text-red-600">-{formatCurrency(value)}</span>,
      align: 'right',
    },
    {
      title: '实发工资',
      dataIndex: 'totalPayable',
      key: 'netSalary',
      width: 130,
      render: (value: number, record: MySalaryRecord) => {
        // 计算实发工资：应发合计 - 个人社保 - 个人所得税
        const netSalary =
          value - (record.personalInsuranceTotal || 0) - (record.personalIncomeTax || 0)
        return <span className="font-semibold text-blue-600">{formatCurrency(netSalary)}</span>
      },
      align: 'right',
    },
    {
      title: '银行卡/微信',
      dataIndex: 'bankCardOrWechat',
      key: 'bankCardOrWechat',
      width: 130,
      render: (value: number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '现金发放',
      dataIndex: 'cashPaid',
      key: 'cashPaid',
      width: 120,
      render: (value: number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '公司代付',
      dataIndex: 'corporatePayment',
      key: 'corporatePayment',
      width: 120,
      render: (value: number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '确认状态',
      dataIndex: 'isConfirmed',
      key: 'isConfirmed',
      width: 120,
      render: (isConfirmed: boolean, record: MySalaryRecord) => {
        if (isConfirmed) {
          return (
            <div className="space-y-1">
              <Tag icon={<CheckCircleOutlined />} color="success">
                已确认
              </Tag>
              {record.confirmedAt && (
                <div className="text-xs text-gray-500">
                  {dayjs(record.confirmedAt).format('MM-DD HH:mm')}
                </div>
              )}
            </div>
          )
        }
        return (
          <Tag icon={<ClockCircleOutlined />} color="warning">
            待确认
          </Tag>
        )
      },
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record: MySalaryRecord) => {
        const canConfirm = !record.isConfirmed && record.totalPayable > 0

        return (
          <div className="flex space-x-2">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewRecord(record)}
            >
              详情
            </Button>
            {record.isConfirmed ? (
              <Tag color="success" className="cursor-default">
                已确认
              </Tag>
            ) : (
              <Button
                type="primary"
                size="small"
                loading={confirmingId === record.id}
                disabled={!canConfirm}
                onClick={() => handleConfirmSalary(record)}
              >
                确认
              </Button>
            )}
          </div>
        )
      },
      fixed: 'right',
      align: 'center',
    },
  ]

  const currentYearMonth = dayjs(selectedYearMonth)

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 页头 */}
      <div className="bg-white border-b shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">我的薪资</h1>
            <p className="text-gray-500">
              查看和确认我的薪资记录 - {dayjs(selectedYearMonth).format('YYYY年MM月')}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <MonthPicker
              value={currentYearMonth}
              onChange={handleMonthChange}
              allowClear={false}
              format="YYYY-MM"
              placeholder="选择月份"
            />
            <Button icon={<ReloadOutlined />} onClick={refreshData} loading={loading}>
              刷新
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 bg-white p-6 overflow-hidden">
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">薪资记录</h2>
            <div className="text-sm text-gray-500">共 {salaryList.length} 条记录</div>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={salaryList}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 1400, y: 'calc(100vh - 250px)' }}
          size="middle"
          bordered
          locale={{
            emptyText: (
              <div className="text-center py-8 text-gray-500">
                <div className="text-lg mb-2">暂无薪资记录</div>
                <div className="text-sm">该月份暂无薪资数据</div>
              </div>
            ),
          }}
        />
      </div>

      {/* 薪资详情弹窗 */}
      <Modal
        title="薪资详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={1200}
        footer={null}
        className="salary-detail-modal"
      >
        <MySalaryDetails
          detail={selectedRecord}
          onConfirm={handleConfirmInModal}
          loading={confirmingId === selectedRecord?.id}
        />
      </Modal>
    </div>
  )
}

export default MySalary
