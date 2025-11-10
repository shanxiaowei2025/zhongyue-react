import React, { useState, useEffect, useMemo } from 'react'
import { Button, Spin, Tabs, Progress, Modal } from 'antd'

import {
  ReloadOutlined,
  CheckCircleOutlined,
  LeftOutlined,
  RightOutlined,
  ExportOutlined,
  FileTextOutlined,
} from '@ant-design/icons'

import { useSalaryIntegrated } from '../../hooks/useSalaryIntegrated'
import { useAuthStore } from '../../store/auth'
import MonthSelector from './components/MonthSelector'
import SalaryOverview from './components/SalaryOverview'
import CompactEmployeeList from './components/CompactEmployeeList'
import SalaryDetails from './components/SalaryDetails'
import RelatedDataTabs from './components/RelatedDataTabs'
import ImportExportPanel from './components/ImportExportPanel'
import CommissionPanel from './components/CommissionPanel'
import SpecialBusinessModal from './components/SpecialBusinessModal'
import '../../components/ScrollableTabs.css'

const SalaryManagement: React.FC = () => {
  const { user } = useAuthStore()
  
  // 判断是否为仅上传权限的角色
  const isUploadOnlyRole = useMemo(() => {
    if (!user?.roles) return false
    const roles = user.roles.map(role => role.toLowerCase())
    return roles.includes('salary_uploader') || roles.includes('薪资上传员')
  }, [user])
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

  // 页面首次挂载时重置筛选，避免上一次的筛选在再次进入页面后被沿用
  useEffect(() => {
    operations.resetFilters()
  }, [])

  const [autoGenerating, setAutoGenerating] = useState(false)
  const [markingAllPaid, setMarkingAllPaid] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [specialBusinessModalOpen, setSpecialBusinessModalOpen] = useState(false)

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

  const handleExportCsv = async () => {
    try {
      setExporting(true)
      await operations.exportSalaryCsv()
    } finally {
      setExporting(false)
    }
  }

  // 如果是仅上传权限，只显示导入功能
  if (isUploadOnlyRole) {
    return (
      <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
        {/* 页头 */}
        <div className="bg-white border-b shadow-sm pb-6 flex-shrink-0">
          <div className="px-6">
            <h1 className="text-xl font-semibold text-gray-900">薪资数据导入</h1>
          </div>
        </div>

        {/* 主内容区域 - 只显示导入功能 */}
        <div className="flex-1 overflow-auto bg-white">
          <div className="p-6">
            <ImportExportPanel
              yearMonth={selectedYearMonth}
              onImport={operations.importData}
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

  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
      {/* 页头 */}
      <div className="bg-white border-b shadow-sm pb-6 flex-shrink-0">
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
            <Button icon={<ExportOutlined />} onClick={handleExportCsv} loading={exporting}>
              导出CSV
            </Button>
            <Button
              icon={<FileTextOutlined />}
              onClick={() => setSpecialBusinessModalOpen(true)}
            >
              特殊业务列表
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
      <div className="flex-1 flex overflow-hidden relative">
        {/* 左侧：薪资总览 */}
        <div
          className={`border-r bg-white transition-all duration-300 relative ${
            leftCollapsed ? 'border-r-0' : ''
          }`}
          style={{
            width: leftCollapsed ? '120px' : rightCollapsed ? '100%' : '50%',
          }}
        >
          {leftCollapsed ? (
            <CompactEmployeeList
              salaryData={salaryData}
              selectedEmployee={selectedEmployee}
              onSelectEmployee={handleSelectEmployee}
            />
          ) : (
            <SalaryOverview
              salaryData={salaryData}
              loading={loading}
              selectedEmployee={selectedEmployee}
              onSelectEmployee={handleSelectEmployee}
              onRefresh={refreshData}
              statistics={statistics}
              onMarkPaid={handleMarkEmployeePaid}
              onFilter={operations.applyFilters}
              onResetFilter={operations.resetFilters}
            />
          )}
        </div>

        {/* 右侧：功能模块标签页 */}
        <div
          className="bg-white flex flex-col transition-all duration-300 relative"
          style={{
            width: rightCollapsed ? '20px' : leftCollapsed ? 'calc(100% - 120px)' : '50%',
          }}
        >
          {!rightCollapsed && (
            /* 右侧展开时显示完整内容 */
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
                      <CommissionPanel />
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
                      />
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>

        {/* 分割线上的折叠按钮组 */}
        <div
          className="absolute top-1/2 transform -translate-y-1/2 z-20"
          style={{
            left: leftCollapsed ? '120px' : rightCollapsed ? 'calc(100% - 40px)' : '50%',
            marginLeft: rightCollapsed ? '0' : '-16px',
          }}
        >
          <div className="flex flex-col space-y-1">
            {/* 左侧折叠按钮 - 左侧折叠时隐藏 */}
            {!leftCollapsed && (
              <Button
                type="text"
                size="small"
                icon={<LeftOutlined />}
                onClick={() => {
                  setLeftCollapsed(true)
                  setRightCollapsed(false)
                }}
                className="bg-white border border-gray-200 shadow-md hover:shadow-lg"
                title="折叠左侧面板"
                style={{ width: 32, height: 32 }}
              />
            )}
            {/* 右侧折叠按钮 - 右侧折叠时隐藏 */}
            {!rightCollapsed && (
              <Button
                type="text"
                size="small"
                icon={<RightOutlined />}
                onClick={() => {
                  setRightCollapsed(true)
                  setLeftCollapsed(false)
                }}
                className="bg-white border border-gray-200 shadow-md hover:shadow-lg"
                title="折叠右侧面板"
                style={{ width: 32, height: 32 }}
              />
            )}
            {/* 恢复按钮 - 任一侧折叠时显示 */}
            {(leftCollapsed || rightCollapsed) && (
              <Button
                type="text"
                size="small"
                icon={leftCollapsed ? <RightOutlined /> : <LeftOutlined />}
                onClick={() => {
                  setLeftCollapsed(false)
                  setRightCollapsed(false)
                }}
                className="bg-white border border-gray-200 shadow-md hover:shadow-lg"
                title="恢复初始状态"
                style={{ width: 32, height: 32 }}
              />
            )}
          </div>
        </div>
      </div>

      {/* 全局加载 */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <Spin size="large" />
        </div>
      )}

      {/* 特殊业务列表模态框 */}
      <SpecialBusinessModal
        open={specialBusinessModalOpen}
        onCancel={() => setSpecialBusinessModalOpen(false)}
      />
    </div>
  )
}

export default SalaryManagement
