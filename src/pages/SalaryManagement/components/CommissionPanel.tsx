import React, { useState, useEffect } from 'react'
import { Alert, Collapse, Button, Table, Input, InputNumber, Space, Spin } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useCommission } from '../../../hooks/useCommission'
import type { ColumnsType } from 'antd/es/table'
import type {
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
  const {
    commissionSummary,
    loading,
    errors,
    salesOperations,
    consultantOperations,
    otherOperations,
    performanceOperations,
  } = useCommission()
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set())
  const [editingValues, setEditingValues] = useState<Record<string, any>>({})

  // 添加调试信息
  useEffect(() => {
    console.log('CommissionPanel - 提成数据:', commissionSummary)
    console.log('CommissionPanel - 错误信息:', errors)
    console.log('CommissionPanel - 加载状态:', loading)
  }, [commissionSummary, errors, loading])

  // 生成行键的通用函数
  const generateRowKey = (type: string, record: any): string => {
    if (record.id && record.id.toString().startsWith('new_')) {
      return record.id
    }
    return record.id ? `${type}_${record.id}` : `${type}_temp`
  }

  // 业务销售提成表格列定义
  const salesColumns: ColumnsType<BusinessSalesCommission> = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (value, record) => {
        const rowKey = generateRowKey('sales', record)
        return renderEditableCell(rowKey, 'type', value, 'text', '如：转正后')
      },
    },
    {
      title: '底薪(元)',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: (value, record) => {
        const rowKey = generateRowKey('sales', record)
        return renderEditableCell(rowKey, 'baseSalary', value, 'number', '底薪金额')
      },
    },
    {
      title: '收费额区间',
      dataIndex: 'feeRange',
      key: 'feeRange',
      render: (value, record) => {
        const rowKey = generateRowKey('sales', record)
        return renderEditableCell(rowKey, 'feeRange', value, 'text', '如：10000-20000')
      },
    },
    {
      title: '提成比率(%)',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      render: (value, record) => {
        const rowKey = generateRowKey('sales', record)
        return renderEditableCell(rowKey, 'commissionRate', value, 'number', '提成比率')
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => renderActionCell('sales', record),
    },
  ]

  // 业务顾问提成表格列定义
  const consultantColumns: ColumnsType<BusinessConsultantCommission> = [
    {
      title: '收费额区间',
      dataIndex: 'feeRange',
      key: 'feeRange',
      render: (value, record) => {
        const rowKey = generateRowKey('consultant', record)
        return renderEditableCell(rowKey, 'feeRange', value, 'text', '如：15000-25000')
      },
    },
    {
      title: '提成比率(%)',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      render: (value, record) => {
        const rowKey = generateRowKey('consultant', record)
        return renderEditableCell(rowKey, 'commissionRate', value, 'number', '提成比率')
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => renderActionCell('consultant', record),
    },
  ]

  // 业务其他提成表格列定义
  const otherColumns: ColumnsType<BusinessOtherCommission> = [
    {
      title: '收费额区间',
      dataIndex: 'feeRange',
      key: 'feeRange',
      render: (value, record) => {
        const rowKey = generateRowKey('other', record)
        return renderEditableCell(rowKey, 'feeRange', value, 'text', '如：5000-15000')
      },
    },
    {
      title: '提成比率(%)',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      render: (value, record) => {
        const rowKey = generateRowKey('other', record)
        return renderEditableCell(rowKey, 'commissionRate', value, 'number', '提成比率')
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => renderActionCell('other', record),
    },
  ]

  // 绩效提成表格列定义
  const performanceColumns: ColumnsType<PerformanceCommission> = [
    {
      title: 'P级',
      dataIndex: 'pLevel',
      key: 'pLevel',
      render: (value, record) => {
        const rowKey = generateRowKey('performance', record)
        return renderEditableCell(rowKey, 'pLevel', value, 'text', '如：P0')
      },
    },
    {
      title: '档级',
      dataIndex: 'gradeLevel',
      key: 'gradeLevel',
      render: (value, record) => {
        const rowKey = generateRowKey('performance', record)
        return renderEditableCell(rowKey, 'gradeLevel', value, 'text', '如：1')
      },
    },
    {
      title: '户数',
      dataIndex: 'householdCount',
      key: 'householdCount',
      render: (value, record) => {
        const rowKey = generateRowKey('performance', record)
        return renderEditableCell(rowKey, 'householdCount', value, 'text', '如：不限')
      },
    },
    {
      title: '底薪(元)',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: (value, record) => {
        const rowKey = generateRowKey('performance', record)
        return renderEditableCell(rowKey, 'baseSalary', value, 'number', '底薪金额')
      },
    },
    {
      title: '绩效(元)',
      dataIndex: 'performance',
      key: 'performance',
      render: (value, record) => {
        const rowKey = generateRowKey('performance', record)
        return renderEditableCell(rowKey, 'performance', value, 'number', '绩效金额')
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => renderActionCell('performance', record),
    },
  ]

  const handleAdd = (type: string) => {
    // 检查是否有错误，如果有则不允许操作
    const hasErrors = errors.sales || errors.consultant || errors.other || errors.performance
    if (hasErrors) {
      alert('接口暂不可用，无法进行新增操作')
      return
    }

    const newRowKey = `new_${type}_${Date.now()}`
    const newEditingRows = new Set(editingRows)
    newEditingRows.add(newRowKey)
    setEditingRows(newEditingRows)

    // 根据类型设置默认值
    const defaultValues =
      type === 'sales'
        ? { type: '', baseSalary: null, feeRange: '', commissionRate: 0 }
        : type === 'performance'
          ? { pLevel: '', gradeLevel: '', householdCount: '', baseSalary: null, performance: null }
          : { feeRange: '', commissionRate: 0 }

    setEditingValues({
      ...editingValues,
      [newRowKey]: { ...defaultValues, _type: type, _isNew: true },
    })
  }

  const handleEdit = (type: string, record: any) => {
    const rowKey = `${type}_${record.id}`
    const newEditingRows = new Set(editingRows)
    newEditingRows.add(rowKey)
    setEditingRows(newEditingRows)
    setEditingValues({
      ...editingValues,
      [rowKey]: { ...record, _type: type },
    })
  }

  const handleSave = async (rowKey: string) => {
    try {
      const values = editingValues[rowKey]
      if (!values) return

      console.log('保存数据 - 原始values:', values)

      // 转换提成比率为小数格式（后端需要的格式）
      const processedValues = { ...values }
      if (processedValues.commissionRate) {
        processedValues.commissionRate = processedValues.commissionRate / 100
      }

      // 处理数值类型字段，确保空值转换为 null
      if (processedValues.baseSalary !== null && processedValues.baseSalary !== undefined) {
        processedValues.baseSalary = Number(processedValues.baseSalary) || null
      }
      if (processedValues.performance !== null && processedValues.performance !== undefined) {
        processedValues.performance = Number(processedValues.performance) || null
      }

      const { _type, _isNew, ...submitData } = processedValues

      console.log('保存数据 - 处理后submitData:', submitData)
      console.log('保存数据 - 类型:', _type, '是否新增:', _isNew)

      if (_isNew) {
        // 新增
        if (_type === 'sales') {
          await salesOperations.create(submitData)
        } else if (_type === 'consultant') {
          await consultantOperations.create(submitData)
        } else if (_type === 'other') {
          await otherOperations.create(submitData)
        } else if (_type === 'performance') {
          await performanceOperations.create(submitData)
        }
      } else {
        // 更新
        if (_type === 'sales') {
          await salesOperations.update(values.id, submitData)
        } else if (_type === 'consultant') {
          await consultantOperations.update(values.id, submitData)
        } else if (_type === 'other') {
          await otherOperations.update(values.id, submitData)
        } else if (_type === 'performance') {
          await performanceOperations.update(values.id, submitData)
        }
      }

      // 退出编辑状态
      const newEditingRows = new Set(editingRows)
      newEditingRows.delete(rowKey)
      setEditingRows(newEditingRows)

      const newEditingValues = { ...editingValues }
      delete newEditingValues[rowKey]
      setEditingValues(newEditingValues)
    } catch (error) {
      console.error('保存失败:', error)
    }
  }

  const handleCancel = (rowKey: string) => {
    const newEditingRows = new Set(editingRows)
    newEditingRows.delete(rowKey)
    setEditingRows(newEditingRows)

    const newEditingValues = { ...editingValues }
    delete newEditingValues[rowKey]
    setEditingValues(newEditingValues)
  }

  const handleDelete = async (type: string, id: number) => {
    try {
      if (type === 'sales') {
        await salesOperations.delete(id)
      } else if (type === 'consultant') {
        await consultantOperations.delete(id)
      } else if (type === 'other') {
        await otherOperations.delete(id)
      } else if (type === 'performance') {
        await performanceOperations.delete(id)
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }

  const handleValueChange = (rowKey: string, field: string, value: any) => {
    setEditingValues({
      ...editingValues,
      [rowKey]: {
        ...editingValues[rowKey],
        [field]: value,
      },
    })
  }

  const renderEditableCell = (
    rowKey: string,
    field: string,
    value: any,
    type: 'text' | 'number' = 'text',
    placeholder?: string
  ) => {
    if (editingRows.has(rowKey)) {
      const editingValue = editingValues[rowKey]?.[field] ?? value
      if (type === 'number') {
        return (
          <InputNumber
            value={editingValue}
            onChange={val => handleValueChange(rowKey, field, val || 0)}
            placeholder={placeholder}
            style={{ width: '100%' }}
            min={0}
            precision={field === 'commissionRate' ? 2 : 2}
          />
        )
      }
      return (
        <Input
          value={editingValue}
          onChange={e => handleValueChange(rowKey, field, e.target.value)}
          placeholder={placeholder}
        />
      )
    }

    // 非编辑状态显示
    if (field === 'baseSalary' || field === 'performance') {
      return value ? `¥${value.toLocaleString()}` : '-'
    }
    if (field === 'commissionRate') {
      return `${(value || 0).toFixed(2)}%`
    }
    return value || '-'
  }

  const renderActionCell = (type: string, record: any) => {
    const rowKey = generateRowKey(type, record)

    if (editingRows.has(rowKey)) {
      // 编辑状态
      return (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<SaveOutlined />}
            onClick={() => handleSave(rowKey)}
          >
            保存
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleCancel(rowKey)}
          >
            取消
          </Button>
        </Space>
      )
    }

    // 非编辑状态
    return (
      <Space size="small">
        <Button
          type="link"
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(type, record)}
        >
          编辑
        </Button>
        <Button
          type="link"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(type, record.id!)}
        >
          删除
        </Button>
      </Space>
    )
  }

  // 合并实际数据和新增的编辑行数据
  const getTableDataSource = (type: string, actualData: any[]) => {
    const newRows = Object.keys(editingValues)
      .filter(key => editingValues[key]._type === type && editingValues[key]._isNew)
      .map(key => ({
        ...editingValues[key],
        id: key, // 使用key作为临时id
      }))
    return [...actualData, ...newRows]
  }

  // 检查某个类型是否有行在编辑状态
  const hasEditingRows = (type: string) => {
    return Array.from(editingRows).some(
      rowKey =>
        rowKey.startsWith(`${type}_`) ||
        (editingValues[rowKey] && editingValues[rowKey]._type === type)
    )
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
          {(errors.sales || errors.consultant || errors.other || errors.performance) && (
            <Alert
              message="接口请求失败"
              description="提成配置接口可能尚未实现，当前显示空数据以避免错误。请检查后端API是否正常运行。"
              type="warning"
              showIcon
              className="mb-4"
            />
          )}

          <Collapse defaultActiveKey={['sales', 'consultant', 'other', 'performance']} ghost>
            <Collapse.Panel
              header={
                <div className="flex justify-between items-center">
                  <span>业务销售提成配置</span>
                  <span className="text-gray-500 text-sm">
                    {commissionSummary.sales.length}条配置
                  </span>
                </div>
              }
              key="sales"
            >
              <Table
                columns={salesColumns}
                dataSource={getTableDataSource('sales', commissionSummary.sales)}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: '暂无业务销售提成配置' }}
              />
              {!hasEditingRows('sales') && (
                <div className="mt-2">
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => handleAdd('sales')}
                  >
                    新增业务销售提成配置
                  </Button>
                </div>
              )}
            </Collapse.Panel>

            <Collapse.Panel
              header={
                <div className="flex justify-between items-center">
                  <span>业务顾问提成配置</span>
                  <span className="text-gray-500 text-sm">
                    {commissionSummary.consultant.length}条配置
                  </span>
                </div>
              }
              key="consultant"
            >
              <Table
                columns={consultantColumns}
                dataSource={getTableDataSource('consultant', commissionSummary.consultant)}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: '暂无业务顾问提成配置' }}
              />
              {!hasEditingRows('consultant') && (
                <div className="mt-2">
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => handleAdd('consultant')}
                  >
                    新增业务顾问提成配置
                  </Button>
                </div>
              )}
            </Collapse.Panel>

            <Collapse.Panel
              header={
                <div className="flex justify-between items-center">
                  <span>业务其他提成配置</span>
                  <span className="text-gray-500 text-sm">
                    {commissionSummary.other.length}条配置
                  </span>
                </div>
              }
              key="other"
            >
              <Table
                columns={otherColumns}
                dataSource={getTableDataSource('other', commissionSummary.other)}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: '暂无业务其他提成配置' }}
              />
              {!hasEditingRows('other') && (
                <div className="mt-2">
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => handleAdd('other')}
                  >
                    新增业务其他提成配置
                  </Button>
                </div>
              )}
            </Collapse.Panel>

            <Collapse.Panel
              header={
                <div className="flex justify-between items-center">
                  <span>绩效提成配置</span>
                  <span className="text-gray-500 text-sm">
                    {commissionSummary.performance.length}条配置
                  </span>
                </div>
              }
              key="performance"
            >
              <Table
                columns={performanceColumns}
                dataSource={getTableDataSource('performance', commissionSummary.performance)}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: '暂无绩效提成配置' }}
              />
              {!hasEditingRows('performance') && (
                <div className="mt-2">
                  <Button
                    type="dashed"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => handleAdd('performance')}
                  >
                    新增绩效提成配置
                  </Button>
                </div>
              )}
            </Collapse.Panel>
          </Collapse>
        </Spin>
      </div>
    </div>
  )
}

export default CommissionPanel
