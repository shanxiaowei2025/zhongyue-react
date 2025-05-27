import React, { useState, useEffect, useRef } from 'react'
import { Upload, Button, message, Modal, Spin, Image } from 'antd'
import { UploadOutlined, DeleteOutlined, EyeOutlined, LoadingOutlined } from '@ant-design/icons'
import type { UploadFile } from 'antd/es/upload/interface'
import { uploadFile, deleteFile, buildImageUrl } from '../utils/upload'

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

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('只能上传图片文件！')
    }
    return isImage
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
          accept="image/*"
          disabled={disabled}
          onPreview={() => handlePreview()}
        >
          {!value && (
            <div>
              <UploadOutlined />
              <div style={{ marginTop: 8 }}>上传{label}</div>
            </div>
          )}
        </Upload>

        {value && (
          <div className="image-actions mt-2">
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
        </div>
      </Modal>
    </div>
  )
}

export default ImageUpload
