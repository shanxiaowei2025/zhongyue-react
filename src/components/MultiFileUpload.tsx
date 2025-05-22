import React, { useState, useEffect } from 'react'
import { Upload, Button, message, Modal, Spin, Image, Space, Card, Typography, Empty } from 'antd'
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  LoadingOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileJpgOutlined,
  FileImageOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons'
import { uploadFile, deleteFile, buildImageUrl } from '../utils/upload'

const { Text } = Typography

// 定义文件类型图标映射
const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FilePdfOutlined />,
  doc: <FileWordOutlined />,
  docx: <FileWordOutlined />,
  xls: <FileExcelOutlined />,
  xlsx: <FileExcelOutlined />,
  ppt: <FilePptOutlined />,
  pptx: <FilePptOutlined />,
  jpg: <FileJpgOutlined />,
  jpeg: <FileJpgOutlined />,
  png: <FileImageOutlined />,
  gif: <FileImageOutlined />,
  txt: <FileTextOutlined />,
  default: <FileOutlined />,
}

// 文件项类型定义
interface FileItem {
  fileName: string
  url: string
}

interface MultiFileUploadProps {
  label: string
  value?: FileItem[]
  onChange?: (value: FileItem[]) => void
  disabled?: boolean
  onSuccess?: (isAutoSave: boolean) => void
  accept?: string // 接受的文件类型，默认为所有文件
  maxCount?: number // 最大上传数量，默认为无限制
  onFileUpload?: (fileName: string) => void // 新增: 文件上传成功回调
  onFileRemove?: (fileName: string) => void // 新增: 文件删除回调
}

