import React from 'react'
import { Card, Button, Space, Breadcrumb, Alert } from 'antd'
import { ArrowLeftOutlined, HomeOutlined, FileTextOutlined, EditOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'

const ContractDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  // 返回合同列表
  const handleBack = () => {
    navigate('/contracts')
  }

  // 编辑合同
  const handleEdit = () => {
    navigate(`/contracts/edit/${id}`)
  }

  return (
    <div className="p-4">
      {/* 面包屑导航 */}
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item>
          <HomeOutlined />
          <span className="ml-1">首页</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>
          <FileTextOutlined />
          <span className="ml-1">合同管理</span>
        </Breadcrumb.Item>
        <Breadcrumb.Item>合同详情</Breadcrumb.Item>
      </Breadcrumb>

      {/* 头部操作区域 */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回列表
            </Button>
            <h2 className="text-xl font-semibold m-0">合同详情</h2>
          </div>
          <Space>
            <Button icon={<EditOutlined />} onClick={handleEdit}>
              编辑合同
            </Button>
          </Space>
        </div>
      </div>

      {/* 合同详情内容 */}
      <Card
        title={`合同 #${id} 详情信息`}
        extra={
          <Alert
            message="合同详情功能正在开发中"
            type="info"
            showIcon
            className="inline-block"
          />
        }
      >
        <div className="min-h-96 flex items-center justify-center">
          <div className="text-center space-y-4">
            <FileTextOutlined className="text-6xl text-gray-300" />
            <div className="text-gray-500 space-y-2">
              <p className="text-lg">合同详情展示区域</p>
              <p className="text-sm">此区域将展示合同的详细信息</p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• 合同基本信息（编号、类型、状态等）</p>
                <p>• 合同双方信息（甲方、乙方详细信息）</p>
                <p>• 合同条款内容（服务内容、费用、期限等）</p>
                <p>• 操作记录（创建、修改、签署记录等）</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default ContractDetail 