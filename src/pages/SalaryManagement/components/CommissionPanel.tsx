import React, { useState, useEffect } from 'react'
import { Alert, Collapse, Button, Table, Modal, Form, Input, InputNumber, Space, Spin } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons'
import { useCommission } from '../../../hooks/useCommission'
import type { ColumnsType } from 'antd/es/table'
import type {
  AgencyCommission,
  BusinessSalesCommission,
  BusinessConsultantCommission,
  BusinessOtherCommission,
  PerformanceCommission,
} from '../../../api/commission'

interface CommissionPanelProps {
  employeeName: string
  yearMonth: string
  data?: any
  onUpdate: (data: any) => Promise<any>
}

const CommissionPanel: React.FC<CommissionPanelProps> = ({
  employeeName,
  yearMonth,
  data,
  onUpdate,
}) => {
  const { commissionSummary, loading, errors, agencyOperations, salesOperations } = useCommission()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [currentType, setCurrentType] = useState<string>('')
  const [form] = Form.useForm()

  // 添加调试信息
  useEffect(() => {
    console.log('CommissionPanel - 提成数据:', commissionSummary)
    console.log('CommissionPanel - 错误信息:', errors)
    console.log('CommissionPanel - 加载状态:', loading)
  }, [commissionSummary, errors, loading])

  // 代理费提成表格列定义
  const agencyColumns: ColumnsType<AgencyCommission> = [
    {
      title: '代理户数',
      dataIndex: 'agencyCount',
      key: 'agencyCount',
    },
    {
      title: '最低提成基数(元)',
      dataIndex: 'minCommissionBase',
      key: 'minCommissionBase',
      render: value => `¥${value?.toLocaleString() || 0}`,
    },
    {
      title: '收费额区间',
      dataIndex: 'feeRange',
      key: 'feeRange',
    },
    {
      title: '提成比率(%)',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      render: value => `${value || 0}%`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit('agency', record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete('agency', record.id!)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  // 业务销售提成表格列定义
  const salesColumns: ColumnsType<BusinessSalesCommission> = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '底薪(元)',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: value => `¥${value?.toLocaleString() || 0}`,
    },
    {
      title: '收费额区间',
      dataIndex: 'feeRange',
      key: 'feeRange',
    },
    {
      title: '提成比率(%)',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      render: value => `${value || 0}%`,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit('sales', record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete('sales', record.id!)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  // 业务顾问提成表格列定义
  const consultantColumns: ColumnsType<BusinessConsultantCommission> = [
    {
      title: '收费额区间',
      dataIndex: 'feeRange',
      key: 'feeRange',
    },
    {
      title: '提成比率(%)',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      render: value => `${value || 0}%`,
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  // 绩效提成表格列定义
  const performanceColumns: ColumnsType<PerformanceCommission> = [
    {
      title: 'P级',
      dataIndex: 'pLevel',
      key: 'pLevel',
    },
    {
      title: '档级',
      dataIndex: 'gradeLevel',
      key: 'gradeLevel',
    },
    {
      title: '户数',
      dataIndex: 'householdCount',
      key: 'householdCount',
    },
    {
      title: '底薪(元)',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: value => (value ? `¥${value.toLocaleString()}` : '-'),
    },
    {
      title: '绩效(元)',
      dataIndex: 'performance',
      key: 'performance',
      render: value => (value ? `¥${value.toLocaleString()}` : '-'),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const handleAdd = (type: string) => {
    // 检查是否有错误，如果有则不允许操作
    const hasErrors =
      errors.agency || errors.sales || errors.consultant || errors.other || errors.performance
    if (hasErrors) {
      alert('接口暂不可用，无法进行新增操作')
      return
    }

    setCurrentType(type)
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (type: string, record: any) => {
    setCurrentType(type)
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (type: string, id: number) => {
    try {
      if (type === 'agency') {
        await agencyOperations.delete(id)
      } else if (type === 'sales') {
        await salesOperations.delete(id)
      }
      // 其他类型的删除操作...
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      if (editingRecord) {
        // 更新
        if (currentType === 'agency') {
          await agencyOperations.update(editingRecord.id, values)
        } else if (currentType === 'sales') {
          await salesOperations.update(editingRecord.id, values)
        }
      } else {
        // 新增
        if (currentType === 'agency') {
          await agencyOperations.create(values)
        } else if (currentType === 'sales') {
          await salesOperations.create(values)
        }
      }

      setModalVisible(false)
      form.resetFields()
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const renderModalForm = () => {
    switch (currentType) {
      case 'agency':
        return (
          <>
            <Form.Item label="代理户数" name="agencyCount" rules={[{ required: true }]}>
              <Input placeholder="如：151-200" />
            </Form.Item>
            <Form.Item
              label="最低提成基数(元)"
              name="minCommissionBase"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="收费额区间" name="feeRange" rules={[{ required: true }]}>
              <Input placeholder="如：20000-35000" />
            </Form.Item>
            <Form.Item label="提成比率(%)" name="commissionRate" rules={[{ required: true }]}>
              <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </>
        )
      case 'sales':
        return (
          <>
            <Form.Item label="类型" name="type" rules={[{ required: true }]}>
              <Input placeholder="如：转正后" />
            </Form.Item>
            <Form.Item label="底薪(元)" name="baseSalary" rules={[{ required: true }]}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="收费额区间" name="feeRange" rules={[{ required: true }]}>
              <Input placeholder="如：10000-20000" />
            </Form.Item>
            <Form.Item label="提成比率(%)" name="commissionRate" rules={[{ required: true }]}>
              <InputNumber min={0} max={100} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">提成配置管理</h4>
          <Button icon={<SettingOutlined />} size="small">
            配置设置
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Spin spinning={loading}>
          {/* 错误提示 */}
          {(errors.agency ||
            errors.sales ||
            errors.consultant ||
            errors.other ||
            errors.performance) && (
            <Alert
              message="接口请求失败"
              description="提成配置接口可能尚未实现，当前显示空数据以避免错误。请检查后端API是否正常运行。"
              type="warning"
              showIcon
              className="mb-4"
            />
          )}

          <Alert
            message="提成配置系统"
            description="管理和配置各类提成计算规则，包括代理费提成、业务销售提成、业务顾问提成等。"
            type="info"
            showIcon
            className="mb-4"
          />

          <Collapse defaultActiveKey={['agency', 'sales', 'consultant', 'performance']} ghost>
            <Collapse.Panel
              header={
                <div className="flex justify-between items-center">
                  <span>代理费提成配置</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 text-sm">
                      {commissionSummary.agency.length}条配置
                    </span>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => handleAdd('agency')}
                    >
                      新增
                    </Button>
                  </div>
                </div>
              }
              key="agency"
            >
              <Table
                columns={agencyColumns}
                dataSource={commissionSummary.agency}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: '暂无代理费提成配置' }}
              />
            </Collapse.Panel>

            <Collapse.Panel
              header={
                <div className="flex justify-between items-center">
                  <span>业务销售提成配置</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 text-sm">
                      {commissionSummary.sales.length}条配置
                    </span>
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => handleAdd('sales')}
                    >
                      新增
                    </Button>
                  </div>
                </div>
              }
              key="sales"
            >
              <Table
                columns={salesColumns}
                dataSource={commissionSummary.sales}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: '暂无业务销售提成配置' }}
              />
            </Collapse.Panel>

            <Collapse.Panel
              header={
                <div className="flex justify-between items-center">
                  <span>业务顾问提成配置</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 text-sm">
                      {commissionSummary.consultant.length}条配置
                    </span>
                    <Button type="primary" size="small" icon={<PlusOutlined />}>
                      新增
                    </Button>
                  </div>
                </div>
              }
              key="consultant"
            >
              <Table
                columns={consultantColumns}
                dataSource={commissionSummary.consultant}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: '暂无业务顾问提成配置' }}
              />
            </Collapse.Panel>

            <Collapse.Panel
              header={
                <div className="flex justify-between items-center">
                  <span>绩效提成配置</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500 text-sm">
                      {commissionSummary.performance.length}条配置
                    </span>
                    <Button type="primary" size="small" icon={<PlusOutlined />}>
                      新增
                    </Button>
                  </div>
                </div>
              }
              key="performance"
            >
              <Table
                columns={performanceColumns}
                dataSource={commissionSummary.performance}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: '暂无绩效提成配置' }}
              />
            </Collapse.Panel>
          </Collapse>
        </Spin>
      </div>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={`${editingRecord ? '编辑' : '新增'}${currentType === 'agency' ? '代理费' : '业务销售'}提成配置`}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {renderModalForm()}
        </Form>
      </Modal>
    </div>
  )
}

export default CommissionPanel
