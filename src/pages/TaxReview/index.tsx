import React from 'react'
import { Card, Typography, Empty } from 'antd'

const { Title } = Typography

const TaxReview: React.FC = () => {
  return (
    <div className="tax-review-page">
      <div className="mb-6">
        <Title level={2} className="!mb-0">
          税务核查
        </Title>
      </div>

      <Card>
        <Empty
          description="税务核查功能正在开发中，敬请期待..."
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    </div>
  )
}

export default TaxReview 