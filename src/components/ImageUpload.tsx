import React, { useState, useEffect, useRef } from 'react'
import { Upload, Button, message, Modal, Spin, Image, Popconfirm, Space } from 'antd'
import { 
  UploadOutlined, 
  DeleteOutlined, 
  EyeOutlined, 
  LoadingOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FileJpgOutlined
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
  csv: <FileTextOutlined />,
  jpg: <FileJpgOutlined />,
  jpeg: <FileJpgOutlined />,
  png: <FileImageOutlined />,
  gif: <FileImageOutlined />,
  bmp: <FileImageOutlined />,
  webp: <FileImageOutlined />,
  txt: <FileTextOutlined />,
  default: <FileOutlined />,
}

interface ImageUploadProps {
  label: string
  value?: { fileName: string; url: string }
  onChange?: (value: { fileName: string; url: string } | undefined) => void
  disabled?: boolean
  onSuccess?: (isAutoSave: boolean) => void
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [imageError, setImageError] = useState(false)
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
      setImageError(false)
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
    // 支持的文件格式：图片、PDF、Word、Excel、CSV
    const allowedTypes = [
      // 图片格式
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
      // PDF格式
      'application/pdf',
      // Word格式
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Excel格式  
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // CSV格式
      'text/csv', 'application/csv'
    ]

    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv']
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
    const isAllowedType = allowedTypes.includes(file.type) || allowedExtensions.includes(fileExtension)
    
    if (!isAllowedType) {
      message.error('只能上传图片、PDF、Word、Excel、CSV格式的文件！')
      return false
    }

    // 移除文件大小限制，支持任意大小文件上传
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
        setImageError(false)

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

      // 如果文件名不包含连字符（可能是从URL生成的文件名），
      // 尝试从URL中提取更精确的文件名
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
        message.success('删除成功')

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

      setPreviewImage(urlWithTimestamp)
      setPreviewVisible(true)

      // 重置重试计数
      setRetryCount(0)
      setImageError(false)
    }
  }

  // 生成上传文件列表
  const fileList: UploadFile[] =
    value && !imageError
      ? [
          {
            uid: '-1',
            name: value.fileName || '图片',
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
        setPreviewImage(
          `${value.fileName ? buildImageUrl(value.fileName) : value.url}?t=${new Date().getTime()}`
        )
      }, retryDelay)
    } else {
      // 超过最大重试次数，显示错误状态
      setImageError(true)
      message.error(`图片加载失败，已尝试${maxRetries}次重新加载`)
    }
  }

  return (
    <div className="image-upload-container">
      <Spin spinning={loading} indicator={<LoadingOutlined />}>
        <Upload
          listType="picture-card"
          maxCount={1}
          fileList={fileList}
          beforeUpload={beforeUpload}
          customRequest={handleCustomUpload}
          onRemove={handleRemove}
          accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
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

        {value && (
          <div className="image-actions mt-2">
            <Button type="text" icon={<EyeOutlined />} onClick={handlePreview} size="small">
              预览
            </Button>
            {!disabled && (
              <Popconfirm
                title="确认删除"
                description="删除后将无法恢复，是否确认删除？"
                onConfirm={handleRemove}
                okText="确认"
                okType='danger'
                cancelText="取消"
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                >
                  删除
                </Button>
              </Popconfirm>
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
          {value && checkIsImage(value.fileName) ? (
            // 图片预览
            <Image
              alt={label}
              src={
                previewImage ||
                (value?.url ? (value.fileName ? buildImageUrl(value.fileName) : value.url) : '')
              }
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

export default ImageUpload
