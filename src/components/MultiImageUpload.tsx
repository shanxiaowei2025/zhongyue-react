import React, { useState, useEffect, useRef } from 'react'
import { Upload, Button, message, Modal, Spin, Input, Form, Space, Card, Image } from 'antd'
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  LoadingOutlined,
  FileImageOutlined,
} from '@ant-design/icons'
import { uploadFile, deleteFile, buildImageUrl } from '../utils/upload'
import type { ImageType } from '../types'

interface MultiImageUploadProps {
  title?: string
  value?: Record<string, ImageType>
  onChange?: (value: Record<string, ImageType>) => void
  maxCount?: number
  disabled?: boolean
  onSuccess?: (isAutoSave: boolean) => void
  listType?: 'text' | 'picture' | 'picture-card'
}

interface ImageItem {
  key: string
  fileName: string
  url: string
}

const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  title,
  value = {},
  onChange,
  maxCount = 10,
  disabled = false,
  onSuccess,
  listType = 'picture-card',
}) => {
  const [loading, setLoading] = useState(false)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [newImageLabel, setNewImageLabel] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})
  const [retryCount, setRetryCount] = useState<Record<string, number>>({})
  const maxRetries = 3
  const retryTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({})

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

  // 将值对象转换为图片项数组
  const imageList: ImageItem[] = Object.entries(value || {}).map(([key, imageData]) => ({
    key,
    fileName: imageData.fileName || key,
    url: imageData.fileName ? buildImageUrl(imageData.fileName) : imageData.url || '',
  }))

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/')
    if (!isImage) {
      message.error('只能上传图片文件！')
      return false
    }

    // 显示文件预览
    const reader = new FileReader()
    reader.onload = e => {
      setFilePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    setSelectedFile(file)
    return false // 阻止自动上传
  }

  const handleAddImage = async () => {
    if (!selectedFile) {
      message.error('请选择图片')
      return
    }

    if (!newImageLabel.trim()) {
      message.error('请输入图片标签')
      return
    }

    if (value && Object.keys(value).some(key => key === newImageLabel)) {
      message.error('标签已存在，请更换标签名')
      return
    }

    setLoading(true)
    try {
      const result = await uploadFile(selectedFile)
      if (result) {
        const newValue = {
          ...value,
          [newImageLabel]: {
            fileName: result.fileName,
            url: result.url,
          },
        }
        onChange?.(newValue)
        message.success('上传成功')
        setIsAddModalVisible(false)
        setNewImageLabel('')
        setSelectedFile(null)
        setFilePreview(null)

        // 上传成功后，调用外部回调进行自动保存
        setTimeout(() => onSuccess?.(true), 300)
      }
    } catch (error) {
      console.error('上传出错:', error)
      message.error('上传失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (item: ImageItem) => {
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

      // 无论删除API是否成功，从表单中移除该图片
      const newValue = { ...value }
      delete newValue[item.key]
      onChange?.(newValue)

      // 移除错误记录
      const newImageErrors = { ...imageErrors }
      delete newImageErrors[item.key]
      setImageErrors(newImageErrors)

      message.success('删除成功')

      // 删除成功后，调用外部回调进行自动保存
      setTimeout(() => onSuccess?.(true), 300)
    } catch (error) {
      console.error('删除出错:', error)
      message.error('删除失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = (item: ImageItem) => {
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

  const handleImageError = (key: string) => {
    const currentRetryCount = retryCount[key] || 0

    if (currentRetryCount < maxRetries && value[key]) {
      // 设置递增的重试延迟: 2秒, 4秒, 8秒
      const retryDelay = Math.pow(2, currentRetryCount + 1) * 1000

      console.log(
        `图片 ${key} 加载失败，${retryDelay / 1000}秒后尝试第${currentRetryCount + 1}次重新加载...`
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

        // 强制更新图片列表中的对应项
        const updatedImageList = [...imageList]
        const imageIndex = updatedImageList.findIndex(item => item.key === key)
        if (imageIndex !== -1) {
          const timestamp = new Date().getTime()
          const imageItem = value[key]
          const fileName = imageItem.fileName || ''
          const originalUrl = fileName ? buildImageUrl(fileName) : imageItem.url || ''
          const updatedUrl = originalUrl.includes('?')
            ? originalUrl.split('?')[0] + `?t=${timestamp}`
            : originalUrl + `?t=${timestamp}`

          // 如果当前预览的就是这张图片，也更新预览图URL
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
        message.error(`图片 ${key} 加载失败，已尝试${maxRetries}次重新加载`)
      }
    }
  }

  return (
    <div className="multi-image-upload-container">
      <Spin spinning={loading} indicator={<LoadingOutlined />}>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">{title}</h3>
          {!disabled && imageList.length < maxCount && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsAddModalVisible(true)}
              size="small"
            >
              添加图片
            </Button>
          )}
        </div>

        {imageList.length === 0 ? (
          <div className="text-center p-4 bg-gray-50 rounded border border-dashed">
            暂无图片{!disabled && '，请点击上方按钮添加'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {imageList.map(item => {
              // 添加时间戳到URL以避免缓存
              const hasRetried = retryCount[item.key] > 0
              const imgUrl =
                hasRetried && item.url
                  ? `${item.url}${item.url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`
                  : item.url

              return (
                <Card
                  key={item.key}
                  size="small"
                  className="image-card"
                  cover={
                    <div className="image-container h-32 overflow-hidden flex items-center justify-center bg-gray-50">
                      {imageErrors[item.key] ? (
                        <div className="flex flex-col items-center justify-center text-gray-400">
                          <FileImageOutlined style={{ fontSize: 30 }} />
                          <span className="mt-2">图片加载失败</span>
                        </div>
                      ) : (
                        <img
                          src={imgUrl}
                          alt={item.key}
                          className="max-w-full max-h-full object-contain"
                          onError={() => handleImageError(item.key)}
                          crossOrigin="anonymous"
                        />
                      )}
                    </div>
                  }
                  actions={
                    disabled
                      ? [<EyeOutlined key="preview" onClick={() => handlePreview(item)} />]
                      : [
                          <EyeOutlined key="preview" onClick={() => handlePreview(item)} />,
                          <DeleteOutlined key="delete" onClick={() => handleRemove(item)} />,
                        ]
                  }
                >
                  <Card.Meta title={item.key} />
                </Card>
              )
            })}
          </div>
        )}
      </Spin>

      {/* 预览模态框 */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        centered
        width={800}
      >
        <div className="flex justify-center">
          <Image
            alt={previewTitle}
            src={previewImage}
            style={{ maxWidth: '100%' }}
            preview={false}
            fallback="/images/image-placeholder.svg"
            crossOrigin="anonymous"
            onError={() => {
              const currentKey = previewTitle
              handleImageError(currentKey)
            }}
          />
        </div>
      </Modal>

      {/* 添加图片模态框 */}
      <Modal
        open={isAddModalVisible}
        title="添加图片"
        onCancel={() => {
          setIsAddModalVisible(false)
          setNewImageLabel('')
          setSelectedFile(null)
          setFilePreview(null)
        }}
        onOk={handleAddImage}
        okButtonProps={{ disabled: !selectedFile || !newImageLabel.trim() }}
        okText="上传"
        cancelText="取消"
      >
        <Spin spinning={loading}>
          <Form layout="vertical">
            <Form.Item label="图片标签" required>
              <Input
                placeholder="请输入图片标签（如：股东信息、税务登记证等）"
                value={newImageLabel}
                onChange={e => setNewImageLabel(e.target.value)}
                maxLength={20}
                showCount
              />
            </Form.Item>

            <Form.Item label="上传图片" required>
              <Upload
                listType="picture-card"
                showUploadList={false}
                beforeUpload={beforeUpload}
                accept="image/*"
              >
                {filePreview ? (
                  <div className="relative w-full h-full">
                    <img src={filePreview} alt="预览" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <UploadOutlined className="text-white text-2xl" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>选择图片</div>
                  </div>
                )}
              </Upload>
              <div className="text-gray-500 text-xs mt-1">支持 JPG、PNG 格式，文件小于 5MB</div>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </div>
  )
}

export default MultiImageUpload
