import React, { useState } from 'react'
import { message, Image } from 'antd'
import { Upload, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { getUploadUrl } from '../api/upload'
import { getMinioUrl } from '../utils/minio'

interface MinioUploadProps {
  value?: string
  onChange?: (value: string) => void
  accept?: string
  maxSize?: number // MB
  multiple?: boolean
  directory?: string
}

const MinioUpload: React.FC<MinioUploadProps> = ({
  value,
  onChange,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 默认5MB
  multiple = false,
  directory = 'uploads',
}) => {
  const [imagePreview, setImagePreview] = useState<{ visible: boolean; url: string }>({
    visible: false,
    url: '',
  })

  const handleUpload = async (file: File) => {
    try {
      const data = await getUploadUrl(file.name, directory)
      if (data.success) {
        const response = await fetch(data.data.url, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        })

        if (response.ok) {
          message.success('上传成功')
          onChange?.(data.data.path)
        } else {
          throw new Error('上传失败')
        }
      } else {
        throw new Error(data.message || '获取上传地址失败')
      }
    } catch (error) {
      message.error(error?.message || '上传失败')
    }
  }

  return (
    <div>
      <Upload
        accept={accept}
        beforeUpload={file => {
          if (file.size > maxSize) {
            message.error(`文件大小不能超过 ${maxSize / 1024 / 1024}MB`)
            return false
          }
          handleUpload(file)
          return false
        }}
        showUploadList={false}
        multiple={multiple}
      >
        <Button icon={<UploadOutlined />}>上传文件</Button>
      </Upload>
      {value && (
        <div style={{ marginTop: 8 }}>
          <div className="customer-image-preview">
            <img
              src={getMinioUrl(String(value))}
              alt="预览"
              className="w-24 h-24 object-cover rounded-md"
              onClick={() => setImagePreview({ visible: true, url: getMinioUrl(String(value)) })}
              onError={e => {
                ;(e.target as HTMLImageElement).onerror = null
                ;(e.target as HTMLImageElement).src = '/images/image-placeholder.svg'
                ;(e.target as HTMLImageElement).className =
                  'w-24 h-24 object-contain rounded-md opacity-60'
                ;(e.target as HTMLImageElement).style.cursor = 'not-allowed'
              }}
            />
          </div>
        </div>
      )}
      <Image
        width={0}
        style={{ display: 'none' }}
        src={imagePreview.url}
        preview={{
          visible: imagePreview.visible,
          src: imagePreview.url,
          onVisibleChange: visible => {
            setImagePreview(prev => ({ ...prev, visible }))
          },
        }}
      />
    </div>
  )
}

export default MinioUpload
