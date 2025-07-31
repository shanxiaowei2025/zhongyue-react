import React from 'react'
import { Tabs, Empty } from 'antd'
import type { TabsProps } from 'antd'
import type { SalaryRecord, RelatedData } from '../../../types/salaryIntegrated'
import SocialInsurancePanel from './SocialInsurancePanel'
import SubsidyPanel from './SubsidyPanel'
import DeductionPanel from './DeductionPanel'

interface RelatedDataTabsProps {
  employee: SalaryRecord | null
  yearMonth: string
  relatedData: RelatedData
  onUpdate: (type: string, data: any) => Promise<any>
}

const RelatedDataTabs: React.FC<RelatedDataTabsProps> = ({
  employee,
  yearMonth,
  relatedData,
  onUpdate,
}) => {
  if (!employee) {
    return (
      <div className="h-full flex items-center justify-center">
        <Empty description="请选择员工查看关联数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </div>
    )
  }

  const items: TabsProps['items'] = [
    {
      key: 'social-insurance',
      label: '社保信息',
      children: (
        <SocialInsurancePanel
          employeeName={employee.name}
          yearMonth={yearMonth}
          data={relatedData.socialInsurance}
          onUpdate={data => onUpdate('socialInsurance', data)}
        />
      ),
    },
    {
      key: 'subsidy',
      label: '补贴明细',
      children: (
        <SubsidyPanel
          employeeName={employee.name}
          yearMonth={yearMonth}
          data={relatedData.subsidy}
          onUpdate={data => onUpdate('subsidy', data)}
        />
      ),
    },
    {
      key: 'attendance',
      label: '考勤扣款',
      children: (
        <DeductionPanel
          type="attendance"
          employeeName={employee.name}
          yearMonth={yearMonth}
          data={relatedData.attendance}
          onUpdate={data => onUpdate('attendance', data)}
        />
      ),
    },
    {
      key: 'friend-circle',
      label: '朋友圈扣款',
      children: (
        <DeductionPanel
          type="friendCircle"
          employeeName={employee.name}
          yearMonth={yearMonth}
          data={relatedData.friendCircle}
          onUpdate={data => onUpdate('friendCircle', data)}
        />
      ),
    },
  ]

  return (
    <div className="h-full">
      <Tabs
        items={items}
        size="small"
        style={{ height: '100%' }}
        tabBarStyle={{
          margin: 0,
          paddingLeft: 24,
          paddingRight: 24,
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
        }}
      />
    </div>
  )
}

export default RelatedDataTabs
