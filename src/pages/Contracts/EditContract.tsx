import React from 'react'
import { Card, Button, Space, Breadcrumb, Alert } from 'antd'
import { ArrowLeftOutlined, HomeOutlined, FileTextOutlined, SaveOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'

const EditContract: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  // 返回合同列表
  const handleBack = () => {
    navigate('/contracts')
  }

  // 返回合同详情
  const handleBackToDetail = () => {
    navigate(`/contracts/detail/${id}`)
  }

  // 保存合同（暂时未实现）
  const handleSave = () => {
    // TODO: 实现保存合同逻辑
    console.log('保存合同', { id })
  }

  // 提交合同（暂时未实现）
  const handleSubmit = () => {
    // TODO: 实现提交合同逻辑
    console.log('提交合同', { id })
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
        <Breadcrumb.Item>编辑合同</Breadcrumb.Item>
      </Breadcrumb>

      {/* 头部操作区域 */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回列表
            </Button>
            <h2 className="text-xl font-semibold m-0">编辑合同</h2>
          </div>
          <Space>
            <Button onClick={handleBackToDetail}>查看详情</Button>
            <Button onClick={handleSave}>保存修改</Button>
            <Button type="primary" onClick={handleSubmit}>
              提交修改
            </Button>
          </Space>
        </div>
      </div>

      {/* 合同编辑内容 */}
      <Card
        title={`编辑合同 #${id}`}
        extra={
          <Alert
            message="合同编辑功能正在开发中"
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
              <p className="text-lg">合同编辑区域</p>
              <p className="text-sm">此区域将展示可编辑的合同表单</p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• 合同基本信息编辑（类型、状态等）</p>
                <p>• 合同双方信息编辑（甲方、乙方信息）</p>
                <p>• 合同条款内容编辑（服务内容、费用、期限等）</p>
                <p>• 支持表单验证和数据保存</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回列表
          </Button>
          <Space>
            <Button size="large" onClick={handleBackToDetail}>
              查看详情
            </Button>
            <Button size="large" icon={<SaveOutlined />} onClick={handleSave}>
              保存修改
            </Button>
            <Button type="primary" size="large" onClick={handleSubmit}>
              提交修改
            </Button>
          </Space>
        </div>
      </div>

      {/* 为底部固定栏预留空间 */}
      <div className="h-20"></div>
    </div>
  )
}

export default EditContract 