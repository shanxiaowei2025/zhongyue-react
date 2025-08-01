import React, { useState } from 'react'
import {
  Card,
  Descriptions,
  Button,
  Typography,
  Tag,
  Space,
  Spin,
  Divider,
  List,
  Empty,
  message,
  Modal,
  Image,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DownloadOutlined,
  FileTextOutlined,
  EyeOutlined,
  FileImageOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileJpgOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { useEmployeeDetail } from '../../hooks/useEmployee'
import { buildImageUrl } from '../../utils/upload'
import type { Employee, ResumeFile } from '../../types/employee'

const { Title, Text } = Typography

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
  bmp: <FileImageOutlined />,
  webp: <FileImageOutlined />,
  default: <FileOutlined />,
}

const EmployeeDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { employee, isLoading, error } = useEmployeeDetail(id ? parseInt(id) : null)

  // 预览状态
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  const handleBack = () => {
    navigate('/employees')
  }

  const handleEdit = () => {
    if (employee) {
      navigate(`/employees/edit/${employee.id}`)
    }
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

  // 构建文件完整URL
  const getFileUrl = (file: ResumeFile): string => {
    if (
      file.fileUrl &&
      (file.fileUrl.startsWith('http://') || file.fileUrl.startsWith('https://'))
    ) {
      return file.fileUrl
    }
    return buildImageUrl(file.fileName)
  }

  const handleDownloadResume = async (file: ResumeFile) => {
    try {
      const fileUrl = getFileUrl(file)

      // 使用fetch获取文件内容，创建Blob进行真正的下载
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          Accept: '*/*',
        },
      })

      if (!response.ok) {
        throw new Error(`下载失败: ${response.status}`)
      }

      const blob = await response.blob()

      // 创建下载链接
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = file.fileName
      document.body.appendChild(link)
      link.click()

      // 清理
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      message.success(`${file.fileName} 下载成功`)
    } catch (error: any) {
      console.error('文件下载错误:', error)
      message.error(`文件下载失败: ${error.message || '未知错误'}`)
    }
  }

  // 处理文件预览
  const handlePreviewFile = (file: ResumeFile) => {
    const fileUrl = getFileUrl(file)

    if (checkIsImage(file.fileName)) {
      // 图片预览
      setPreviewImage(fileUrl)
      setPreviewTitle(file.fileName)
      setPreviewVisible(true)
    } else {
      // 非图片文件，在新窗口打开
      window.open(fileUrl, '_blank')
    }
  }

  const renderEmployeeType = (type?: string) => {
    if (!type) return '-'
    const colors = {
      正式: 'green',
      实习: 'blue',
      临时: 'orange',
      外包: 'purple',
    }
    return <Tag color={colors[type as keyof typeof colors] || 'default'}>{type}</Tag>
  }

  const renderStatus = (isResigned: boolean) => (
    <Tag color={!isResigned ? 'success' : 'error'}>{!isResigned ? '在职' : '已离职'}</Tag>
  )

  const renderSalary = (salary?: number) => {
    if (salary === undefined || salary === null) return <Text type="secondary">未设置</Text>
    return <Text strong>¥{salary.toLocaleString()}</Text>
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const renderResumeFiles = (files?: ResumeFile[]) => {
    if (!files || files.length === 0) {
      return <Empty description="暂无简历文件" />
    }

    return (
      <List
        dataSource={files}
        renderItem={file => {
          const isImage = checkIsImage(file.fileName)
          const fileUrl = getFileUrl(file)

          return (
            <List.Item
              actions={[
                <Button
                  key="preview"
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => handlePreviewFile(file)}
                >
                  {isImage ? '预览' : '查看'}
                </Button>,
                <Button
                  key="download"
                  type="text"
                  icon={<DownloadOutlined />}
                  onClick={() => handleDownloadResume(file)}
                >
                  下载
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  isImage ? (
                    <div className="w-12 h-12 rounded border overflow-hidden flex items-center justify-center bg-gray-50">
                      <img
                        src={fileUrl}
                        alt={file.fileName}
                        className="max-w-full max-h-full object-cover"
                        onError={e => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                      <div className="hidden flex items-center justify-center text-gray-400">
                        {getFileIcon(file.fileName)}
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded border flex items-center justify-center bg-gray-50 text-gray-600">
                      <div style={{ fontSize: '24px' }}>{getFileIcon(file.fileName)}</div>
                    </div>
                  )
                }
                title={
                  <Space>
                    <Text strong>{file.fileName}</Text>
                    {isImage && <Tag color="blue">图片</Tag>}
                    <Tag color="default">{getFileExtension(file.fileName)}</Tag>
                  </Space>
                }
                description={
                  <Space>
                    <Text type="secondary">{formatFileSize(file.fileSize)}</Text>
                    <Text type="secondary">
                      上传时间：{dayjs(file.uploadTime).format('YYYY-MM-DD HH:mm:ss')}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )
        }}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" />
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="p-6">
        <Card>
          <Empty description="员工信息不存在或加载失败" />
          <div className="text-center mt-4">
            <Button onClick={handleBack}>返回员工列表</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack} className="mr-4">
              返回
            </Button>
            <Title level={2} className="m-0">
              员工详情
            </Title>
          </div>
          <Button type="primary" icon={<EditOutlined />} onClick={handleEdit}>
            编辑员工
          </Button>
        </div>
      </div>

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 基本信息 */}
        <Card title="基本信息">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="员工ID">{employee.id}</Descriptions.Item>
            <Descriptions.Item label="员工姓名">
              <Text strong>{employee.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="员工类型">
              {renderEmployeeType(employee.employeeType)}
            </Descriptions.Item>
            <Descriptions.Item label="在职状态">
              {renderStatus(employee.isResigned)}
            </Descriptions.Item>
            <Descriptions.Item label="职位">{employee.position || '-'}</Descriptions.Item>
            <Descriptions.Item label="职级">{employee.rank || '-'}</Descriptions.Item>
            <Descriptions.Item label="提成比率职位">
              {employee.commissionRatePosition || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="工龄">
              {employee.workYears !== undefined && employee.workYears !== null
                ? `${employee.workYears}年`
                : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 薪资信息 */}
        <Card title="薪资信息">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="基础工资">
              {renderSalary(employee.baseSalary)}
            </Descriptions.Item>
            <Descriptions.Item label="薪资发放公司">
              {employee.payrollCompany || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="入职时间">
              {employee.hireDate ? dayjs(employee.hireDate).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 个人信息 */}
        <Card title="个人信息">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="身份证号">{employee.idCardNumber || '-'}</Descriptions.Item>
            <Descriptions.Item label="银行卡号">{employee.bankCardNumber || '-'}</Descriptions.Item>
            <Descriptions.Item label="开户银行">{employee.bankName || '-'}</Descriptions.Item>
            <Descriptions.Item label="生日">
              {employee.birthday ? dayjs(employee.birthday).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="实际生日">{employee.actualBirthday || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 简历文件 */}
        <Card title="简历文件">{renderResumeFiles(employee.resume)}</Card>

        {/* 系统信息 */}
        <Card title="系统信息">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="创建时间">
              {dayjs(employee.createdAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="更新时间">
              {dayjs(employee.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Space>

      {/* 图片预览模态框 */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        centered
        width={800}
        className="image-preview-modal"
      >
        <div className="flex justify-center">
          <Image
            alt={previewTitle}
            src={previewImage}
            style={{ maxWidth: '100%', maxHeight: '70vh' }}
            preview={false}
            fallback="/images/image-placeholder.svg"
            onError={() => {
              message.error('图片加载失败')
            }}
          />
        </div>
      </Modal>
    </div>
  )
}

export default EmployeeDetail
