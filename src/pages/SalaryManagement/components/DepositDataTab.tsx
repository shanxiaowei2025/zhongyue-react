import React, { useState } from 'react'
import {
  Table,
  Button,
  Form,
  InputNumber,
  DatePicker,
  Input,
  Modal,
  message,
  Popconfirm,
  Space,
  Empty,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import type { DepositRecord, SalaryRecord } from '../../../types/salaryIntegrated'

interface DepositDataTabProps {
  employee: SalaryRecord | null
  depositData: DepositRecord[]
  onUpdate: (data: DepositRecord[]) => Promise<void>
}

const DepositDataTab: React.FC<DepositDataTabProps> = ({ employee, depositData, onUpdate }) => {
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<DepositRecord | null>(null)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const formatCurrency = (value: number): string => {
    return value.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const handleAdd = () => {
    if (!employee) {
      message.warning('请先选择员工')
      return
    }
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      name: employee.name,
      deductionDate: dayjs(),
    })
    setModalVisible(true)
  }

  const handleEdit = (record: DepositRecord) => {
    setEditingRecord(record)
    form.setFieldsValue({
      ...record,
      deductionDate: dayjs(record.deductionDate),
    })
    setModalVisible(true)
  }

  const handleDelete = async (record: DepositRecord) => {
    try {
      const newData = depositData.filter(item => item.id !== record.id)
      await onUpdate(newData)
      message.success('删除成功')
    } catch {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      const submitData = {
        ...values,
        deductionDate: values.deductionDate.format('YYYY-MM-DD'),
        amount: Number(values.amount),
      }

      let newData: DepositRecord[]

      if (editingRecord) {
        // 更新
        newData = depositData.map(item =>
          item.id === editingRecord.id
            ? { ...item, ...submitData, updatedAt: new Date().toISOString() }
            : item
        )
      } else {
        // 新增
        const newRecord: DepositRecord = {
          id: Date.now(), // 临时ID，实际应该由后端生成
          ...submitData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        newData = [...depositData, newRecord]
      }

      await onUpdate(newData)
      setModalVisible(false)
      message.success(editingRecord ? '更新成功' : '添加成功')
    } catch {
      message.error('操作失败')
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnsType<DepositRecord> = [
    {
      title: '姓名',
      dataIndex: 'name',
      width: 100,
    },
    {
      title: '扣除金额',
      dataIndex: 'amount',
      width: 120,
      render: (value: number) => (
        <span className="font-mono text-red-600 font-medium">¥{formatCurrency(value)}</span>
      ),
      align: 'right',
    },
    {
      title: '扣除日期',
      dataIndex: 'deductionDate',
      width: 120,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 150,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  if (!employee) {
    return (
      <div className="h-full flex items-center justify-center">
        <Empty description="请选择员工查看保证金数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b bg-gray-50 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium text-lg">{employee.name} - 保证金记录</h4>
            <p className="text-sm text-gray-500 mt-1">
              共 {depositData.length} 条记录， 总扣除金额：¥
              {formatCurrency(depositData.reduce((sum, item) => sum + item.amount, 0))}
            </p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增记录
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Table
          columns={columns}
          dataSource={depositData}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条记录`,
          }}
          scroll={{ x: 800 }}
          size="small"
        />
      </div>

      <Modal
        title={editingRecord ? '编辑保证金记录' : '新增保证金记录'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        destroyOnClose
        width={500}
      >
        <Form form={form} layout="vertical" className="pt-4">
          <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            label="扣除金额"
            name="amount"
            rules={[
              { required: true, message: '请输入扣除金额' },
              { type: 'number', min: 0, message: '金额不能为负数' },
            ]}
          >
            <InputNumber
              placeholder="请输入扣除金额"
              style={{ width: '100%' }}
              min={0}
              precision={2}
              formatter={value => `¥ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => parseFloat(value!.replace(/¥\s?|(,*)/g, '')) as any}
            />
          </Form.Item>

          <Form.Item
            label="扣除日期"
            name="deductionDate"
            rules={[{ required: true, message: '请选择扣除日期' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
          </Form.Item>

          <Form.Item label="备注" name="remark">
            <Input.TextArea placeholder="请输入备注信息" rows={3} maxLength={200} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DepositDataTab