const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  label,
  value = [],
  onChange,
  disabled = false,
  onSuccess,
  accept = '*',
  maxCount = 999, // 设置为一个很大的数字，实际上相当于无限制
  onFileUpload,
  onFileRemove,
}) => {
  const [loading, setLoading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [isImage, setIsImage] = useState(false)
  
  // 确保value始终是一个数组
  const safeValue = Array.isArray(value) ? value : []

  // 判断文件类型
  const getFileType = (fileName: any): string => {
    if (!fileName) return 'default'
    // 确保fileName是字符串类型
    const fileNameStr = typeof fileName === 'string' ? fileName : 
                       (fileName.fileName ? fileName.fileName : 
                       (fileName.url ? fileName.url : String(fileName)))
    
    const extension = fileNameStr.split('.').pop()?.toLowerCase() || 'default'
    return FILE_ICONS[extension] ? extension : 'default'
  }

  // 判断是否为图片
  const checkIsImage = (fileName: any): boolean => {
    if (!fileName) return false
    // 确保fileName是字符串类型
    const fileNameStr = typeof fileName === 'string' ? fileName : 
                       (fileName.fileName ? fileName.fileName : 
                       (fileName.url ? fileName.url : String(fileName)))
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
    const extension = fileNameStr.split('.').pop()?.toLowerCase() || ''
    return imageExtensions.includes(extension)
  }

  const beforeUpload = (file: File) => {
    // 检查文件类型是否符合accept属性
    if (accept !== '*') {
      const acceptTypes = accept.split(',').map(type => type.trim())
      const fileType = file.type || `application/${file.name.split('.').pop()}`

      const isAccepted = acceptTypes.some(type => {
        if (type.startsWith('.')) {
          // 如果是按扩展名限制
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        } else if (type.includes('*')) {
          // 如果是按MIME类型通配符限制
          const typeParts = type.split('/')
          const fileParts = fileType.split('/')
          return (
            typeParts[0] === '*' ||
            (typeParts[0] === fileParts[0] &&
              (typeParts[1] === '*' || typeParts[1] === fileParts[1]))
          )
        } else {
          // 如果是按完整MIME类型限制
          return fileType === type
        }
      })

      if (!isAccepted) {
        message.error(`只能上传${accept}类型的文件！`)
        return false
      }
    }

    // 移除了上传数量限制检查

    // 文件大小限制（10MB）
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('文件必须小于10MB！')
      return false
    }

    return true
  }

  const handleCustomUpload = async (options: any) => {
    const { file, onSuccess: onUploadSuccess, onError } = options
    setLoading(true)

    try {
      // 如果已达到最大数量，则不上传
      if (safeValue.length >= maxCount) {
        message.error(`最多只能上传${maxCount}个文件`)
        onError('已达到最大上传数量')
        return
      }

      // 使用工具上传文件
      const result = await uploadFile(file)

      if (result) {
        // 新文件
        const newFile: FileItem = result
        // 更新状态，将新文件添加到现有文件列表
        onChange?.([...safeValue, newFile])
        onUploadSuccess('上传成功')
        message.success('上传成功')

        // 记录上传的文件名
        onFileUpload?.(result.fileName)

        // 上传成功后，调用外部回调进行自动保存
        setTimeout(() => onSuccess?.(true), 300)
      } else {
        onError('上传失败')
      }
    } catch (error) {
      console.error('上传出错:', error)
      message.error('上传失败，请重试')
      onError('上传失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (fileItem: FileItem) => {
    if (!fileItem.fileName) return

    setLoading(true)
    try {
      // 尝试从URL中提取更精确的文件名
      let fileNameToDelete = fileItem.fileName
      if (fileItem.url) {
        const urlParts = fileItem.url.split('/')
        const lastPart = urlParts[urlParts.length - 1]
        if (lastPart) {
          fileNameToDelete = lastPart.split('?')[0] // 移除可能的查询参数
        }
      }

      const success = await deleteFile(fileNameToDelete)
      if (success) {
        // 更新文件列表，移除已删除的文件，确保使用safeValue
        const newFiles = safeValue.filter(item => item.fileName !== fileItem.fileName)
        onChange?.(newFiles)
        message.success('删除成功')

        // 通知外部组件文件已删除
        onFileRemove?.(fileItem.fileName)

        // 删除成功后，调用外部回调进行自动保存
        setTimeout(() => onSuccess?.(true), 300)
      }
    } catch (error) {
      console.error('删除出错:', error)
      message.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = (fileItem: FileItem) => {
    if (!fileItem) return

    // 确保URL是完整的，并添加时间戳避免缓存
    const timestamp = new Date().getTime()
    const urlWithTimestamp = fileItem.url.includes('?')
      ? `${fileItem.url.split('?')[0]}?t=${timestamp}`
      : `${fileItem.url}?t=${timestamp}`

    // 构造新的文件项，包含时间戳
    const fileWithTimestamp = {
      ...fileItem,
      url: urlWithTimestamp,
    }

    setPreviewFile(fileWithTimestamp)
    setIsImage(checkIsImage(fileItem.fileName))
    setPreviewVisible(true)
  }

  // 获取文件图标
  const getFileIcon = (fileName: string) => {
    const fileType = getFileType(fileName)
    return FILE_ICONS[fileType] || FILE_ICONS.default
  }

  const getFileExtension = (fileName: any) => {
    if (!fileName) return ''
    // 确保fileName是字符串类型
    const fileNameStr = typeof fileName === 'string' ? fileName : 
                       (fileName.fileName ? fileName.fileName : 
                       (fileName.url ? fileName.url : String(fileName)))
    
    return fileNameStr.split('.').pop()?.toUpperCase() || ''
  }

  // 获取文件名（不包含扩展名）
  const getFileNameWithoutExtension = (fileName: any) => {
    if (!fileName) return ''
    // 确保fileName是字符串类型
    const fileNameStr = typeof fileName === 'string' ? fileName : 
                       (fileName.fileName ? fileName.fileName : 
                       (fileName.url ? fileName.url : String(fileName)))
    
    const lastDotIndex = fileNameStr.lastIndexOf('.')
    return lastDotIndex > 0 ? fileNameStr.substring(0, lastDotIndex) : fileNameStr
  }

  // 截断长文件名
  const truncateFileName = (fileName: any, maxLength: number = 15) => {
    if (!fileName) return ''
    // 确保fileName是字符串类型
    const fileNameStr = typeof fileName === 'string' ? fileName : 
                       (fileName.fileName ? fileName.fileName : 
                       (fileName.url ? fileName.url : String(fileName)))
    
    const name = getFileNameWithoutExtension(fileNameStr)
    const extension = getFileExtension(fileNameStr)

    if (name.length <= maxLength) {
      return fileNameStr
    }

    return `${name.substring(0, maxLength)}...${extension ? `.${extension}` : ''}`
  }

  return (
    <div className="multi-file-upload-container">
      <Spin spinning={loading} indicator={<LoadingOutlined />}>
        <div className="mb-2">
          <Upload
            showUploadList={false}
            beforeUpload={beforeUpload}
            customRequest={handleCustomUpload}
            accept={accept}
            disabled={disabled}
            multiple={false}
          >
            <Button type="primary" icon={<UploadOutlined />} disabled={disabled}>
              上传{label}
            </Button>
          </Upload>
          <Text type="secondary" className="ml-2">
            {`已上传 ${safeValue.length} 个文件`}
          </Text>
        </div>

        {/* 文件列表 */}
        <div className="file-list grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {safeValue && safeValue.length > 0 ? (
            safeValue.map((file, index) => (
              <Card
                key={index}
                size="small"
                className="file-card"
                hoverable
                actions={[
                  <EyeOutlined key="preview" onClick={() => handlePreview(file)} />,
                  !disabled && (
                    <DeleteOutlined
                      key="delete"
                      onClick={() => handleRemove(file)}
                      className="text-red-500"
                    />
                  ),
                ].filter(Boolean)}
              >
                <div className="flex flex-col items-center p-2">
                  <div className="text-4xl mb-2">
                    {checkIsImage(file.fileName) ? (
                      <div className="w-16 h-16 flex items-center justify-center overflow-hidden">
                        <img
                          src={buildImageUrl(file.fileName)}
                          alt={file.fileName}
                          className="object-cover"
                          style={{ maxWidth: '100%', maxHeight: '100%' }}
                          onError={e => {
                            // 图片加载失败时显示图标
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                        <div className="hidden">{getFileIcon(file.fileName)}</div>
                      </div>
                    ) : (
                      getFileIcon(file.fileName)
                    )}
                  </div>
                  <Text ellipsis={{ tooltip: file.fileName }} className="w-full text-center">
                    {truncateFileName(file.fileName)}
                  </Text>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Empty description="暂无文件" />
            </div>
          )}
        </div>
      </Spin>

      <Modal
        open={previewVisible}
        title={previewFile?.fileName || label}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        centered
        width={800}
      >
        <div className="flex justify-center">
          {isImage ? (
            // 图片预览
            <Image
              alt={previewFile?.fileName || ''}
              src={previewFile?.url || ''}
              style={{ maxWidth: '100%' }}
              preview={false}
              fallback="/images/image-placeholder.svg"
              crossOrigin="anonymous"
            />
          ) : (
            // 非图片文件预览
            <div className="flex flex-col items-center justify-center p-8">
              <div className="text-6xl mb-4">{getFileIcon(previewFile?.fileName || '')}</div>
              <div className="text-xl font-bold">{previewFile?.fileName || '未知文件'}</div>
              <div className="text-gray-500 mb-4">
                {getFileExtension(previewFile?.fileName || '')}
              </div>
              <Space>
                <Button type="primary" onClick={() => window.open(previewFile?.url, '_blank')}>
                  下载文件
                </Button>
              </Space>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default MultiFileUpload
