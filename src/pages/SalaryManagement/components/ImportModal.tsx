import React, { useState } from 'react'
import { Modal, Upload, Button, message, Alert, Table, Typography } from 'antd'
import { UploadOutlined, DownloadOutlined, InboxOutlined } from '@ant-design/icons'
import type { UploadProps, UploadFile } from 'antd'
import type { ImportResult, ImportFailedRecord, ImportType } from '../../../types/salaryIntegrated'

const { Dragger } = Upload
const { Text, Link } = Typography

interface ImportModalProps {
  visible: boolean
  type: ImportType
  onCancel: () => void
  onImport: (file: File) => Promise<ImportResult>
  templateUrl?: string
  title?: string
}

const ImportModal: React.FC<ImportModalProps> = ({
  visible,
  type,
  onCancel,
  onImport,
  templateUrl,
  title,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const typeNames: Record<ImportType, string> = {
    salary: '薪资数据',
    socialInsurance: '社保数据',
    subsidy: '补贴数据',
    attendance: '考勤数据',
    friendCircle: '朋友圈数据',
    deposit: '保证金数据',
  }

  const modalTitle = title || `导入${typeNames[type]}`

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    beforeUpload: file => {
      const isExcel =
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'text/csv'

      if (!isExcel) {
        message.error('只能上传 Excel 或 CSV 文件！')
        return false
      }

      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB！')
        return false
      }

      setFileList([file])
      return false // 阻止自动上传
    },
    onRemove: () => {
      setFileList([])
      setImportResult(null)
    },
  }

  const handleImport = async () => {
    if (fileList.length === 0) {
      message.error('请先选择要导入的文件')
      return
    }

    try {
      setImporting(true)
      const uploadFile = fileList[0]
      // 获取文件对象，优先使用originFileObj，如果不存在则使用file本身
      const file = uploadFile.originFileObj || (uploadFile as any as File)

      // 添加调试日志
      console.log('导入文件信息:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      })

      const result = await onImport(file)
      setImportResult(result)

      // 不自动关闭模态框，让用户手动关闭
    } catch (error) {
      console.error('导入失败:', error)
    } finally {
      setImporting(false)
    }
  }

  const handleCancel = () => {
    setFileList([])
    setImportResult(null)
    onCancel()
  }

  const handleDownloadTemplate = () => {
    if (templateUrl) {
      const link = document.createElement('a')
      link.href = templateUrl
      link.download = `${typeNames[type]}模板.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      message.info('模板下载功能开发中...')
    }
  }

  const failedRecordsColumns = [
    {
      title: '行号',
      dataIndex: 'row',
      width: 60,
    },
    {
      title: '错误信息',
      dataIndex: 'errors',
      render: (errors: string[]) => (
        <div>
          {errors.map((error, index) => (
            <div key={index} className="text-red-500">
              {error}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: '原始数据',
      dataIndex: 'data',
      render: (data: any) => <Text code>{JSON.stringify(data)}</Text>,
    },
  ]

  return (
    <Modal
      title={modalTitle}
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button key="template" icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
          下载模板
        </Button>,
        <Button
          key="import"
          type="primary"
          loading={importing}
          onClick={handleImport}
          disabled={fileList.length === 0}
        >
          开始导入
        </Button>,
      ]}
    >
      <div className="space-y-4">
        {/* 使用说明 */}
        <Alert
          message="导入须知"
          description={
            <div>
              <p>1. 请使用提供的模板文件，确保列名和格式正确</p>
              <p>2. 支持 Excel (.xlsx) 和 CSV 文件格式</p>
              <p>3. 文件大小不能超过 10MB</p>
              <p>4. 数据导入后将覆盖相同月份的现有数据</p>
            </div>
          }
          type="info"
          showIcon
          className="mb-4"
        />

        {/* 文件上传区域 */}
        <Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">支持 Excel (.xlsx) 和 CSV 文件格式</p>
        </Dragger>

        {/* 导入结果 */}
        {importResult && (
          <div className="mt-4">
            <Alert
              message={`导入${importResult.success ? '成功' : '完成'}`}
              description={<div>{importResult.message && <p>{importResult.message}</p>}</div>}
              type={importResult.success && importResult.failedCount === 0 ? 'success' : 'warning'}
              showIcon
            />

            {/* 失败记录详情 */}
            {importResult.failedRecords && importResult.failedRecords.length > 0 && (
              <div className="mt-4">
                <Typography.Title level={5}>失败记录详情</Typography.Title>
                <Table
                  dataSource={importResult.failedRecords}
                  columns={failedRecordsColumns}
                  size="small"
                  pagination={{ pageSize: 5 }}
                  rowKey="row"
                  scroll={{ x: true }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ImportModal
