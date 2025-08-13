import React from 'react'
import { Card, Descriptions, Button, Space, Typography, Spin, message, Tag, List } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { useTaxVerificationDetail } from '../../hooks/useTaxVerification'
import type { TaxVerification, TaxVerificationAttachment } from '../../types/taxVerification'

const { Title } = Typography

const TaxReviewDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  // 使用统一的hook获取数据
  const { data, loading, error } = useTaxVerificationDetail(id ? Number(id) : null)

  // 处理错误
  if (error) {
    message.error('获取详情失败')
  }

  // 返回列表
  const handleBack = () => {
    navigate('/tax-review')
  }

  // 下载附件
  const handleDownload = (attachment: TaxVerificationAttachment) => {
    if (attachment.url) {
      window.open(attachment.url, '_blank')
    } else {
      message.warning('文件链接不存在')
    }
  }

  if (loading) {
    return (
      <div className="tax-review-detail-page" style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="tax-review-detail-page">
        <div className="mb-6">
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回
            </Button>
          </Space>
        </div>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Typography.Text type="secondary">未找到相关记录</Typography.Text>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="tax-review-detail-page">
      <div className="mb-6">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回
          </Button>
        </Space>
      </div>

      <Card>
        <Descriptions
          title="基本信息"
          bordered
          column={2}
          labelStyle={{ width: '150px', fontWeight: 'bold' }}
        >
          <Descriptions.Item label="企业名称" span={2}>
            {data.companyName}
          </Descriptions.Item>

          <Descriptions.Item label="统一社会信用代码" span={2}>
            {data.unifiedSocialCreditCode}
          </Descriptions.Item>

          <Descriptions.Item label="所属分局">{data.taxBureau}</Descriptions.Item>

          <Descriptions.Item label="风险期责任会计">{data.responsibleAccountant}</Descriptions.Item>

          <Descriptions.Item label="风险下发日期">
            {data.riskIssuedDate ? dayjs(data.riskIssuedDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>

          <Descriptions.Item label="风险发生日期">
            {data.riskOccurredDate ? dayjs(data.riskOccurredDate).format('YYYY-MM-DD') : '-'}
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 24 }}>
          <Descriptions
            title="详细信息"
            bordered
            column={1}
            labelStyle={{ width: '150px', fontWeight: 'bold' }}
          >
            <Descriptions.Item label="风险原因">
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {data.riskReason || '-'}
              </div>
            </Descriptions.Item>

            <Descriptions.Item label="解决方案">
              <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {data.solution || '-'}
              </div>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {data.attachments && data.attachments.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <Title level={4}>附件列表</Title>
            <List
              bordered
              dataSource={data.attachments}
              renderItem={(attachment, index) => (
                <List.Item
                  key={index}
                  actions={[
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownload(attachment)}
                    >
                      下载
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={attachment.name}
                    description={attachment.url ? `文件路径: ${attachment.url}` : '文件路径不存在'}
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Card>
    </div>
  )
}

export default TaxReviewDetail
