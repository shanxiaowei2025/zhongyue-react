import React, { useState, useEffect, useRef } from 'react'
import { Upload, Button, message, Modal, Spin, Image, Space, Popconfirm, Input } from 'antd'
import { showValidationError, showSuccess } from '../utils/messageHelper'
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
  InboxOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import { uploadFile, deleteFile, buildImageUrl } from '../utils/upload'
import type { ImageType, ImageTypeWithRemarks } from '../types'

const { Dragger } = Upload

// 定义文件类型图标映射
const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FilePdfOutlined />,
  doc: <FileWordOutlined />,
  docx: <FileWordOutlined />,
  xls: <FileExcelOutlined />,
  xlsx: <FileExcelOutlined />,
  ppt: <FilePptOutlined />,
  pptx: <FilePptOutlined />,
  csv: <FileTextOutlined />,
  txt: <FileTextOutlined />,
  jpg: <FileJpgOutlined />,
  jpeg: <FileJpgOutlined />,
  png: <FileImageOutlined />,
  gif: <FileImageOutlined />,
  bmp: <FileImageOutlined />,
  webp: <FileImageOutlined />,
  default: <FileOutlined />,
}

interface FileUploadProps {
  label: string
  value?: ImageType | ImageTypeWithRemarks
  onChange?: (value: (ImageType | ImageTypeWithRemarks) | undefined) => void
  disabled?: boolean
  onSuccess?: (isAutoSave: boolean) => void
  accept?: string
  showDragArea?: boolean // 是否显示拖拽上传区域
  onFileUpload?: (fileName: string) => void
  onFileRemove?: () => void
  enableRemarks?: boolean // 是否启用备注功能
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  onSuccess,
  accept = '.jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv',
  showDragArea = false,
  onFileUpload,
  onFileRemove,
  enableRemarks = false,
}) => {
  const [loading, setLoading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewFile, setPreviewFile] = useState('')
  const [fileError, setFileError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 清理定时器
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  // 当value变化时重置重试次数和错误状态
  useEffect(() => {
    if (value?.url) {
      setRetryCount(0)
      setFileError(false)
    }
  }, [value?.url])

  // 判断文件类型
  const getFileType = (fileName: string): string => {
    if (!fileName) return 'default'
    const extension = fileName.split('.').pop()?.toLowerCase() || 'default'
    return FILE_ICONS[extension] ? extension : 'default'
  }

  // 判断是否为图片
  const checkIsImage = (fileName: string): boolean => {
    if (!fileName) return false
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']
    const extension = fileName.split('.').pop()?.toLowerCase() || ''
    return imageExtensions.includes(extension)
  }

  // 获取文件图标
  const getFileIcon = (fileName: string) => {
    const fileType = getFileType(fileName)
    return FILE_ICONS[fileType] || FILE_ICONS.default
  }

  // 获取文件扩展名
  const getFileExtension = (fileName: string) => {
    if (!fileName) return ''
    return fileName.split('.').pop()?.toUpperCase() || ''
  }

  const beforeUpload = (file: File) => {
    console.log('beforeUpload called:', file.name)

    // 检查文件类型
    if (accept && accept !== '*') {
      const acceptTypes = accept.split(',').map(type => type.trim())
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''

      const isAccepted = acceptTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        } else if (type.includes('*')) {
          const typeParts = type.split('/')
          const fileParts = (file.type || `application/${fileExtension}`).split('/')
          return (
            typeParts[0] === '*' ||
            (typeParts[0] === fileParts[0] &&
              (typeParts[1] === '*' || typeParts[1] === fileParts[1]))
          )
        } else {
          return file.type === type
        }
      })

      if (!isAccepted) {
        showValidationError.invalidFileFormat()
        return false
      }
    }

    return true // 允许上传，使用自定义上传
  }

  const handleCustomUpload = async (options: any) => {
    const { file, onSuccess: onUploadSuccess, onError } = options
    console.log('handleCustomUpload called:', file.name)

    setLoading(true)

    try {
      const result = await uploadFile(file)
      if (result) {
        // 如果启用备注功能，保留现有备注
        const newValue =
          enableRemarks && value && 'remarks' in value
            ? { ...result, remarks: value.remarks }
            : result

        onChange?.(newValue)
        onUploadSuccess('上传成功')
        showSuccess.upload()
        setFileError(false)

        // 记录上传的文件
        onFileUpload?.(result.fileName)

        // 上传成功后，调用外部回调进行自动保存
        setTimeout(() => onSuccess?.(true), 300)
      } else {
        onError('上传失败')
      }
    } catch (error) {
      console.error('上传出错:', error)
      // 错误处理由拦截器统一处理
      onError('上传失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async () => {
    if (!value?.fileName) return true

    setLoading(true)
    try {
      // 尝试使用url中的文件名进行删除
      let fileNameToDelete = value.fileName

      // 如果文件名不包含连字符，尝试从URL中提取更精确的文件名
      if (!fileNameToDelete.includes('-') && value.url) {
        const urlParts = value.url.split('/')
        const lastPart = urlParts[urlParts.length - 1]
        if (lastPart && lastPart.includes('-')) {
          fileNameToDelete = lastPart.split('?')[0] // 移除可能的查询参数
        }
      }

      const success = await deleteFile(fileNameToDelete)
      if (success) {
        onChange?.(undefined)
        showSuccess.delete()

        // 通知外部组件文件已删除
        onFileRemove?.()

        // 删除成功后，调用外部回调进行自动保存
        setTimeout(() => onSuccess?.(true), 300)
        return true
      }
      return false
    } catch (error) {
      console.error('删除出错:', error)
      // 错误处理由拦截器统一处理
      return false
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = () => {
    if (value?.url) {
      // 确保URL是完整的，并添加时间戳避免缓存
      const url = value.fileName ? buildImageUrl(value.fileName) : value.url
      const timestamp = new Date().getTime()
      const urlWithTimestamp = url.includes('?')
        ? `${url.split('?')[0]}?t=${timestamp}`
        : `${url}?t=${timestamp}`

      setPreviewFile(urlWithTimestamp)
      setPreviewVisible(true)

      // 重置重试计数
      setRetryCount(0)
      setFileError(false)
    }
  }

  // 生成上传文件列表
  const fileList: UploadFile[] =
    value && !fileError
      ? [
          {
            uid: '-1',
            name: value.fileName || '文件',
            status: 'done',
            url:
              retryCount > 0
                ? `${value.fileName ? buildImageUrl(value.fileName) : value.url}?t=${new Date().getTime()}`
                : value.fileName
                  ? buildImageUrl(value.fileName)
                  : value.url,
          },
        ]
      : []

  // 处理备注变更
  const handleRemarksChange = (remarks: string) => {
    if (value && enableRemarks) {
      const newValue = { ...value, remarks }
      onChange?.(newValue)
      // 备注变更后调用自动保存
      setTimeout(() => onSuccess?.(true), 300)
    }
  }

  // 处理图片加载错误
  const handleImageError = () => {
    if (retryCount < maxRetries && value?.url) {
      // 设置递增的重试延迟: 2秒, 4秒, 8秒
      const retryDelay = Math.pow(2, retryCount + 1) * 1000

      console.log(`图片加载失败，${retryDelay / 1000}秒后尝试第${retryCount + 1}次重新加载...`)

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }

      // 设置定时器在一定时间后尝试重新加载
      retryTimeoutRef.current = setTimeout(() => {
        setRetryCount(prev => prev + 1)
        // 通过添加时间戳参数避免浏览器缓存
        setPreviewFile(
          `${value.fileName ? buildImageUrl(value.fileName) : value.url}?t=${new Date().getTime()}`
        )
      }, retryDelay)
    } else {
      // 超过最大重试次数，显示错误状态
      setFileError(true)
      if (retryCount >= maxRetries) {
        message.error(`文件加载失败，已尝试${maxRetries}次重新加载`)
      }
    }
  }

  return (
    <div className="file-upload-container">
      <Spin spinning={loading} indicator={<LoadingOutlined />}>
        {showDragArea && !value && !disabled ? (
          // 拖拽上传区域
          <Dragger
            name="file"
            showUploadList={false}
            beforeUpload={beforeUpload}
            customRequest={handleCustomUpload}
            accept={accept}
            disabled={disabled}
            className="min-h-32"
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">支持图片、PDF、Word、Excel、CSV等格式</p>
          </Dragger>
        ) : (
          // 标准上传组件
          <Upload
            listType="picture-card"
            maxCount={1}
            fileList={fileList}
            beforeUpload={beforeUpload}
            customRequest={handleCustomUpload}
            onRemove={handleRemove}
            accept={accept}
            disabled={disabled}
            onPreview={() => handlePreview()}
          >
            {!value && (
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>上传{label}</div>
                <div style={{ marginTop: 4, fontSize: '12px', color: '#999' }}>
                  支持图片、PDF、Word、Excel、CSV
                </div>
              </div>
            )}
          </Upload>
        )}

        {value && (
          <div className="file-actions mt-2">
            <Button type="text" icon={<EyeOutlined />} onClick={handlePreview} size="small">
              预览
            </Button>
            {!disabled && (
              <Popconfirm
                title="确认删除"
                description="删除后将无法恢复，是否确认删除？"
                onConfirm={handleRemove}
                okText="确认"
                okType="danger"
                cancelText="取消"
              >
                <Button type="text" danger icon={<DeleteOutlined />} size="small">
                  删除
                </Button>
              </Popconfirm>
            )}
          </div>
        )}

        {value && enableRemarks && (
          <div className="file-remarks mt-2">
            <Input
              placeholder="请输入图片备注..."
              value={(value as ImageTypeWithRemarks)?.remarks || ''}
              onChange={e => handleRemarksChange(e.target.value)}
              disabled={disabled}
              maxLength={200}
              showCount
              size="small"
            />
          </div>
        )}
      </Spin>

      <Modal
        open={previewVisible}
        title={label}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        centered
        width={800}
      >
        <div className="flex justify-center">
          {value && value.fileName && checkIsImage(value.fileName) ? (
            // 图片预览
            <Image
              alt={label}
              src={previewFile}
              style={{ maxWidth: '100%' }}
              preview={false}
              onError={handleImageError}
              fallback="/images/image-placeholder.svg"
              crossOrigin="anonymous"
            />
          ) : (
            // 非图片文件预览
            <div className="flex flex-col items-center justify-center p-8">
              <div className="text-6xl mb-4">
                {value?.fileName ? getFileIcon(value.fileName) : <FileOutlined />}
              </div>
              <div className="text-xl font-bold">{value?.fileName || '未知文件'}</div>
              <div className="text-gray-500 mb-4">
                {value?.fileName ? getFileExtension(value.fileName) : ''}
              </div>
              <Space>
                <Button
                  type="primary"
                  onClick={() => {
                    const url = value?.fileName ? buildImageUrl(value.fileName) : value?.url
                    if (url) window.open(url, '_blank')
                  }}
                >
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

export default FileUpload
