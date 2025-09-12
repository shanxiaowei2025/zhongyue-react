import React, { useState, useEffect } from 'react'
import { Table, Typography, Spin, message } from 'antd'
import request from '../api/request'

const { Title, Text } = Typography

interface LevelStats {
  [key: string]: number
}

interface AccountantData {
  accountantName: string
  accountantType: string
  clientCount: number
  levelStats: LevelStats
  department: string
}

interface AccountantStatsResponse {
  data: {
    list: AccountantData[]
    total: number
    page: number
    pageSize: number
    totalPages: number
    summary: {
      totalAccountants: number
      totalClients: number
      averageClientsPerAccountant: number
      topPerformer: {
        name: string
        clientCount: number
      }
    }
  }
  code: number
  message: string
  timestamp: number
}

interface AccountantStatsDisplayProps {
  accountantType: 'consultantAccountant' | 'bookkeepingAccountant' | 'invoiceOfficer'
}

const ACCOUNTANT_TYPE_LABELS = {
  consultantAccountant: '顾问会计',
  bookkeepingAccountant: '记账会计',
  invoiceOfficer: '开票员'
}

const AccountantStatsDisplay: React.FC<AccountantStatsDisplayProps> = ({ accountantType }) => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<AccountantData[]>([])

  useEffect(() => {
    fetchAccountantStats()
  }, [accountantType])

  const fetchAccountantStats = async () => {
    setLoading(true)
    try {
              const response = await request.get<AccountantStatsResponse>('/reports/accountant-client-stats', {
          params: {
            page: 1,
            pageSize: 9999999
          }
        })
      if (response.code === 0) {
        // 过滤指定类型的会计师数据
        const filteredData = response.data.list.filter((item: AccountantData) => item.accountantType === accountantType)
        setData(filteredData)
      } else {
        message.error(response.message || '获取数据失败')
      }
    } catch (error) {
      console.error('获取会计统计数据失败:', error)
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 准备表格数据
  const tableData = data.map((item, index) => ({
    key: index,
    accountantName: item.accountantName,
    clientCount: item.clientCount,
    levelStats: item.levelStats
  }))

  // 表格列定义
  const columns = [
    {
      title: '姓名',
      dataIndex: 'accountantName',
      key: 'accountantName',
      width: 100,
      render: (text: string) => (
        <Text strong style={{ fontSize: '12px', color: '#1890ff' }}>
          {text}
        </Text>
      ),
    },
    {
      title: '客户数量',
      dataIndex: 'clientCount',
      key: 'clientCount',
      width: 80,
      align: 'center' as const,
      render: (count: number) => (
        <Text style={{ fontSize: '12px', fontWeight: 'bold', color: '#52c41a' }}>
          {count}
        </Text>
      ),
    },
    {
      title: '客户分级统计',
      dataIndex: 'levelStats',
      key: 'levelStats',
      width: 250,
      render: (levelStats: LevelStats) => (
        <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
          {Object.entries(levelStats)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([level, count]) => (
              <span
                key={level}
                style={{
                  display: 'inline-block',
                  margin: '1px 2px',
                  padding: '1px 4px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '2px',
                  fontSize: '10px'
                }}
              >
                {level}: {count}
              </span>
            ))}
        </div>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: '700px', minWidth: '500px' }}>
      <Title level={5} style={{ margin: '0 0 12px 0', color: '#1890ff' }}>
        {ACCOUNTANT_TYPE_LABELS[accountantType]}统计信息
      </Title>

      <Spin spinning={loading}>
        <Table
          dataSource={tableData}
          columns={columns}
          pagination={false}
          size="small"
          bordered
          style={{ fontSize: '11px' }}
          scroll={{ y: 300 }}
          locale={{
            emptyText: loading ? '加载中...' : `暂无${ACCOUNTANT_TYPE_LABELS[accountantType]}数据`
          }}
        />
      </Spin>

      {data.length > 0 && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#666' }}>
          <Text type="secondary">
            共 {data.length} 位{ACCOUNTANT_TYPE_LABELS[accountantType]}，
            总客户数：{data.reduce((sum, item) => sum + item.clientCount, 0)}
          </Text>
        </div>
      )}
    </div>
  )
}

export default AccountantStatsDisplay 