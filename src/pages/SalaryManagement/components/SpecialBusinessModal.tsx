import React, { useState, useEffect } from 'react'
import { Modal, Table, DatePicker, Button, Space, message, Tag, InputNumber, Popconfirm } from 'antd'
import { ReloadOutlined, EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { SpecialBusinessRecord, SpecialBusinessListResponse } from '../../../types/expense'
import request from '../../../api/request'

const { RangePicker } = DatePicker

interface SpecialBusinessModalProps {
  open: boolean
  onCancel: () => void
}

const SpecialBusinessModal: React.FC<SpecialBusinessModalProps> = ({
  open,
  onCancel,
}) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<SpecialBusinessRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => {
    // 默认为上个月1日到最后一天
    const lastMonth = dayjs().subtract(1, 'month')
    const startOfLastMonth = lastMonth.startOf('month')
    const endOfLastMonth = lastMonth.endOf('month')
    return [startOfLastMonth, endOfLastMonth]
  })
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingValue, setEditingValue] = useState<number | null>(null)

  const fetchData = async () => {
    if (!dateRange) return

    setLoading(true)
    try {
      const [startDate, endDate] = dateRange
      const response = await request.get<SpecialBusinessListResponse>('/expense/special', {
        params: {
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          page,
          pageSize,
        },
      })

      if (response.code === 0) {
        setData(response.data.data)
        setTotal(parseInt(response.data.total))
      } else {
        message.error(response.message || '获取数据失败')
      }
    } catch (error) {
      console.error('获取特殊业务数据失败:', error)
      message.error('获取数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open, page, dateRange])

  const columns = [
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
      ellipsis: true,
    },
    {
      title: '销售员',
      dataIndex: 'salesperson',
      key: 'salesperson',
      width: 100,
    },
    {
      title: '收费日期',
      dataIndex: 'chargeDate',
      key: 'chargeDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '特殊业务内容',
      dataIndex: 'otherBusinessSpecial',
      key: 'otherBusinessSpecial',
      width: 200,
      render: (items: string[]) => (
        <div>
          {items.map((item, index) => (
            <Tag key={index} color="blue" style={{ marginBottom: 4 }}>
              {item}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: '特殊业务费用',
      dataIndex: 'otherBusinessSpecialFee',
      key: 'otherBusinessSpecialFee',
      width: 120,
      render: (fee: string) => `¥${parseFloat(fee).toLocaleString()}`,
    },
    {
      title: '特殊业务提成',
      dataIndex: 'specialBusinessCommission',
      key: 'specialBusinessCommission',
      width: 150,
      render: (commission: string | null, record: SpecialBusinessRecord) => {
        if (editingId === record.id) {
          return (
            <InputNumber
              value={editingValue}
              onChange={setEditingValue}
              min={0}
              precision={2}
              style={{ width: '100%' }}
              placeholder="请输入提成金额"
            />
          )
        }
        return commission ? `¥${parseFloat(commission).toLocaleString()}` : '-'
      },
    },
    {
      title: '总费用',
      dataIndex: 'totalFee',
      key: 'totalFee',
      width: 120,
      render: (fee: string) => `¥${parseFloat(fee).toLocaleString()}`,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: SpecialBusinessRecord) => {
        if (editingId === record.id) {
          return (
            <Space>
              <Popconfirm
                title="确认保存修改？"
                onConfirm={() => handleSave(record.id)}
                okText="确认"
                cancelText="取消"
              >
                <Button type="primary" size="small" icon={<SaveOutlined />}>
                  保存
                </Button>
              </Popconfirm>
              <Button size="small" icon={<CloseOutlined />} onClick={handleCancel}>
                取消
              </Button>
            </Space>
          )
        }
        return (
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        )
      },
    },
  ]

  const handleDateRangeChange = (dates: any) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange([dates[0], dates[1]])
      setPage(1) // 重置页码
    }
  }

  const handleRefresh = () => {
    fetchData()
  }

  const handleEdit = (record: SpecialBusinessRecord) => {
    setEditingId(record.id)
    setEditingValue(
      record.specialBusinessCommission ? parseFloat(record.specialBusinessCommission) : 0
    )
  }

  const handleSave = async (id: number) => {
    try {
      const response = await request.patch<{ code: number; message?: string }>(`/expense/${id}`, {
        specialBusinessCommission: editingValue,
      })

      if (response.code === 0) {
        message.success('修改成功')
        setEditingId(null)
        setEditingValue(null)
        fetchData() // 重新获取数据
      } else {
        message.error(response.message || '修改失败')
      }
    } catch (error) {
      console.error('修改特殊业务提成失败:', error)
      message.error('修改失败，请稍后重试')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditingValue(null)
  }

  return (
    <Modal
      title="特殊业务费用记录"
      open={open}
      onCancel={onCancel}
      width={1200}
      footer={null}
      destroyOnClose
    >
      <div className="mb-4">
        <Space>
          <span>日期范围：</span>
          <RangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            format="YYYY-MM-DD"
          />
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            刷新
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          onChange: (newPage) => setPage(newPage),
        }}
        scroll={{ x: 1100 }}
        size="small"
      />
    </Modal>
  )
}

export default SpecialBusinessModal 