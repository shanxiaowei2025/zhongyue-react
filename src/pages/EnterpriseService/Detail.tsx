import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Timeline,
  Descriptions,
  Spin,
  Tag,
  message,
  List,
  Space,
  Divider,
} from 'antd'
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { getServiceHistory, getExpenseContribution } from '../../api/enterpriseService'
import type { Enterprise, ServiceHistory, ExpenseRecord, ExpenseContribution } from '../../types/enterpriseService'
import dayjs from 'dayjs'

const { Title, Text } = Typography

// 字段映射，用于显示友好的字段名
const FIELD_MAPPING: Record<string, string> = {
  consultantAccountant: '顾问会计',
  bookkeepingAccountant: '记账会计',
  invoiceOfficer: '开票员',
  enterpriseStatus: '工商状态',
  businessStatus: '税务状态',
  customerLevel: '客户分级',
  location: '归属地',
  taxBureau: '所属分局',
  enterpriseType: '企业类型',
  contributionAmount: '费用贡献金额',
}

// 状态值映射
const STATUS_MAPPING: Record<string, { text: string; color: string }> = {
  normal: { text: '正常', color: 'green' },
  cancelled: { text: '注销', color: 'red' },
  logged_out: { text: '注销', color: 'red' },
  待分配: { text: '待分配', color: 'orange' },
}

const EnterpriseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState<boolean>(false)
  const [serviceHistory, setServiceHistory] = useState<ServiceHistory[]>([])
  const [enterprise, setEnterprise] = useState<Enterprise | null>(null)
  const [expenseLoading, setExpenseLoading] = useState<boolean>(false)
  const [expenseContribution, setExpenseContribution] = useState<ExpenseContribution | null>(null)

  // 从 localStorage 或者状态管理中获取企业信息
  // 这里简单使用 localStorage 存储，实际项目中可以使用更复杂的状态管理
  useEffect(() => {
    const savedEnterprise = localStorage.getItem('currentEnterprise')
    if (savedEnterprise) {
      try {
        setEnterprise(JSON.parse(savedEnterprise))
      } catch (error) {
        console.error('解析企业信息失败:', error)
      }
    }
  }, [])

  // 加载服务历程数据
  const loadServiceHistory = async () => {
    if (!enterprise) return

    try {
      setLoading(true)
      
      // 优先使用统一社会信用代码，没有则使用企业名称
      const params = enterprise.unifiedSocialCreditCode
        ? { unifiedSocialCreditCode: enterprise.unifiedSocialCreditCode }
        : { companyName: enterprise.companyName }

      const response = await getServiceHistory(params)
      
      if (response.code === 0 && response.data) {
        // 按创建时间从早到晚排序（从上往下显示）
        const sortedHistory = response.data.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        setServiceHistory(sortedHistory)
      }
    } catch (error) {
      console.error('加载服务历程失败:', error)
      message.error('加载服务历程失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载费用贡献数据
  const loadExpenseContribution = async () => {
    if (!enterprise) return

    try {
      setExpenseLoading(true)
      
      // 优先使用统一社会信用代码，没有则使用企业名称
      const params = enterprise.unifiedSocialCreditCode
        ? { unifiedSocialCreditCode: enterprise.unifiedSocialCreditCode }
        : { companyName: enterprise.companyName }

      const response = await getExpenseContribution(params)
      
      if (response.code === 0 && response.data) {
        // 按收费时间从早到晚排序，时间相同时按收据编号排序
        const sortedExpenses = {
          ...response.data,
          expenses: response.data.expenses.sort((a, b) => {
            // 首先按时间排序（从早到晚）
            const timeComparison = new Date(a.chargeDate).getTime() - new Date(b.chargeDate).getTime()
            
            // 如果时间相同，则按收据编号排序
            if (timeComparison === 0) {
              return a.receiptNo.localeCompare(b.receiptNo)
            }
            
            return timeComparison
          })
        }
        setExpenseContribution(sortedExpenses)
      }
    } catch (error) {
      console.error('加载费用贡献失败:', error)
      message.error('加载费用贡献失败')
    } finally {
      setExpenseLoading(false)
    }
  }

  useEffect(() => {
    if (enterprise) {
      loadServiceHistory()
      loadExpenseContribution()
    }
  }, [enterprise])

  // 返回列表
  const handleBack = () => {
    navigate('/enterprise-service')
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
  }

  // 格式化收费日期（简化版本）
  const formatChargeDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY-MM-DD')
  }

  // 格式化金额
  const formatAmount = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return '¥0.00'
    
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(numAmount)
  }

  // 生成收据链接 - 这里假设有一个收据查看的路由
  const getReceiptLink = (receiptNo: string) => {
    // 根据实际业务需求调整链接格式
    return `/receipts/${receiptNo}`
  }

  // 处理收据链接点击
  const handleReceiptClick = (receiptNo: string) => {
    // 这里可以打开新窗口或者跳转到收据详情页
    // 暂时用 message 提示，实际项目中可以替换为真实的跳转逻辑
    message.info(`跳转到收据: ${receiptNo}`)
  }

  // 格式化字段值
  const formatFieldValue = (key: string, value: any) => {
    if (value === null || value === undefined) {
      return <Text type="secondary">未设置</Text>
    }

    // 处理状态字段
    if (key.includes('Status') || key.includes('status')) {
      const status = STATUS_MAPPING[value] || { text: value, color: 'default' }
      return <Tag color={status.color}>{status.text}</Tag>
    }

    // 处理金额字段
    if (key.includes('Amount') || key.includes('amount')) {
      const amount = parseFloat(value)
      if (!isNaN(amount)) {
        return new Intl.NumberFormat('zh-CN', {
          style: 'currency',
          currency: 'CNY',
          minimumFractionDigits: 2,
        }).format(amount)
      }
    }

    return value
  }

  // 检查历程记录是否包含注销状态
  const isTerminationRecord = (history: ServiceHistory) => {
    const updatedFields = history.updatedFields
    return Object.values(updatedFields).some(value => 
      value === 'cancelled' || value === 'logged_out'
    )
  }

  // 渲染服务历程项
  const renderHistoryItem = (history: ServiceHistory) => {
    const updatedFieldsEntries = Object.entries(history.updatedFields)
    
    return (
      <div key={history.id}>
        <div style={{ marginBottom: 8 }}>
          <Text strong>{formatDate(history.updatedAt)}</Text>
        </div>
        <div>
          {updatedFieldsEntries.map(([key, value]) => (
            <div key={key} style={{ marginBottom: 4 }}>
              <Text type="secondary">{FIELD_MAPPING[key] || key}：</Text>
              <span style={{ marginLeft: 8 }}>
                {formatFieldValue(key, value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!enterprise) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>加载中...</div>
      </div>
    )
  }

  return (
    <div className="enterprise-detail">
      <div style={{ marginBottom: 24 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          返回列表
        </Button>
      </div>

      <Title level={2}>{enterprise.companyName}</Title>
      
      <Card style={{ marginBottom: 24 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="企业名称">{enterprise.companyName}</Descriptions.Item>
          <Descriptions.Item label="统一社会信用代码">
            {enterprise.unifiedSocialCreditCode || '未设置'}
          </Descriptions.Item>
          <Descriptions.Item label="顾问会计">
            {enterprise.consultantAccountant || '未设置'}
          </Descriptions.Item>
          <Descriptions.Item label="记账会计">
            {enterprise.bookkeepingAccountant || '未设置'}
          </Descriptions.Item>
          <Descriptions.Item label="归属地">
            {enterprise.location || '未设置'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {enterprise.createTime ? formatDate(enterprise.createTime) : '未设置'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Card 
            title={
              <span>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                服务历程
              </span>
            }
            style={{ height: 600, overflow: 'auto' }}
          >
            <Spin spinning={loading}>
              {serviceHistory.length > 0 ? (
                <Timeline>
                  <Timeline.Item color="green">
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>{enterprise.createTime ? formatDate(enterprise.createTime) : '未知时间'}</Text>
                      </div>
                      <div>
                        <Text type="secondary">服务开始</Text>
                      </div>
                    </div>
                  </Timeline.Item>
                  
                  {serviceHistory.map((history) => (
                    <Timeline.Item 
                      key={history.id}
                      color={isTerminationRecord(history) ? 'red' : 'blue'}
                    >
                      {renderHistoryItem(history)}
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Timeline>
                  <Timeline.Item color="green">
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>{enterprise.createTime ? formatDate(enterprise.createTime) : '未知时间'}</Text>
                      </div>
                      <div>
                        <Text type="secondary">服务开始</Text>
                      </div>
                    </div>
                  </Timeline.Item>
                </Timeline>
              )}
            </Spin>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card 
            title={
              <span>
                <DollarCircleOutlined style={{ marginRight: 8 }} />
                费用贡献
              </span>
            }
            style={{ height: 600, overflow: 'auto' }}
          >
            <Spin spinning={expenseLoading}>
              {expenseContribution && expenseContribution.expenses.length > 0 ? (
                <>
                  <List
                    dataSource={expenseContribution.expenses}
                    renderItem={(expense: ExpenseRecord) => (
                      <List.Item
                        key={expense.id}
                        style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}
                      >
                        <div style={{ width: '100%' }}>
                          <Row justify="space-between" align="middle">
                            <Col span={16}>
                              <Space direction="vertical" size="small">
                                <Text strong>{formatChargeDate(expense.chargeDate)}</Text>
                                <Button
                                  type="link"
                                  icon={<FileTextOutlined />}
                                  onClick={() => handleReceiptClick(expense.receiptNo)}
                                  style={{ padding: 0, height: 'auto' }}
                                >
                                  收据: {expense.receiptNo}
                                </Button>
                              </Space>
                            </Col>
                            <Col span={8} style={{ textAlign: 'right' }}>
                              <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                                {formatAmount(expense.totalFee)}
                              </Text>
                            </Col>
                          </Row>
                        </div>
                      </List.Item>
                    )}
                  />
                  <Divider />
                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <div style={{ fontSize: 16, marginBottom: 8 }}>
                      <Text type="secondary">费用合计</Text>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                      {formatAmount(expenseContribution.totalAmount)}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: 50 }}>
                  <Text type="secondary">暂无费用贡献记录</Text>
                </div>
              )}
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default EnterpriseDetail 