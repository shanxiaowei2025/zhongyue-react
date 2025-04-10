import React, { useState } from 'react'
import { message } from 'antd'
import { Upload, Button } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
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
  accept = '*',
  maxSize = 5,
  multiple = false,
  directory = '',
}) => {
  const [loading, setLoading] = useState(false)

  const handleUpload = async (file: File) => {
    setLoading(true)
    try {
      // 这里需要调用后端 API 获取预签名 URL
      const response = await fetch('/api/upload/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filename: file.name,
          directory,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.message || '获取上传 URL 失败')
      }

      // 使用预签名 URL 上传文件
      const uploadResponse = await fetch(data.data.url, {
        method: 'PUT',
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error('文件上传失败')
      }

      // 更新文件路径
      onChange?.(data.data.path)
      message.success('上传成功')
    } catch (error: any) {
      message.error(error?.message || '上传失败')
    } finally {
      setLoading(false)
    }
  }

  const beforeUpload = (file: File) => {
    // 检查文件大小
    const isLtMaxSize = file.size / 1024 / 1024 < maxSize
    if (!isLtMaxSize) {
      message.error(`文件大小不能超过 ${maxSize}MB!`)
      return false
    }
    return true
  }

  return (
    <div>
      <Upload
        beforeUpload={beforeUpload}
        customRequest={({ file }) => handleUpload(file as File)}
        showUploadList={false}
        accept={accept}
        multiple={multiple}
      >
        <Button icon={<UploadOutlined />} loading={loading}>
          点击上传
        </Button>
      </Upload>
      {value && (
        <div style={{ marginTop: 8 }}>
          <a href={getMinioUrl(value)} target="_blank" rel="noopener noreferrer">
            查看文件
          </a>
        </div>
      )}
    </div>
  )
}

export default MinioUpload
