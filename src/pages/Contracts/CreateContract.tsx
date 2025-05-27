import React, { useEffect } from 'react'
import { Card, Button, Space, Breadcrumb, Divider, Alert } from 'antd'
import { ArrowLeftOutlined, HomeOutlined, FileTextOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

interface LocationState {
  signatory: string
  contractType: string
}

const CreateContract: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState

  // 如果没有传递必要的状态信息，返回到合同列表
  useEffect(() => {
    if (!state?.signatory || !state?.contractType) {
      navigate('/contracts', { replace: true })
    }
  }, [state, navigate])

  // 返回合同列表
  const handleBack = () => {
    navigate('/contracts')
  }

  // 保存合同（暂时未实现）
  const handleSave = () => {
    // TODO: 实现保存合同逻辑
    console.log('保存合同', {
      signatory: state.signatory,
      contractType: state.contractType,
    })
  }

  // 提交合同（暂时未实现）
  const handleSubmit = () => {
    // TODO: 实现提交合同逻辑
    console.log('提交合同', {
      signatory: state.signatory,
      contractType: state.contractType,
    })
  }

  if (!state?.signatory || !state?.contractType) {
    return null // 会被重定向处理
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
        <Breadcrumb.Item>创建合同</Breadcrumb.Item>
      </Breadcrumb>

      {/* 头部操作区域 */}
      <div className="mb-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              返回列表
            </Button>
            <h2 className="text-xl font-semibold m-0">创建合同</h2>
          </div>
          <Space>
            <Button onClick={handleSave}>保存草稿</Button>
            <Button type="primary" onClick={handleSubmit}>
              提交合同
            </Button>
          </Space>
        </div>
      </div>

      {/* 合同基本信息 */}
      <Card className="mb-4">
        <div className="space-y-3">
          <div className="flex items-center">
            <span className="text-gray-600 w-24">签署方：</span>
            <span className="font-medium text-blue-600">{state.signatory}</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600 w-24">合同类型：</span>
            <span className="font-medium text-green-600">{state.contractType}</span>
          </div>
        </div>
      </Card>

      <Divider />

      {/* 合同内容区域 */}
      <Card
        title={`${state.contractType} - 合同内容`}
        className="mb-4"
        extra={
          <Alert
            message="合同内容编辑功能正在开发中"
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
              <p className="text-lg">合同内容填写区域</p>
              <p className="text-sm">此区域将根据选择的合同类型展示相应的表单内容</p>
              <div className="text-xs text-gray-400 space-y-1">
                <p>• 产品服务协议：包含服务内容、服务期限、费用等信息</p>
                <p>• 代理记账合同：包含记账服务范围、服务标准、收费标准等</p>
                <p>• 单项服务合同：包含具体服务事项、完成时间、服务费用等</p>
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
            <Button size="large" onClick={handleSave}>
              保存草稿
            </Button>
            <Button type="primary" size="large" onClick={handleSubmit}>
              提交合同
            </Button>
          </Space>
        </div>
      </div>

      {/* 为底部固定栏预留空间 */}
      <div className="h-20"></div>
    </div>
  )
}

export default CreateContract 