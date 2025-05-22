import React, { useState, useEffect, useRef } from 'react'
import { Upload, Button, message, Modal, Spin, Image, Space } from 'antd'
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
} from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import { uploadFile, deleteFile, buildImageUrl } from '../utils/upload'

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

interface FileUploadProps {
  label: string
  value?: { fileName: string; url: string }
  onChange?: (value: { fileName: string; url: string } | undefined) => void
  disabled?: boolean
  onSuccess?: (isAutoSave: boolean) => void
  accept?: string // 新增: 接受的文件类型，默认为所有文件
  multiple?: boolean // 新增: 是否允许多文件上传
  maxCount?: number // 新增: 最大上传数量，默认为1
  onFileUpload?: (fileName: string) => void // 新增: 文件上传成功回调
  onFileRemove?: () => void // 新增: 文件删除回调
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  onSuccess,
  accept = '*',
  multiple = false,
  maxCount = 1,
  onFileUpload,
  onFileRemove,
}) => {
  const [loading, setLoading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewFile, setPreviewFile] = useState('')
  const [isImage, setIsImage] = useState(false)
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
      const result = await uploadFile(file)
      if (result) {
        onChange?.(result)
        onUploadSuccess('上传成功')
        message.success('上传成功')
        setFileError(false)

        // 记录上传的文件
        onFileUpload?.(result.fileName)

        // 检查是否是图片
        setIsImage(checkIsImage(result.fileName))

        // 上传成功后，调用外部回调进行自动保存
        setTimeout(() => onSuccess?.(true), 300)
      } else {
        onError('上传失败')
      }
    } catch (error) {
      console.error('上传出错:', error)
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

      // 尝试从URL中提取更精确的文件名
      if (value.url) {
        const urlParts = value.url.split('/')
        const lastPart = urlParts[urlParts.length - 1]
        if (lastPart) {
          fileNameToDelete = lastPart.split('?')[0] // 移除可能的查询参数
        }
      }

      const success = await deleteFile(fileNameToDelete)
      if (success) {
        onChange?.(undefined)
        message.success('删除成功')

        // 通知外部组件文件已删除
        onFileRemove?.()

        // 删除成功后，调用外部回调进行自动保存
        setTimeout(() => onSuccess?.(true), 300)
        return true
      }
      return false
    } catch (error) {
      console.error('删除出错:', error)
      message.error('删除失败')
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

      // 检查是否是图片
      setIsImage(checkIsImage(value.fileName))

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

  // 处理图片加载错误
  const handleImageError = () => {
    if (retryCount < maxRetries && value?.url && isImage) {
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
    } else if (isImage) {
      // 超过最大重试次数，显示错误状态
      setFileError(true)
      message.error(`图片加载失败，已尝试${maxRetries}次重新加载`)
    }
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

  return (
    <div className="file-upload-container">
      <Spin spinning={loading} indicator={<LoadingOutlined />}>
        <Upload
          listType="picture-card"
          maxCount={maxCount}
          fileList={fileList}
          beforeUpload={beforeUpload}
          customRequest={handleCustomUpload}
          onRemove={handleRemove}
          accept={accept}
          disabled={disabled}
          onPreview={() => handlePreview()}
          multiple={multiple}
        >
          {(!value || multiple) && fileList.length < maxCount && (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>上传{label}</div>
            </div>
          )}
        </Upload>

        {value && (
          <div className="file-actions mt-2">
            <Button type="text" icon={<EyeOutlined />} onClick={handlePreview} size="small">
              预览
            </Button>
            {!disabled && (
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={handleRemove}
                size="small"
              >
                删除
              </Button>
            )}
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
          {isImage ? (
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
              <div className="text-6xl mb-4">{getFileIcon(value?.fileName || '')}</div>
              <div className="text-xl font-bold">{value?.fileName || '未知文件'}</div>
              <div className="text-gray-500 mb-4">{getFileExtension(value?.fileName || '')}</div>
              <Space>
                <Button type="primary" onClick={() => window.open(previewFile, '_blank')}>
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
