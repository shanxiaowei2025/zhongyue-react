import React, { useState } from 'react'
import { Button, Spin, Tabs, Progress, Modal } from 'antd'
import type { TabsProps } from 'antd'
import { ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useSalaryIntegrated } from '../../hooks/useSalaryIntegrated'
import MonthSelector from './components/MonthSelector'
import SalaryOverview from './components/SalaryOverview'
import SalaryDetails from './components/SalaryDetails'
import RelatedDataTabs from './components/RelatedDataTabs'
import ImportExportPanel from './components/ImportExportPanel'
import CommissionPanel from './components/CommissionPanel'
import '../../components/ScrollableTabs.css'

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
  const [markingAllPaid, setMarkingAllPaid] = useState(false)

  const handleMonthChange = (yearMonth: string) => {
    operations.switchMonth(yearMonth)
  }

  const handleSelectEmployee = (employee: any) => {
    operations.selectEmployee(employee)
  }

  const handleAutoGenerate = async () => {
    try {
      setAutoGenerating(true)
      await operations.autoGenerateSalary()
    } finally {
      setAutoGenerating(false)
    }
  }

  const handleMarkAllPaid = () => {
    const unpaidCount = salaryData.filter(emp => !emp.isPaid).length

    if (unpaidCount === 0) {
      Modal.info({
        title: '提示',
        content: '当前月份所有员工均已发放',
      })
      return
    }

    Modal.confirm({
      title: '批量发放确认',
      content: `确定要将当前月份所有未发放的员工（共 ${unpaidCount} 人）标记为已发放吗？`,
      icon: <CheckCircleOutlined />,
      okText: '确认发放',
      cancelText: '取消',
      onOk: async () => {
        try {
          setMarkingAllPaid(true)
          await operations.markAllPaid()
        } finally {
          setMarkingAllPaid(false)
        }
      },
    })
  }

  const handleMarkEmployeePaid = async (id: number) => {
    await operations.markEmployeePaid(id)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 页头 */}
      <div className="bg-white border-b shadow-sm pb-6">
        <div className="flex justify-between items-center">
          <div className="w-1/2">
            {/* 员工确认进度 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-700 font-medium text-base">员工确认进度</span>
                <span className="text-sm text-gray-600">
                  {statistics.confirmedCount}/{statistics.employeeCount} 已确认
                </span>
              </div>
              <Progress
                percent={statistics.confirmationRate}
                status={statistics.confirmationRate === 100 ? 'success' : 'active'}
                strokeColor={{
                  '0%': '#ff7875',
                  '50%': '#ffa940',
                  '100%': '#52c41a',
                }}
                format={percent => `${percent?.toFixed(0)}%`}
                size="default"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 ml-6">
            <MonthSelector
              value={selectedYearMonth}
              onChange={handleMonthChange}
              showQuickButtons={true}
            />
            <Button icon={<ReloadOutlined />} onClick={refreshData} loading={loading}>
              刷新
            </Button>
            <Button
              icon={<CheckCircleOutlined />}
              onClick={handleMarkAllPaid}
              loading={markingAllPaid}
              disabled={salaryData.filter(emp => !emp.isPaid).length === 0}
            >
              全部已发放
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
            onMarkPaid={handleMarkEmployeePaid}
          />
        </div>

        {/* 右侧：功能模块标签页 */}
        <div className="w-1/2 bg-white flex flex-col">
          <Tabs
            defaultActiveKey="details"
            size="large"
            className="scrollable-tabs"
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
                  <div className="tab-content-container">
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
                  <div className="tab-content-container">
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
                  <div className="tab-content-container">
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
                  <div className="tab-content-container" style={{ padding: '24px' }}>
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
