import React from 'react'
import { Card, Empty, Alert } from 'antd'
import type { CommissionConfig } from '../../../types/salaryIntegrated'

interface CommissionPanelProps {
  employeeName: string
  yearMonth: string
  data?: CommissionConfig[]
  onUpdate: (data: any) => Promise<any>
}

const CommissionPanel: React.FC<CommissionPanelProps> = ({
  employeeName,
  yearMonth,
  data,
  onUpdate,
}) => {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">提成配置</h4>
      </div>

      {/* 暂时显示提示信息，实际项目中需要根据具体需求实现 */}
      <Alert
        message="提成配置功能"
        description="此功能用于配置和查看员工的各类提成计算规则，包括代理费提成、业务销售提成、业务顾问提成、绩效提成等。具体实现需要根据业务需求进行开发。"
        type="info"
        showIcon
        className="mb-4"
      />

      <div className="space-y-4">
        <Card title="代理费提成" size="small">
          <Empty description="暂无代理费提成数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>

        <Card title="业务销售提成" size="small">
          <Empty description="暂无业务销售提成数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>

        <Card title="业务顾问提成" size="small">
          <Empty description="暂无业务顾问提成数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>

        <Card title="绩效提成" size="small">
          <Empty description="暂无绩效提成数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      </div>
    </div>
  )
}

export default CommissionPanel
