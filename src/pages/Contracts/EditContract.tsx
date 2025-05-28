import React, { useEffect, useState, useRef } from 'react'
import { Card, Button, Space, Breadcrumb, Divider, Alert, message, Spin } from 'antd'
import { ArrowLeftOutlined, HomeOutlined, FileTextOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { useContractDetail } from '../../hooks/useContract'
import type { CreateContractDto } from '../../types/contract'
import ProductServiceAgreement, { type ProductServiceAgreementRef } from '../../components/contracts/ProductServiceAgreement'

const EditContract: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const contractId = parseInt(id || '0', 10)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const contractRef = useRef<ProductServiceAgreementRef>(null)
  
  // 获取合同详情数据
  const { data: contractData, isLoading, error, updateContractData } = useContractDetail(contractId)

  // 检查合同ID有效性
  useEffect(() => {
    if (!id || isNaN(contractId)) {
      message.error('无效的合同ID')
      navigate('/contracts', { replace: true })
    }
  }, [id, contractId, navigate])

  // 返回合同列表
  const handleBack = () => {
    navigate('/contracts')
  }

  // 返回合同详情
  const handleBackToDetail = () => {
    navigate(`/contracts/detail/${id}`)
  }

  // 处理合同更新 - 通过ref调用
  const handleContractUpdate = async () => {
    if (!contractRef.current) {
      message.error('合同组件未准备就绪')
      return
    }
    
    if (!contractId) {
      message.error('合同ID无效')
      return
    }
    
    try {
      setIsSubmitting(true)
      await contractRef.current.handleSubmit()
      message.success('合同更新成功！')
      // 更新成功后返回合同详情
      setTimeout(() => {
        navigate(`/contracts/detail/${id}`)
      }, 1500)
    } catch (error) {
      console.error('更新合同失败:', error)
      message.error('更新合同失败，请检查填写内容后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 面包屑导航配置
  const breadcrumbItems = [
    {
      title: (
        <span>
          <HomeOutlined />
          <span className="ml-1">首页</span>
        </span>
      ),
    },
    {
      title: (
        <span>
          <FileTextOutlined />
          <span className="ml-1">合同管理</span>
        </span>
      ),
    },
    {
      title: '编辑合同',
    },
  ]

  // 渲染合同内容
  const renderContractContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">正在加载合同数据...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <Alert
            message="加载合同数据失败"
            description="请检查网络连接或联系系统管理员"
            type="error"
            showIcon
          />
        </div>
      )
    }

    if (!contractData) {
      return (
        <div className="text-center py-8">
          <Alert message="合同数据不存在" type="warning" showIcon />
        </div>
      )
    }

    // 根据合同类型渲染不同组件
    switch (contractData.contractType) {
      case '产品服务协议':
        return (
          <ProductServiceAgreement
            signatory={contractData.signatory || ''}
            contractData={contractData}
            mode="edit"
            onUpdate={async (updateData) => {
              await updateContractData(contractId, updateData)
            }}
            isSubmitting={isSubmitting}
            ref={contractRef}
          />
        )
      case '代理记账合同':
        return (
          <div className="text-center py-8">
            <Alert
              message="代理记账合同编辑功能开发中"
              description="该合同类型的编辑功能正在开发中，敬请期待。"
              type="info"
              showIcon
            />
          </div>
        )
      case '单项服务合同':
        return (
          <div className="text-center py-8">
            <Alert
              message="单项服务合同编辑功能开发中"
              description="该合同类型的编辑功能正在开发中，敬请期待。"
              type="info"
              showIcon
            />
          </div>
        )
      default:
        return (
          <div className="text-center py-8">
            <Alert
              message="不支持的合同类型"
              description={`暂不支持编辑 "${contractData.contractType}" 类型的合同。`}
              type="error"
              showIcon
            />
          </div>
        )
    }
  }

  // 如果合同ID无效，不渲染内容
  if (!id || isNaN(contractId)) {
    return null
  }

  return (
    <div className="p-4">
      {/* 面包屑导航 */}
      <Breadcrumb className="mb-4" items={breadcrumbItems} />

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
            <Button onClick={handleBackToDetail} disabled={isSubmitting}>
              查看详情
            </Button>
            <Button 
              type="primary" 
              loading={isSubmitting}
              disabled={!contractData || contractData.contractType !== '产品服务协议'}
              onClick={handleContractUpdate}
            >
              {isSubmitting ? '更新中...' : '保存修改'}
            </Button>
          </Space>
        </div>
      </div>

      {/* 合同基本信息 */}
      {contractData && (
        <Card className="mb-4">
          <div className="space-y-3">
            <div className="flex items-center">
              <span className="text-gray-600 w-24">合同编号：</span>
              <span className="font-medium text-blue-600">{contractData.contractNumber || '未生成'}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 w-24">签署方：</span>
              <span className="font-medium text-blue-600">{contractData.signatory}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 w-24">合同类型：</span>
              <span className="font-medium text-green-600">{contractData.contractType}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 w-24">合同状态：</span>
              <span className={`font-medium ${
                contractData.contractStatus === '1' ? 'text-green-600' : 
                contractData.contractStatus === '2' ? 'text-red-600' : 'text-orange-600'
              }`}>
                {contractData.contractStatus === '1' ? '已签署' :
                 contractData.contractStatus === '2' ? '已终止' : '未签署'}
              </span>
            </div>
          </div>
        </Card>
      )}

      <Divider />

      {/* 合同内容区域 */}
      <div className="contract-content-wrapper" style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        {renderContractContent()}
      </div>
    </div>
  )
}

export default EditContract 