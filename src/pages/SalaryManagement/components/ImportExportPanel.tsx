import React, { useState } from 'react'
import { Button, Card, message } from 'antd'
import { ImportOutlined, FileExcelOutlined, DownloadOutlined } from '@ant-design/icons'
import type { ImportType, ImportResult } from '../../../types/salaryIntegrated'
import ImportModal from './ImportModal'

interface ImportExportPanelProps {
  yearMonth: string
  onImport: (type: ImportType, file: File) => Promise<ImportResult>
}

const ImportExportPanel: React.FC<ImportExportPanelProps> = ({ onImport }) => {
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [importType, setImportType] = useState<ImportType>('socialInsurance')

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
                      <div className="font-medium">{item.name}</div>
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
        onImport={file => onImport(importType, file)}
        title={`导入${importTypes.find(t => t.type === importType)?.name}`}
      />
    </div>
  )
}

export default ImportExportPanel
