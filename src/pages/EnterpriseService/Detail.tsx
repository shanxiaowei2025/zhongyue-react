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
} from 'antd'
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
} from '@ant-design/icons'
import { getServiceHistory } from '../../api/enterpriseService'
import type { Enterprise, ServiceHistory } from '../../types/enterpriseService'
import dayjs from 'dayjs'

const { Title, Text } = Typography

// 字段映射，用于显示友好的字段名
const FIELD_MAPPING: Record<string, string> = {
  consultantAccountant: '顾问会计',
  bookkeepingAccountant: '记账会计',
  invoiceOfficer: '开票员',
  enterpriseStatus: '企业状态',
  businessStatus: '经营状态',
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

  useEffect(() => {
    if (enterprise) {
      loadServiceHistory()
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

  // 格式化企业费用贡献金额
  const formatCurrency = (amount?: string | null) => {
    if (amount === undefined || amount === null) return '¥0.00'
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount)) return '¥0.00'
    
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(numAmount)
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
                  {serviceHistory.map((history) => (
                    <Timeline.Item key={history.id}>
                      {renderHistoryItem(history)}
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <div style={{ textAlign: 'center', padding: 50 }}>
                  <Text type="secondary">暂无服务历程记录</Text>
                </div>
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
            style={{ height: 600 }}
          >
            <div style={{ textAlign: 'center', padding: 50 }}>
              <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
                总贡献金额
              </div>
              <div style={{ fontSize: 36, color: '#1890ff', fontWeight: 'bold' }}>
                {formatCurrency(enterprise.contributionAmount)}
              </div>
              <div style={{ marginTop: 24, color: '#666' }}>
                <Text type="secondary">更多费用详情功能开发中...</Text>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default EnterpriseDetail 