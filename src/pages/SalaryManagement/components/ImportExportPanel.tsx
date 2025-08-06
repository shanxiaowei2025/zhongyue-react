import React, { useState } from 'react'
import { Button, Card, Space, Divider, List, Typography } from 'antd'
import {
  ImportOutlined,
  ExportOutlined,
  FileExcelOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import type { ImportType, ExportType, ImportResult } from '../../../types/salaryIntegrated'
import ImportModal from './ImportModal'
import ExportButton from './ExportButton'

const { Text } = Typography

interface ImportExportPanelProps {
  yearMonth: string
  onImport: (type: ImportType, file: File) => Promise<ImportResult>
  onExport: (type: ExportType, params?: any) => Promise<void>
}

const ImportExportPanel: React.FC<ImportExportPanelProps> = ({ yearMonth, onImport, onExport }) => {
  const [importModalVisible, setImportModalVisible] = useState(false)
  const [importType, setImportType] = useState<ImportType>('socialInsurance')

  const importTypes: { type: ImportType; name: string; description: string }[] = [
    {
      type: 'socialInsurance',
      name: '社保数据',
      description: '导入员工社保缴费信息',
    },
    {
      type: 'subsidy',
      name: '补贴数据',
      description: '导入员工补贴明细',
    },
    {
      type: 'attendance',
      name: '考勤数据',
      description: '导入员工考勤扣款信息',
    },
    {
      type: 'friendCircle',
      name: '朋友圈数据',
      description: '导入朋友圈扣款信息',
    },
    {
      type: 'deposit',
      name: '保证金数据',
      description: '导入保证金扣除记录',
    },
  ]

  const handleImportClick = (type: ImportType) => {
    setImportType(type)
    setImportModalVisible(true)
  }

  const handleImportModalCancel = () => {
    setImportModalVisible(false)
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
                  <Button
                    size="small"
                    icon={<ImportOutlined />}
                    onClick={() => handleImportClick(item.type)}
                  >
                    导入
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          <Divider className="my-4" />

          {/* 数据导出 */}
          <Card title="数据导出" size="small">
            <div className="mb-4">
              <ExportButton
                yearMonth={yearMonth}
                onExport={onExport}
                showDropdown={true}
                types={[
                  'salary',
                  'socialInsurance',
                  'subsidy',
                  'attendance',
                  'friendCircle',
                  'deposit',
                ]}
              />
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <div>• 导出当前月份({yearMonth})的数据</div>
              <div>• 支持Excel格式，便于后续处理</div>
              <div>• 包含所有字段的完整数据</div>
            </div>
          </Card>

          <Divider className="my-4" />

          {/* 快速操作 */}
          <Card title="快速操作" size="small">
            <List size="small">
              <List.Item
                actions={[
                  <Button key="template" size="small" icon={<DownloadOutlined />} type="link">
                    下载
                  </Button>,
                ]}
              >
                <div>
                  <div className="font-medium">导入模板</div>
                  <div className="text-xs text-gray-500">下载标准导入模板</div>
                </div>
              </List.Item>

              <List.Item
                actions={[
                  <Button key="guide" size="small" type="link">
                    查看
                  </Button>,
                ]}
              >
                <div>
                  <div className="font-medium">操作指南</div>
                  <div className="text-xs text-gray-500">查看详细使用说明</div>
                </div>
              </List.Item>
            </List>
          </Card>

          {/* 注意事项 */}
          <Card title="注意事项" size="small">
            <div className="text-xs text-gray-600 space-y-2">
              <div>• 导入数据会覆盖相同月份的现有数据</div>
              <div>• 请确保数据格式符合模板要求</div>
              <div>• 建议在导入前备份现有数据</div>
              <div>• 导入完成后请检查数据完整性</div>
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
