import React, { useState, useEffect, useRef } from 'react'
import { Upload, Button, message, Modal, Spin, Space, Card, Image, Popconfirm } from 'antd'
import { showValidationError, showSuccess, showError } from '../utils/messageHelper'
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  LoadingOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FileJpgOutlined,
  FilePptOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { uploadFile, deleteFile, buildImageUrl } from '../utils/upload'
import type { ImageType } from '../types'

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

interface MultiFileUploadProps {
  title?: string
  label?: string // 兼容ExpenseForm中的label属性
  value?: Record<string, ImageType>
  onChange?: (value: Record<string, ImageType>) => void
  maxCount?: number
  disabled?: boolean
  onSuccess?: (isAutoSave: boolean) => void
  accept?: string // 接受的文件类型
  showUploadArea?: boolean // 是否显示拖拽上传区域
  onFileUpload?: (fileName: string) => void // 兼容属性
  onFileRemove?: (fileName: string) => void // 兼容属性
}

interface FileItem {
  key: string
  fileName: string
  url: string
}

const MultiFileUpload: React.FC<MultiFileUploadProps> = ({
  title,
  label,
  value = {},
  onChange,
  maxCount = 999,
  disabled = false,
  onSuccess,
  accept = '.jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.doc,.docx,.xls,.xlsx,.csv',
  showUploadArea = true,
  onFileUpload,
  onFileRemove,
}) => {
  const [loading, setLoading] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [retryCount, setRetryCount] = useState<Record<string, number>>({})
  const maxRetries = 3
  const retryTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({})

  // 内部文件状态，用于处理并发上传
  const [internalFiles, setInternalFiles] = useState<Record<string, ImageType>>({})

  // 同步外部value到内部状态（仅在初始化和value从外部变化时）
  useEffect(() => {
    // 使用 JSON.stringify 比较，避免对象引用变化导致的重复更新
    const currentKeys = Object.keys(internalFiles).sort()
    const newKeys = Object.keys(value || {}).sort()
    
    // 只有当键数量或键名真正变化时才更新
    if (JSON.stringify(currentKeys) !== JSON.stringify(newKeys)) {
      setInternalFiles(value || {})
    }
  }, [value, internalFiles])

  // 清理所有定时器
  useEffect(() => {
    return () => {
      Object.values(retryTimeoutsRef.current).forEach(timeout => {
        clearTimeout(timeout)
      })
    }
  }, [])

  // 当value变化时重置重试次数和错误状态
  useEffect(() => {
    if (value && Object.keys(value).length > 0) {
      setRetryCount({})
      setImageErrors({})
    }
  }, [value])

  // 使用内部状态作为数据源
  const safeValue = internalFiles

  // 将值对象转换为文件项数组
  const fileList: FileItem[] = Object.entries(safeValue).map(([key, fileData]) => ({
    key,
    fileName: fileData.fileName || key,
    url: fileData.fileName ? buildImageUrl(fileData.fileName) : fileData.url || '',
  }))

  // 生成下一个键名（使用时间戳确保唯一性）
  const getNextKey = () => {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return `${timestamp}_${random}`
  }

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

  const beforeUpload = (file: File, fileList: File[]) => {
    console.log('beforeUpload called:', file.name, '当前文件列表长度:', fileList.length)
    // 检查数量限制（当前已有文件数量 + 1个新文件）
    const totalCount = Object.keys(safeValue).length + 1
    if (totalCount > maxCount) {
      message.error(`最多只能上传${maxCount}个文件`)
      return false
    }

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

    setUploadingCount(prev => prev + 1)

    try {
      // 使用工具上传文件
      const result = await uploadFile(file)

      if (result) {
        // 生成新的键名
        const newKey = getNextKey()
        console.log('上传成功，生成键名:', newKey, '文件名:', result.fileName)

        // 使用内部状态来管理并发上传
        const newValue = {
          ...internalFiles,
          [newKey]: {
            fileName: result.fileName,
            url: result.url,
          },
        }
        console.log('更新后的值:', newValue)
        setInternalFiles(newValue)
        // 通知外部组件
        onChange?.(newValue)

        onUploadSuccess('上传成功')
        showSuccess.fileUpload(file.name)

        // 调用文件上传回调
        onFileUpload?.(result.fileName)

        // 上传成功后，调用外部回调进行自动保存
        setTimeout(() => onSuccess?.(true), 300)
      } else {
        onError('上传失败')
      }
    } catch (error) {
      console.error('上传出错:', error)
      showError.fileUpload(file.name)
      onError('上传失败')
    } finally {
      setUploadingCount(prev => prev - 1)
    }
  }

  const handleRemove = async (item: FileItem) => {
    const fileName = item.fileName
    setLoading(true)
    try {
      // 提取实际的文件名，处理不同的情况
      let actualFileName = ''

      // 标准文件名的情况
      if (fileName.includes('-')) {
        actualFileName = fileName
      }
      // 从路径中提取的情况
      else if (fileName.includes('/')) {
        actualFileName = fileName.split('/').pop() || ''
      }
      // 使用URL中的最后一部分
      else if (item.url && item.url.includes('/')) {
        const parts = item.url.split('/')
        actualFileName = parts[parts.length - 1].split('?')[0] // 移除查询参数
      }
      // 默认使用键名
      else {
        actualFileName = fileName
      }

      if (actualFileName) {
        await deleteFile(actualFileName)
      }

      // 无论删除API是否成功，从表单中移除该文件
      const newValue = { ...internalFiles }
      delete newValue[item.key]
      setInternalFiles(newValue)
      // 通知外部组件
      onChange?.(newValue)

      // 移除错误记录
      const newImageErrors = { ...imageErrors }
      delete newImageErrors[item.key]
      setImageErrors(newImageErrors)

      showSuccess.delete()

      // 调用文件删除回调
      onFileRemove?.(item.fileName)

      // 删除成功后，调用外部回调进行自动保存
      setTimeout(() => onSuccess?.(true), 300)
    } catch (error) {
      console.error('删除出错:', error)
      message.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = (item: FileItem) => {
    if (item.url) {
      // 添加时间戳避免缓存
      const timestamp = new Date().getTime()
      const urlWithTimestamp = item.url.includes('?')
        ? `${item.url.split('?')[0]}?t=${timestamp}`
        : `${item.url}?t=${timestamp}`

      setPreviewImage(urlWithTimestamp)
      setPreviewTitle(item.key)
      setPreviewVisible(true)

      // 重置重试计数
      const newRetryCount = { ...retryCount }
      newRetryCount[item.key] = 0
      setRetryCount(newRetryCount)

      // 重置错误状态
      const newImageErrors = { ...imageErrors }
      newImageErrors[item.key] = false
      setImageErrors(newImageErrors)
    }
  }

  const handleFileError = (key: string) => {
    const currentRetryCount = retryCount[key] || 0

    if (currentRetryCount < maxRetries && safeValue[key]) {
      // 设置递增的重试延迟: 2秒, 4秒, 8秒
      const retryDelay = Math.pow(2, currentRetryCount + 1) * 1000

      console.log(
        `文件 ${key} 加载失败，${retryDelay / 1000}秒后尝试第${currentRetryCount + 1}次重新加载...`
      )

      // 清除之前的定时器
      if (retryTimeoutsRef.current[key]) {
        clearTimeout(retryTimeoutsRef.current[key])
      }

      // 设置定时器在一定时间后尝试重新加载
      retryTimeoutsRef.current[key] = setTimeout(() => {
        setRetryCount(prev => ({
          ...prev,
          [key]: (prev[key] || 0) + 1,
        }))

        // 强制更新文件列表中的对应项
        const updatedFileList = [...fileList]
        const fileIndex = updatedFileList.findIndex(item => item.key === key)
        if (fileIndex !== -1) {
          const timestamp = new Date().getTime()
          const fileItem = safeValue[key]
          const fileName = fileItem?.fileName || ''
          const originalUrl = fileName ? buildImageUrl(fileName) : fileItem?.url || ''
          const updatedUrl = originalUrl.includes('?')
            ? originalUrl.split('?')[0] + `?t=${timestamp}`
            : originalUrl + `?t=${timestamp}`

          // 如果当前预览的就是这个文件，也更新预览URL
          if (previewTitle === key) {
            setPreviewImage(updatedUrl)
          }
        }
      }, retryDelay)
    } else {
      // 超过最大重试次数，显示错误状态
      setImageErrors(prev => ({
        ...prev,
        [key]: true,
      }))

      if (currentRetryCount >= maxRetries) {
        message.error(`文件 ${key} 加载失败，已尝试${maxRetries}次重新加载`)
      }
    }
  }

  const remainingCount = maxCount - fileList.length

  return (
    <div className="multi-file-upload-container">
      <Spin spinning={loading || uploadingCount > 0} indicator={<LoadingOutlined />}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">{label || title}</h3>
          <span className="text-sm text-gray-500">
            {uploadingCount > 0 && `正在上传 ${uploadingCount} 个文件... `}
            已上传 {fileList.length}/{maxCount} 个文件
          </span>
        </div>

        {/* 拖拽上传区域 */}
        {showUploadArea && !disabled && remainingCount > 0 && (
          <div className="mb-4">
            <Dragger
              name="files"
              multiple
              showUploadList={false}
              beforeUpload={beforeUpload}
              customRequest={handleCustomUpload}
              accept={accept}
              disabled={disabled || remainingCount <= 0}
              className="min-h-32"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持单个或批量上传，还可以上传 {remainingCount} 个文件
              </p>
            </Dragger>
          </div>
        )}

        {/* 快速上传按钮 */}
        {!showUploadArea && !disabled && remainingCount > 0 && (
          <div className="mb-3">
            <Upload
              name="files"
              multiple
              showUploadList={false}
              beforeUpload={beforeUpload}
              customRequest={handleCustomUpload}
              accept={accept}
              disabled={disabled}
            >
              <Button
                type="primary"
                icon={<UploadOutlined />}
                size="small"
                disabled={disabled || remainingCount <= 0}
              >
                添加文件
              </Button>
            </Upload>
          </div>
        )}

        {/* 文件列表 */}
        {fileList.length === 0 ? (
          <div className="text-center p-4 bg-gray-50 rounded border border-dashed">
            暂无文件{!disabled && '，请上传文件'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {fileList.map(item => {
              // 添加时间戳到URL以避免缓存
              const hasRetried = retryCount[item.key] > 0
              const fileUrl =
                hasRetried && item.url
                  ? `${item.url}${item.url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`
                  : item.url

              // 显示标题：总是显示文件名
              const displayTitle =
                item.fileName.length > 20 ? item.fileName.substring(0, 17) + '...' : item.fileName

              return (
                <Card
                  key={item.key}
                  size="small"
                  className="file-card"
                  cover={
                    <div className="file-container h-32 overflow-hidden !flex items-center justify-center bg-gray-50">
                      {imageErrors[item.key] ? (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <FileImageOutlined style={{ fontSize: 30 }} />
                          <span className="mt-2">文件加载失败</span>
                        </div>
                      ) : checkIsImage(item.fileName) ? (
                        <img
                          src={fileUrl}
                          alt={displayTitle}
                          className="max-w-full max-h-full object-contain"
                          onError={() => handleFileError(item.key)}
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-600">
                          <div style={{ fontSize: 40 }}>{getFileIcon(item.fileName)}</div>
                          <span className="mt-2 text-xs">{getFileExtension(item.fileName)}</span>
                        </div>
                      )}
                    </div>
                  }
                  actions={
                    disabled
                      ? [<EyeOutlined key="preview" onClick={() => handlePreview(item)} />]
                      : [
                          <EyeOutlined key="preview" onClick={() => handlePreview(item)} />,
                          <Popconfirm
                            key="delete"
                            title="确认删除"
                            description="删除后将无法恢复，是否确认删除？"
                            onConfirm={() => handleRemove(item)}
                            okText="确认"
                            okType="danger"
                            cancelText="取消"
                          >
                            <DeleteOutlined key="delete-icon" />
                          </Popconfirm>,
                        ]
                  }
                >
                  <Card.Meta title={displayTitle} />
                </Card>
              )
            })}
          </div>
        )}
      </Spin>

      {/* 预览模态框 */}
      <Modal
        open={previewVisible}
        title={label || title || previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        centered
        width={800}
      >
        <div className="flex justify-center">
          {safeValue[previewTitle] && checkIsImage(safeValue[previewTitle]?.fileName || '') ? (
            // 图片预览
            <Image
              alt={previewTitle}
              src={previewImage}
              style={{ maxWidth: '100%' }}
              preview={false}
              fallback="/images/image-placeholder.svg"
              crossOrigin="anonymous"
              onError={() => {
                const currentKey = previewTitle
                handleFileError(currentKey)
              }}
            />
          ) : (
            // 非图片文件预览
            <div className="flex flex-col items-center justify-center p-8">
              <div className="text-6xl mb-4">
                {safeValue[previewTitle]?.fileName ? (
                  getFileIcon(safeValue[previewTitle].fileName)
                ) : (
                  <FileOutlined />
                )}
              </div>
              <div className="text-xl font-bold">
                {safeValue[previewTitle]?.fileName || '未知文件'}
              </div>
              <div className="text-gray-500 mb-4">
                {safeValue[previewTitle]?.fileName
                  ? getFileExtension(safeValue[previewTitle].fileName)
                  : ''}
              </div>
              <Space>
                <Button
                  type="primary"
                  onClick={() => {
                    const fileData = safeValue[previewTitle]
                    if (fileData) {
                      const url = fileData.fileName
                        ? buildImageUrl(fileData.fileName)
                        : fileData.url
                      if (url) window.open(url, '_blank')
                    }
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

export default MultiFileUpload
