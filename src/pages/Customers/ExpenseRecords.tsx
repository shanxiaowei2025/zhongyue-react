import React, { useState } from 'react'
import { Table, Button, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { ExpenseStatus } from '../../types/expense'
import { useExpenseList } from '../../hooks/useExpense'
import ExpenseReceipt from '../Expenses/ExpenseReceipt'

interface ExpenseRecordsProps {
  customerId: number
  companyName?: string
}

const ExpenseRecords: React.FC<ExpenseRecordsProps> = ({ customerId, companyName }) => {
  const [currentExpenseId, setCurrentExpenseId] = useState<number | null>(null)
  const [expenseDetailVisible, setExpenseDetailVisible] = useState(false)

  // 获取费用记录，使用 companyName 进行过滤
  const { expenses, total: expensesTotal, isLoading: expensesLoading } = useExpenseList({
    page: 1,
    pageSize: 10,
    companyName: companyName,
  })

  const handleViewExpense = (expenseId: number) => {
    setCurrentExpenseId(expenseId)
    setExpenseDetailVisible(true)
  }

  const handleCloseExpenseDetail = () => {
    setExpenseDetailVisible(false)
    setCurrentExpenseId(null)
  }

  if (!customerId || !companyName) {
    return (
      <div className="text-center text-gray-500 py-8">
        客户信息不完整，无法加载费用记录
      </div>
    )
  }

  return (
    <>
      <Table
        dataSource={expenses}
        rowKey="id"
        loading={expensesLoading}
        pagination={{
          total: expensesTotal,
          pageSize: 10,
          showSizeChanger: false,
          showTotal: total => `共 ${total} 条`,
        }}
        columns={[
          {
            title: '企业名称',
            dataIndex: 'companyName',
            key: 'companyName',
          },
          {
            title: '总计费用',
            dataIndex: 'totalFee',
            key: 'totalFee',
            render: value => `¥${value}`,
          },
          {
            title: '业务类型',
            dataIndex: 'businessType',
            key: 'businessType',
          },
          {
            title: '代理费起止日期',
            key: 'agencyDateRange',
            render: (_, record) => (
              record.agencyStartDate ? 
              `${record.agencyStartDate?.split('T')[0] || ''} ~ ${record.agencyEndDate?.split('T')[0] || ''}` : 
              '-'
            ),
          },
          {
            title: '收费日期',
            dataIndex: 'chargeDate',
            key: 'chargeDate',
            render: value => value?.split('T')[0] || '-',
          },
          {
            title: '业务员',
            dataIndex: 'salesperson',
            key: 'salesperson',
          },
          {
            title: '审核状态',
            dataIndex: 'status',
            key: 'status',
            render: status => {
              const statusMap = {
                [ExpenseStatus.Pending]: { text: '待审核', color: '#faad14' },
                [ExpenseStatus.Approved]: { text: '已审核', color: '#52c41a' },
                [ExpenseStatus.Rejected]: { text: '已退回', color: '#f5222d' },
              }
              const currentStatus = statusMap[status as ExpenseStatus]
              return <Tag color={currentStatus.color}>{currentStatus.text}</Tag>
            },
          },
          {
            title: '操作',
            key: 'action',
            render: (_, record) => (
              <Button 
                type="link" 
                icon={<SearchOutlined />}
                onClick={() => handleViewExpense(record.id)}
              >
                查看收据
              </Button>
            ),
          },
        ]}
      />
      
      {/* 费用详情对话框 */}
      {currentExpenseId && (
        <ExpenseReceipt 
          visible={expenseDetailVisible} 
          expenseId={currentExpenseId} 
          onClose={handleCloseExpenseDetail}
          previewMode={true}
        />
      )}
    </>
  )
}

export default ExpenseRecords 