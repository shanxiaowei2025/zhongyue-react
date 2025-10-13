import React, { useState, useEffect } from 'react'
import { Button, Card, message, Tag } from 'antd'
import {
  ImportOutlined,
  FileExcelOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import type { ImportType, ImportResult, ImportStatusRecord } from '../../../types/salaryIntegrated'
import ImportModal from './ImportModal'
import {
  getImportStatus,
  shouldDisplayImportStatus,
  cleanupExpiredImportStatus,
  recordImportStatus,
} from '../../../utils/importStatus'

interface ImportExportPanelProps {
  yearMonth: string
  onImport: (type: ImportType, file: File) => Promise<ImportResult>
}

const ImportExportPanel: React.FC<ImportExportPanelProps> = ({ yearMonth, onImport }) => {
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [importType, setImportType] = useState<ImportType>('socialInsurance')
  // 导入状态记录 (按类型存储)
  const [importStatuses, setImportStatuses] = useState<Record<ImportType, ImportStatusRecord | null>>({
    salary: null,
    socialInsurance: null,
    subsidy: null,
    attendance: null,
    friendCircle: null,
    deposit: null,
  })

  // 加载导入状态
  useEffect(() => {
    // 清理过期的导入状态记录
    cleanupExpiredImportStatus()

    // 计算要显示的数据月份 (当前月-1)
    const now = new Date()
    const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const targetMonth = now.getMonth() === 0 ? 12 : now.getMonth()
    const targetYearMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}`

    // 加载所有类型的导入状态
    const statuses: Record<ImportType, ImportStatusRecord | null> = {
      salary: null,
      socialInsurance: getImportStatus('socialInsurance', targetYearMonth),
      subsidy: getImportStatus('subsidy', targetYearMonth),
      attendance: getImportStatus('attendance', targetYearMonth),
      friendCircle: getImportStatus('friendCircle', targetYearMonth),
      deposit: getImportStatus('deposit', targetYearMonth),
    }

    setImportStatuses(statuses)
  }, [])

  // 刷新导入状态
  const refreshImportStatus = (type: ImportType) => {
    const now = new Date()
    const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const targetMonth = now.getMonth() === 0 ? 12 : now.getMonth()
    const targetYearMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}`

    console.log('[refreshImportStatus] 刷新类型:', type, '目标月份:', targetYearMonth)
    const status = getImportStatus(type, targetYearMonth)
    console.log('[refreshImportStatus] 获取到的状态:', status)
    
    setImportStatuses(prev => {
      const newStatuses = {
        ...prev,
        [type]: status,
      }
      console.log('[refreshImportStatus] 更新后的 importStatuses:', newStatuses)
      return newStatuses
    })
  }

  const importTypes: {
    type: ImportType
    name: string
    description: string
    templateFile: string
  }[] = [
    {
      type: 'socialInsurance',
      name: '社保数据',
      description: '导入员工社保缴费信息',
      templateFile: '社保信息导入模板.xlsx',
    },
    {
      type: 'subsidy',
      name: '补贴数据',
      description: '导入员工补贴明细',
      templateFile: '补贴合计导入模板.xlsx',
    },
    {
      type: 'attendance',
      name: '考勤数据',
      description: '导入员工考勤扣款信息',
      templateFile: '考勤扣款导入模板.xlsx',
    },
    {
      type: 'friendCircle',
      name: '朋友圈数据',
      description: '导入朋友圈扣款信息',
      templateFile: '朋友圈扣款导入模板.xlsx',
    },
    {
      type: 'deposit',
      name: '保证金数据',
      description: '导入保证金扣除记录',
      templateFile: '保证金扣除导入模板.xlsx',
    },
  ]

  const handleImportClick = (type: ImportType) => {
    setImportType(type)
    setImportModalVisible(true)
  }

  const handleImportModalCancel = () => {
    setImportModalVisible(false)
  }

  const handleDownloadTemplate = (templateFile: string, name: string) => {
    const link = document.createElement('a')
    link.href = `/templates/${templateFile}`
    link.download = templateFile
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success(`${name}模板下载成功`)
  }

  // 渲染导入状态标签
  const renderImportStatus = (type: ImportType) => {
    const status = importStatuses[type]
    console.log(`[renderImportStatus] ${type}:`, status)
    
    if (!status || !shouldDisplayImportStatus(status)) {
      console.log(`[renderImportStatus] ${type}: 不显示 (status=${!!status}, shouldDisplay=${status ? shouldDisplayImportStatus(status) : false})`)
      return null
    }

    const [year, month] = status.yearMonth.split('-')
    const displayMonth = `${parseInt(month)}月`

    if (status.status === 'success') {
      return (
        <Tag
          icon={<CheckCircleOutlined />}
          color="success"
          className="ml-3"
          style={{ fontSize: '12px' }}
        >
          {displayMonth}导入成功
        </Tag>
      )
    } else {
      return (
        <Tag
          icon={<CloseCircleOutlined />}
          color="error"
          className="ml-3"
          style={{ fontSize: '12px' }}
        >
          {displayMonth}导入失败
        </Tag>
      )
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 内容区域 */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="space-y-6">
          {/* 数据导入 */}
          <Card title="数据导入" size="small">
            <div className="space-y-3">
              {importTypes.map(item => (
                <div
                  key={item.type}
                  className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center">
                    <FileExcelOutlined className="text-green-500 mr-3" />
                    <div>
                      <div className="font-medium flex items-center">
                        {item.name}
                        {renderImportStatus(item.type)}
                      </div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadTemplate(item.templateFile, item.name)}
                      type="text"
                    >
                      下载模板
                    </Button>
                    <Button
                      size="small"
                      icon={<ImportOutlined />}
                      onClick={() => handleImportClick(item.type)}
                      type="primary"
                    >
                      导入数据
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 注意事项 */}
          <Card title="注意事项" size="small">
            <div className="text-xs text-gray-600 space-y-2">
              <div>• 请先下载对应的模板文件，按照模板格式准备数据</div>
              <div>• 导入数据会覆盖相同月份的现有数据，请谨慎操作</div>
              <div>• 请确保数据格式严格符合模板要求</div>
              <div>• 导入完成后请检查数据完整性和准确性</div>
              <div>• 建议在导入前备份现有重要数据</div>
            </div>
          </Card>
        </div>
      </div>

      {/* 导入弹窗 */}
      <ImportModal
        visible={importModalVisible}
        type={importType}
        onCancel={handleImportModalCancel}
        onImport={async file => {
          // 计算目标月份 (上个月)
          const now = new Date()
          const targetYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
          const targetMonth = now.getMonth() === 0 ? 12 : now.getMonth()
          const targetYearMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}`
          
          try {
            const result = await onImport(importType, file)
            
            console.log('===== 导入状态记录 =====')
            console.log('导入类型:', importType)
            console.log('目标月份:', targetYearMonth)
            console.log('导入结果:', result)
            
            // 判断导入是否真正成功：
            // 1. success 为 true
            // 2. 没有失败记录（failedCount 为 0 或 undefined，且 failedRecords 为空或 undefined）
            const hasFailedRecords = 
              (result.failedCount !== undefined && result.failedCount > 0) ||
              (result.failedRecords !== undefined && result.failedRecords.length > 0)
            
            const isRealSuccess = result.success && !hasFailedRecords
            
            console.log('是否有失败记录:', hasFailedRecords)
            console.log('实际是否成功:', isRealSuccess)
            
            // 记录导入状态到 localStorage
            if (isRealSuccess) {
              console.log('记录成功状态')
              recordImportStatus(importType, targetYearMonth, 'success', result.message)
            } else {
              console.log('记录失败状态')
              recordImportStatus(importType, targetYearMonth, 'failure', result.message)
            }
            
            // 立即更新 state，让 UI 实时显示状态（不需要等待关闭弹窗）
            console.log('立即更新状态到 state')
            const newStatus = getImportStatus(importType, targetYearMonth)
            console.log('获取到的新状态:', newStatus)
            
            setImportStatuses(prev => {
              const updated = {
                ...prev,
                [importType]: newStatus,
              }
              console.log('立即更新后的 importStatuses:', updated)
              return updated
            })
            
            console.log('========================')
            
            return result
          } catch (error: any) {
            console.log('===== 导入异常捕获 =====')
            console.log('导入类型:', importType)
            console.log('目标月份:', targetYearMonth)
            console.log('错误信息:', error)
            
            // 即使抛出异常，也要更新状态
            // useSalaryIntegrated 已经记录了失败状态到 localStorage，我们只需要刷新 UI
            const newStatus = getImportStatus(importType, targetYearMonth)
            console.log('获取到的异常后状态:', newStatus)
            
            setImportStatuses(prev => {
              const updated = {
                ...prev,
                [importType]: newStatus,
              }
              console.log('异常后更新的 importStatuses:', updated)
              return updated
            })
            
            console.log('========================')
            
            // 重新抛出错误，让 ImportModal 处理
            throw error
          }
        }}
        title={`导入${importTypes.find(t => t.type === importType)?.name}`}
      />
    </div>
  )
}

export default ImportExportPanel
