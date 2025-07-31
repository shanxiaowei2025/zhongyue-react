import React from 'react'
import { Table, Space, Button, Tag, Popconfirm, Tooltip } from 'antd'
import { EditOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import type { ColumnsType, TableProps } from 'antd/es/table'
import type { Employee } from '../types/employee'

interface EmployeeTableProps extends Omit<TableProps<Employee>, 'columns' | 'dataSource'> {
  employees: Employee[]
  onEdit: (employee: Employee) => void
  onView: (employee: Employee) => void
  onDelete: (employee: Employee) => void
  loading?: boolean
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onEdit,
  onView,
  onDelete,
  loading,
  ...tableProps
}) => {
  const columns: ColumnsType<Employee> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
      fixed: 'left',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      fixed: 'left',
      render: (name: string) => (
        <Tooltip title={name}>
          <span>{name}</span>
        </Tooltip>
      ),
    },
    {
      title: '员工类型',
      dataIndex: 'employeeType',
      key: 'employeeType',
      width: 100,
      render: (type: string) => {
        if (!type) return '-'
        const colors = {
          正式: 'green',
          实习: 'blue',
          临时: 'orange',
          外包: 'purple',
        }
        return <Tag color={colors[type as keyof typeof colors] || 'default'}>{type}</Tag>
      },
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      width: 120,
      render: (position: string) => position || '-',
    },
    {
      title: '职级',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      render: (rank: string) => rank || '-',
    },
    {
      title: '提成比率职位',
      dataIndex: 'commissionRatePosition',
      key: 'commissionRatePosition',
      width: 120,
      render: (position: string) => position || '-',
    },
    {
      title: '在职状态',
      dataIndex: 'isResigned',
      key: 'isResigned',
      width: 100,
      render: (isResigned: boolean) => (
        <Tag color={!isResigned ? 'success' : 'error'}>{!isResigned ? '在职' : '已离职'}</Tag>
      ),
    },
    {
      title: '基础工资',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 120,
      render: (salary: number) => (salary ? `¥${salary.toLocaleString()}` : '-'),
    },
    {
      title: '工龄',
      dataIndex: 'workYears',
      key: 'workYears',
      width: 80,
      render: (years: number) => (years !== undefined && years !== null ? `${years}年` : '-'),
    },
    {
      title: '身份证号',
      dataIndex: 'idCardNumber',
      key: 'idCardNumber',
      width: 180,
      render: (idCard: string) => {
        if (!idCard) return '-'
        return (
          <Tooltip title={idCard}>
            <span>{idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')}</span>
          </Tooltip>
        )
      },
    },
    {
      title: '银行卡号',
      dataIndex: 'bankCardNumber',
      key: 'bankCardNumber',
      width: 180,
      render: (bankCard: string) => {
        if (!bankCard) return '-'
        return (
          <Tooltip title={bankCard}>
            <span>{bankCard.replace(/(\d{4})\d{8,11}(\d{4})/, '$1****$2')}</span>
          </Tooltip>
        )
      },
    },
    {
      title: '开户银行',
      dataIndex: 'bankName',
      key: 'bankName',
      width: 150,
      render: (bankName: string) => bankName || '-',
    },
    {
      title: '入职时间',
      dataIndex: 'hireDate',
      key: 'hireDate',
      width: 120,
      render: (date: string) => (date ? dayjs(date).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '生日',
      dataIndex: 'birthday',
      key: 'birthday',
      width: 120,
      render: (date: string) => (date ? dayjs(date).format('MM-DD') : '-'),
    },
    {
      title: '实际生日',
      dataIndex: 'actualBirthday',
      key: 'actualBirthday',
      width: 120,
      render: (birthday: string) => birthday || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (createdAt: string) => dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (updatedAt: string) => dayjs(updatedAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 120,
      render: (_: unknown, record: Employee) => (
        <Space size="small" className="flex flex-nowrap">
          <Tooltip title="查看">
            <Button type="link" icon={<EyeOutlined />} onClick={() => onView(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="删除员工"
            description={`确定要删除员工"${record.name}"吗？此操作不可恢复。`}
            okText="确定"
            cancelText="取消"
            okType="danger"
            onConfirm={() => onDelete(record)}
          >
            <Tooltip title="删除">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={employees}
      loading={loading}
      rowKey="id"
      scroll={{ x: 2530 }}
      size="middle"
      {...tableProps}
    />
  )
}
