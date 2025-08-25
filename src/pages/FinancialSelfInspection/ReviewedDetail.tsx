import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Typography, Descriptions, Spin, Tag, message, Space, Timeline } from 'antd'
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  BuildOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useReviewedInspectionDetail } from '../../hooks/useFinancialSelfInspection'
import { FinancialSelfInspectionStatus } from '../../types/financialSelfInspection'
import type {
  RectificationRecordItem,
  ApprovalRecordItem,
  RejectRecordItem,
  ReviewerApprovalRecordItem,
  ReviewerRejectRecordItem,
} from '../../types/financialSelfInspection'

const { Text } = Typography

// 时间线记录项类型
interface TimelineRecord {
  date: string
  type: 'rectification' | 'approval' | 'reject' | 'reviewer_approval' | 'reviewer_reject'
  content: string
  title: string
}

const FinancialSelfInspectionReviewedDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // 使用统一的hook获取数据
  const { data, loading, error } = useReviewedInspectionDetail(id ? Number(id) : null)

  // 处理错误
  if (error) {
    message.error('获取详情失败')
  }

  // 返回列表
  const handleBack = () => {
    navigate('/financial-self-inspection')
  }

  // 渲染状态标签
  const renderStatusTag = () => {
    if (!data) return null

    switch (data.status) {
      case FinancialSelfInspectionStatus.SUBMITTED:
        return (
          <Tag color="orange" icon={<ExclamationCircleOutlined />}>
            待整改
          </Tag>
        )
      case FinancialSelfInspectionStatus.RECTIFIED:
        return (
          <Tag color="blue" icon={<CalendarOutlined />}>
            已整改
          </Tag>
        )
      case FinancialSelfInspectionStatus.INSPECTOR_APPROVED:
        return (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            抽查人确认
          </Tag>
        )
      case FinancialSelfInspectionStatus.INSPECTOR_REJECTED:
        return (
          <Tag color="red" icon={<CloseCircleOutlined />}>
            抽查人退回
          </Tag>
        )
      case FinancialSelfInspectionStatus.REVIEWER_APPROVED:
        return (
          <Tag color="cyan" icon={<CheckCircleOutlined />}>
            复查人确认
          </Tag>
        )
      case FinancialSelfInspectionStatus.REVIEWER_REJECTED:
        return (
          <Tag color="magenta" icon={<CloseCircleOutlined />}>
            复查人退回
          </Tag>
        )
      default:
        return <Tag color="default">未知状态</Tag>
    }
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

  // 合并所有记录为时间线
  const getTimelineRecords = (): TimelineRecord[] => {
    if (!data) return []

    const records: TimelineRecord[] = []

    // 整改记录
    data.rectificationRecords?.forEach((record: RectificationRecordItem) => {
      records.push({
        date: record.date,
        type: 'rectification',
        title: '整改完成',
        content: record.result,
      })
    })

    // 审核通过记录
    data.approvalRecords?.forEach((record: ApprovalRecordItem) => {
      records.push({
        date: record.date,
        type: 'approval',
        title: '抽查人确认',
        content: record.remark || '无备注',
      })
    })

    // 审核退回记录
    data.rejectRecords?.forEach((record: RejectRecordItem) => {
      records.push({
        date: record.date,
        type: 'reject',
        title: '抽查人退回',
        content: record.reason,
      })
    })

    // 复查审核通过记录
    data.reviewerApprovalRecords?.forEach((record: ReviewerApprovalRecordItem) => {
      records.push({
        date: record.date,
        type: 'reviewer_approval',
        title: '复查人确认',
        content: record.remark || '无备注',
      })
    })

    // 复查审核退回记录
    data.reviewerRejectRecords?.forEach((record: ReviewerRejectRecordItem) => {
      records.push({
        date: record.date,
        type: 'reviewer_reject',
        title: '复查人退回',
        content: record.reason,
      })
    })

    // 按日期降序排序
    return records.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf())
  }

  // 获取时间线图标和颜色
  const getTimelineProps = (type: TimelineRecord['type']) => {
    switch (type) {
      case 'rectification':
        return { color: 'blue', dot: <CalendarOutlined /> }
      case 'approval':
        return { color: 'green', dot: <CheckCircleOutlined /> }
      case 'reject':
        return { color: 'red', dot: <CloseCircleOutlined /> }
      case 'reviewer_approval':
        return { color: 'cyan', dot: <CheckCircleOutlined /> }
      case 'reviewer_reject':
        return { color: 'magenta', dot: <CloseCircleOutlined /> }
      default:
        return { color: 'gray', dot: <EyeOutlined /> }
    }
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

  const timelineRecords = getTimelineRecords()

  return (
    <div className="financial-self-inspection-reviewed-detail">
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
          {data.reviewer && (
            <Descriptions.Item label="复查人">
              <Space>
                <UserOutlined />
                <Text>{data.reviewer}</Text>
              </Space>
            </Descriptions.Item>
          )}
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
                <Text type="secondary" italic>
                  暂无问题描述
                </Text>
              )}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="解决方案">
            <div className="whitespace-pre-wrap">
              {data.solution || (
                <Text type="secondary" italic>
                  暂无解决方案
                </Text>
              )}
            </div>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* 整改情况时间线 */}
      <Card
        title={
          <Space>
            <CheckCircleOutlined />
            <span>整改情况</span>
          </Space>
        }
        className="mb-6"
      >
        {timelineRecords.length > 0 ? (
          <Timeline>
            {timelineRecords.map((record, index) => {
              const props = getTimelineProps(record.type)
              return (
                <Timeline.Item key={index} {...props}>
                  <div className="mb-2">
                    <Text strong>{record.title}</Text>
                    <Text type="secondary" className="ml-2">
                      {formatDate(record.date)}
                    </Text>
                  </div>
                  <div className="whitespace-pre-wrap text-gray-600">{record.content}</div>
                </Timeline.Item>
              )
            })}
          </Timeline>
        ) : (
          <div className="text-center py-8">
            <Text type="secondary" italic>
              暂无整改记录
            </Text>
          </div>
        )}
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
          <Descriptions.Item label="当前状态">{renderStatusTag()}</Descriptions.Item>
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

export default FinancialSelfInspectionReviewedDetail
