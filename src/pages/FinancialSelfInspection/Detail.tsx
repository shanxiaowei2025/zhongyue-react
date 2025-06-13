import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Typography,
  Descriptions,
  Spin,
  Tag,
  message,
  Space,
  Divider,
} from 'antd'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  BuildOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { getMySubmittedInspectionDetail } from '../../api/financialSelfInspection'
import type { FinancialSelfInspection } from '../../types/financialSelfInspection'

const { Title, Text } = Typography

const FinancialSelfInspectionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState<boolean>(false)
  const [data, setData] = useState<FinancialSelfInspection | null>(null)

  // 加载详情数据
  const loadDetailData = async () => {
    if (!id) {
      message.error('缺少记录ID')
      return
    }

    try {
      setLoading(true)
      const response = await getMySubmittedInspectionDetail(Number(id))
      
      if (response.code === 0 && response.data) {
        setData(response.data)
      } else {
        message.error(response.message || '获取详情失败')
      }
    } catch (error) {
      console.error('加载账务自查详情失败:', error)
      message.error('加载详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDetailData()
  }, [id])

  // 返回列表
  const handleBack = () => {
    navigate('/financial-self-inspection')
  }

  // 渲染状态标签
  const renderStatusTag = () => {
    if (!data) return null

    if (data.inspectorConfirmation) {
      return <Tag color="green" icon={<CheckCircleOutlined />}>已确认</Tag>
    }
    if (data.rectificationCompletionDate) {
      return <Tag color="blue" icon={<CalendarOutlined />}>整改完成</Tag>
    }
    if (data.problem) {
      return <Tag color="orange" icon={<ExclamationCircleOutlined />}>待整改</Tag>
    }
    return <Tag color="default">已提交</Tag>
  }

  // 格式化日期
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return dayjs(dateString).format('YYYY-MM-DD')
  }

  // 格式化时间
  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-'
    return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
  }

  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Text type="secondary">未找到相关记录</Text>
          <div className="mt-4">
            <Button type="primary" onClick={handleBack}>
              返回列表
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="financial-self-inspection-detail">
      {/* 顶部操作栏 */}
      <div className="mb-6 flex items-center justify-between">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回列表
          </Button>
          {renderStatusTag()}
        </Space>
      </div>

      {/* 基本信息 */}
      <Card 
        title={
          <Space>
            <BuildOutlined />
            <span>基本信息</span>
          </Space>
        }
        className="mb-6"
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="企业名称" span={2}>
            <Text strong>{data.companyName || '-'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="统一社会信用代码" span={2}>
            <Text code>{data.unifiedSocialCreditCode || '-'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="抽查日期">
            <Space>
              <CalendarOutlined />
              <Text>{formatDate(data.inspectionDate)}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="抽查人">
            <Space>
              <UserOutlined />
              <Text>{data.inspector || '-'}</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="记账会计">
            <Text>{data.bookkeepingAccountant || '-'}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="顾问会计">
            <Text>{data.consultantAccountant || '-'}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 问题与解决方案 */}
      <Card 
        title={
          <Space>
            <ExclamationCircleOutlined />
            <span>问题与解决方案</span>
          </Space>
        }
        className="mb-6"
      >
        <Descriptions column={1} bordered>
          <Descriptions.Item label="发现问题">
            <div className="whitespace-pre-wrap">
              {data.problem || (
                <Text type="secondary" italic>暂无问题描述</Text>
              )}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="解决方案">
            <div className="whitespace-pre-wrap">
              {data.solution || (
                <Text type="secondary" italic>暂无解决方案</Text>
              )}
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 整改情况 */}
      <Card 
        title={
          <Space>
            <CheckCircleOutlined />
            <span>整改情况</span>
          </Space>
        }
        className="mb-6"
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="整改完成日期">
            {data.rectificationCompletionDate ? (
              <Space>
                <CalendarOutlined />
                <Text>{formatDate(data.rectificationCompletionDate)}</Text>
                <Tag color="blue">已完成</Tag>
              </Space>
            ) : (
              <Text type="secondary">-</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="整改结果">
            <div className="whitespace-pre-wrap">
              {data.rectificationResult || (
                <Text type="secondary" italic>暂无整改结果</Text>
              )}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="抽查人确认完成日期">
            {data.inspectorConfirmation ? (
              <Space>
                <CalendarOutlined />
                <Text>{formatDate(data.inspectorConfirmation)}</Text>
                <Tag color="green">已确认</Tag>
              </Space>
            ) : (
              <Text type="secondary">-</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="备注">
            <div className="whitespace-pre-wrap">
              {data.remarks || (
                <Text type="secondary" italic>暂无备注</Text>
              )}
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 状态信息 */}
      <Card 
        title={
          <Space>
            <CalendarOutlined />
            <span>状态信息</span>
          </Space>
        }
      >
        <Descriptions column={2} bordered>
          <Descriptions.Item label="记录ID">
            <Text code>#{data.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="当前状态">
            {renderStatusTag()}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            <Text>{formatDateTime(data.createdAt)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            <Text>{formatDateTime(data.updatedAt)}</Text>
          </Descriptions.Item>
        </Descriptions>
      </Card>


    </div>
  )
}

export default FinancialSelfInspectionDetail 