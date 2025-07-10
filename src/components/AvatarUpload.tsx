import React, { useState, useRef, useCallback } from 'react'
import { Upload, Button, message, Modal, Avatar, Spin } from 'antd'
import {
  UploadOutlined,
  UserOutlined,
  LoadingOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { uploadFile, deleteFile, buildImageUrl } from '../utils/upload'

const { Dragger } = Upload

interface AvatarUploadProps {
  value?: { fileName: string; url: string }
  onChange?: (value: { fileName: string; url: string } | undefined) => void
  disabled?: boolean
  onSuccess?: (isAutoSave: boolean) => void
  size?: number // 头像显示大小，默认80
  showDragArea?: boolean // 是否显示拖拽上传区域
}

interface CropperState {
  image: HTMLImageElement
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  isDragging: boolean
  startX: number
  startY: number
  cropX: number
  cropY: number
  cropSize: number
  scale: number
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  value,
  onChange,
  disabled = false,
  onSuccess,
  size = 80,
  showDragArea = false,
}) => {
  const [loading, setLoading] = useState(false)
  const [cropModalVisible, setCropModalVisible] = useState(false)
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cropperRef = useRef<CropperState | null>(null)

  // 检查是否为图片文件
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/')
  }

  // 在canvas上绘制图片和裁剪框
  const drawImageAndCrop = useCallback((cropper: CropperState) => {
    const { image, canvas, ctx, cropX, cropY, cropSize, scale } = cropper
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 绘制缩放后的图片
    const scaledWidth = image.width * scale
    const scaledHeight = image.height * scale
    const offsetX = (canvas.width - scaledWidth) / 2
    const offsetY = (canvas.height - scaledHeight) / 2
    
    ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight)
    
    // 绘制遮罩层
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 清除裁剪区域的遮罩
    ctx.globalCompositeOperation = 'destination-out'
    ctx.fillRect(cropX, cropY, cropSize, cropSize)
    
    // 重新绘制裁剪区域的图片
    ctx.globalCompositeOperation = 'source-over'
    ctx.save()
    ctx.beginPath()
    ctx.rect(cropX, cropY, cropSize, cropSize)
    ctx.clip()
    ctx.drawImage(image, offsetX, offsetY, scaledWidth, scaledHeight)
    ctx.restore()
    
    // 绘制裁剪框边框
    ctx.strokeStyle = '#1890ff'
    ctx.lineWidth = 2
    ctx.strokeRect(cropX, cropY, cropSize, cropSize)
  }, [])

  // 初始化裁剪器
  const initializeCropper = useCallback((file: File) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const image = new Image()
    image.onload = () => {
      // 设置canvas大小
      canvas.width = 400
      canvas.height = 400

      // 计算初始缩放比例，使图片适应canvas
      const scaleX = canvas.width / image.width
      const scaleY = canvas.height / image.height
      const scale = Math.min(scaleX, scaleY, 1) // 不放大，只缩小

      // 计算裁剪框大小和位置
      const cropSize = Math.min(canvas.width, canvas.height) * 0.6
      const cropX = (canvas.width - cropSize) / 2
      const cropY = (canvas.height - cropSize) / 2

      const cropper: CropperState = {
        image,
        canvas,
        ctx,
        isDragging: false,
        startX: 0,
        startY: 0,
        cropX,
        cropY,
        cropSize,
        scale,
      }

      cropperRef.current = cropper
      drawImageAndCrop(cropper)
    }

    // 创建图片URL
    const imageUrl = URL.createObjectURL(file)
    image.src = imageUrl

    // 清理URL对象
    image.onload = () => {
      URL.revokeObjectURL(imageUrl)
      const scaleX = canvas.width / image.width
      const scaleY = canvas.height / image.height
      const scale = Math.min(scaleX, scaleY, 1)

      const cropSize = Math.min(canvas.width, canvas.height) * 0.6
      const cropX = (canvas.width - cropSize) / 2
      const cropY = (canvas.height - cropSize) / 2

      const cropper: CropperState = {
        image,
        canvas,
        ctx,
        isDragging: false,
        startX: 0,
        startY: 0,
        cropX,
        cropY,
        cropSize,
        scale,
      }

      cropperRef.current = cropper
      drawImageAndCrop(cropper)
    }
  }, [drawImageAndCrop])

  // 处理鼠标事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cropper = cropperRef.current
    if (!cropper) return

    const rect = cropper.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 检查是否点击在裁剪框内
    if (
      x >= cropper.cropX &&
      x <= cropper.cropX + cropper.cropSize &&
      y >= cropper.cropY &&
      y <= cropper.cropY + cropper.cropSize
    ) {
      cropper.isDragging = true
      cropper.startX = x - cropper.cropX
      cropper.startY = y - cropper.cropY
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cropper = cropperRef.current
    if (!cropper || !cropper.isDragging) return

    const rect = cropper.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // 计算新的裁剪框位置
    let newCropX = x - cropper.startX
    let newCropY = y - cropper.startY

    // 限制裁剪框在canvas范围内
    newCropX = Math.max(0, Math.min(newCropX, cropper.canvas.width - cropper.cropSize))
    newCropY = Math.max(0, Math.min(newCropY, cropper.canvas.height - cropper.cropSize))

    cropper.cropX = newCropX
    cropper.cropY = newCropY

    drawImageAndCrop(cropper)
  }

  const handleMouseUp = () => {
    const cropper = cropperRef.current
    if (cropper) {
      cropper.isDragging = false
    }
  }

  // 裁剪图片
  const cropImage = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const cropper = cropperRef.current
      if (!cropper) {
        resolve(null)
        return
      }

      // 创建新的canvas用于输出裁剪结果
      const outputCanvas = document.createElement('canvas')
      const outputCtx = outputCanvas.getContext('2d')
      if (!outputCtx) {
        resolve(null)
        return
      }

      // 设置输出尺寸为正方形
      const outputSize = 200 // 头像输出大小
      outputCanvas.width = outputSize
      outputCanvas.height = outputSize

      // 计算原图在canvas中的实际位置和大小
      const scaledWidth = cropper.image.width * cropper.scale
      const scaledHeight = cropper.image.height * cropper.scale
      const offsetX = (cropper.canvas.width - scaledWidth) / 2
      const offsetY = (cropper.canvas.height - scaledHeight) / 2

      // 计算裁剪区域在原图中的位置
      const cropStartX = (cropper.cropX - offsetX) / cropper.scale
      const cropStartY = (cropper.cropY - offsetY) / cropper.scale
      const cropWidth = cropper.cropSize / cropper.scale
      const cropHeight = cropper.cropSize / cropper.scale

      // 绘制裁剪后的图片
      outputCtx.drawImage(
        cropper.image,
        cropStartX,
        cropStartY,
        cropWidth,
        cropHeight,
        0,
        0,
        outputSize,
        outputSize
      )

      // 转换为Blob
      outputCanvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg', 0.9)
    })
  }

  // 确认裁剪
  const handleCropConfirm = async () => {
    if (!originalFile) return

    setLoading(true)
    try {
      const croppedBlob = await cropImage()
      if (!croppedBlob) {
        message.error('图片裁剪失败')
        return
      }

      // 创建新的File对象
      const croppedFile = new File([croppedBlob], originalFile.name, {
        type: 'image/jpeg',
      })

      // 上传裁剪后的图片
      const result = await uploadFile(croppedFile)
      if (result) {
        onChange?.(result)
        message.success('头像上传成功')
        setCropModalVisible(false)
        setOriginalFile(null)

        // 上传成功后，调用外部回调进行自动保存
        setTimeout(() => onSuccess?.(true), 300)
      } else {
        message.error('头像上传失败')
      }
    } catch (error) {
      console.error('头像上传出错:', error)
      message.error('头像上传失败')
    } finally {
      setLoading(false)
    }
  }

  // 文件上传前验证
  const beforeUpload = (file: File) => {
    console.log('beforeUpload called:', file.name)

    // 只允许图片文件
    if (!isImageFile(file)) {
      message.error('只能上传图片文件！')
      return false
    }

    // 文件大小限制（可选）
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('图片大小不能超过10MB！')
      return false
    }

    // 存储原始文件并打开裁剪模态框
    setOriginalFile(file)
    setCropModalVisible(true)
    initializeCropper(file)

    return false // 阻止自动上传
  }

  // 删除头像
  const handleRemove = async () => {
    if (!value?.fileName) return

    setLoading(true)
    try {
      await deleteFile(value.fileName)
      onChange?.(undefined)
      message.success('头像删除成功')

      // 删除成功后，调用外部回调进行自动保存
      setTimeout(() => onSuccess?.(true), 300)
    } catch (error) {
      console.error('头像删除出错:', error)
      message.error('头像删除失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="avatar-upload-container">
      <Spin spinning={loading} indicator={<LoadingOutlined />}>
        <div className="flex flex-col items-center space-y-4">
          {/* 头像显示 */}
          <Avatar
            size={size}
            src={value?.url ? (value.fileName ? buildImageUrl(value.fileName) : value.url) : undefined}
            icon={!value?.url ? <UserOutlined /> : undefined}
            className="border-2 border-gray-200"
          />

          {/* 上传控件 */}
          {!disabled && (
            <div className="flex flex-col items-center space-y-2">
              {showDragArea && !value ? (
                // 拖拽上传区域
                <Dragger
                  name="avatar"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  accept="image/*"
                  className="!w-48 !h-32"
                >
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽图片到此区域</p>
                  <p className="ant-upload-hint">
                    支持JPG、PNG、GIF等图片格式
                  </p>
                </Dragger>
              ) : (
                // 标准上传按钮
                <Upload
                  name="avatar"
                  showUploadList={false}
                  beforeUpload={beforeUpload}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />}>
                    {value ? '更换头像' : '上传头像'}
                  </Button>
                </Upload>
              )}

              {value && (
                <Button danger type="text" onClick={handleRemove} size="small">
                  删除头像
                </Button>
              )}
            </div>
          )}
        </div>
      </Spin>

      {/* 图片裁剪模态框 */}
      <Modal
        title="裁剪头像"
        open={cropModalVisible}
        onOk={handleCropConfirm}
        onCancel={() => {
          setCropModalVisible(false)
          setOriginalFile(null)
        }}
        okText="确认"
        cancelText="取消"
        width={500}
        confirmLoading={loading}
      >
        <div className="flex flex-col items-center space-y-4">
          <p className="text-gray-600">拖动裁剪框选择头像区域</p>
          <canvas
            ref={canvasRef}
            className="border border-gray-300 cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          <p className="text-sm text-gray-500">
            头像将被裁剪为200x200像素的正方形
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default AvatarUpload