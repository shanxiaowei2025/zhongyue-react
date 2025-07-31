import React, { useState } from 'react'
import { Button, Spin, Tabs } from 'antd'
import type { TabsProps } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useSalaryIntegrated } from '../../hooks/useSalaryIntegrated'
import MonthSelector from './components/MonthSelector'
import SalaryOverview from './components/SalaryOverview'
import SalaryDetails from './components/SalaryDetails'
import RelatedDataTabs from './components/RelatedDataTabs'
import ImportExportPanel from './components/ImportExportPanel'
import CommissionPanel from './components/CommissionPanel'

const SalaryManagement: React.FC = () => {
  const {
    selectedEmployee,
    selectedYearMonth,
    salaryData,
    relatedData,
    statistics,
    loading,
    operations,
    refreshData,
  } = useSalaryIntegrated()

  const [autoGenerating, setAutoGenerating] = useState(false)

  const handleMonthChange = (yearMonth: string) => {
    operations.switchMonth(yearMonth)
  }

  const handleSelectEmployee = (employee: any) => {
    operations.selectEmployee(employee)
  }

  const handleAutoGenerate = async () => {
    try {
      setAutoGenerating(true)
      await operations.autoGenerateSalary(selectedYearMonth)
    } finally {
      setAutoGenerating(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 页头 */}
      <div className="bg-white border-b shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">薪资管理中心</h1>
            <p className="text-gray-500">
              集成化薪资数据管理 - {dayjs(selectedYearMonth).format('YYYY年MM月')}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <MonthSelector
              value={selectedYearMonth}
              onChange={handleMonthChange}
              showQuickButtons={true}
            />
            <Button icon={<ReloadOutlined />} onClick={refreshData} loading={loading}>
              刷新
            </Button>
            <Button type="primary" loading={autoGenerating} onClick={handleAutoGenerate}>
              自动生成薪资
            </Button>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：薪资总览 */}
        <div className="w-1/2 border-r bg-white">
          <SalaryOverview
            salaryData={salaryData}
            loading={loading}
            selectedEmployee={selectedEmployee}
            onSelectEmployee={handleSelectEmployee}
            onRefresh={refreshData}
            statistics={statistics}
          />
        </div>

        {/* 右侧：功能模块标签页 */}
        <div className="w-1/2 bg-white">
          <Tabs
            defaultActiveKey="details"
            size="large"
            style={{ height: '100%' }}
            tabBarStyle={{
              margin: 0,
              paddingLeft: 24,
              paddingRight: 24,
              borderBottom: '1px solid #f0f0f0',
              backgroundColor: '#fafafa',
            }}
            items={[
              {
                key: 'details',
                label: '薪资详情',
                children: (
                  <div>
                    <SalaryDetails
                      employee={selectedEmployee}
                      yearMonth={selectedYearMonth}
                      onUpdate={operations.updateSalary}
                    />
                  </div>
                ),
              },
              {
                key: 'related',
                label: '关联数据',
                children: (
                  <div className="h-full">
                    <RelatedDataTabs
                      employee={selectedEmployee}
                      yearMonth={selectedYearMonth}
                      relatedData={relatedData}
                      onUpdate={operations.updateRelatedData}
                    />
                  </div>
                ),
              },
              {
                key: 'commission',
                label: '提成详情',
                children: (
                  <div className="h-full">
                    <CommissionPanel
                      employeeName={selectedEmployee?.name || ''}
                      yearMonth={selectedYearMonth}
                      data={relatedData.commission}
                      onUpdate={data => operations.updateRelatedData('commission', data)}
                    />
                  </div>
                ),
              },
              {
                key: 'operations',
                label: '数据操作',
                children: (
                  <div className="h-full p-6">
                    <ImportExportPanel
                      yearMonth={selectedYearMonth}
                      onImport={operations.importData}
                      onExport={operations.exportData}
                    />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      {/* 全局加载 */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <Spin size="large" />
        </div>
      )}
    </div>
  )
}

export default SalaryManagement
