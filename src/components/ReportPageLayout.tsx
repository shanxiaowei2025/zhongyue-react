import React from 'react'
import { Button, Typography } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ReportPageLayoutProps } from '../types/advancedServerTable'

const { Title } = Typography

const ReportPageLayout: React.FC<ReportPageLayoutProps> = ({
  title,
  subtitle,
  backgroundColor = 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
  titleColor = '#ffffff',
  onBack,
  children,
}) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate('/reports')
    }
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#ffffff', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 24,
          background: backgroundColor,
          padding: '20px 24px',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          style={{ color: titleColor, marginRight: 16 }}
        >
          返回
        </Button>
        <div>
          <Title level={2} style={{ margin: 0, color: titleColor, fontWeight: 600 }}>
            {title}
          </Title>
          {subtitle && (
            <div style={{ color: titleColor, opacity: 0.8, marginTop: 4 }}>{subtitle}</div>
          )}
        </div>
      </div>

      {/* 页面内容 */}
      {children}
    </div>
  )
}

export default ReportPageLayout
