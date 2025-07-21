import React from 'react'
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
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DownloadOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { useEmployeeDetail } from '../../hooks/useEmployee'
import type { Employee, ResumeFile } from '../../types/employee'

const { Title, Text } = Typography

const EmployeeDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  const { employee, isLoading, error } = useEmployeeDetail(id ? parseInt(id) : null)

  const handleBack = () => {
    navigate('/employees')
  }

  const handleEdit = () => {
    if (employee) {
      navigate(`/employees/edit/${employee.id}`)
    }
  }

  const handleDownloadResume = (file: ResumeFile) => {
    try {
      // 创建一个临时链接进行下载
      const link = document.createElement('a')
      link.href = file.fileUrl
      link.download = file.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      message.error('文件下载失败')
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

  const renderRoles = (roles?: string[]) => {
    if (!roles || roles.length === 0) return <Text type="secondary">无</Text>

    return (
      <Space wrap>
        {roles.map((role, index) => (
          <Tag key={index} color="blue">
            {role}
          </Tag>
        ))}
      </Space>
    )
  }

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
        renderItem={file => (
          <List.Item
            actions={[
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
              avatar={<FileTextOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
              title={file.fileName}
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
        )}
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
            <Descriptions.Item label="角色" span={2}>
              {renderRoles(employee.roles)}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 薪资信息 */}
        <Card title="薪资信息">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="基础工资">
              {renderSalary(employee.baseSalary)}
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
    </div>
  )
}

export default EmployeeDetail
