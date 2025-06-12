import React, { useEffect, useState, useRef } from 'react'
import { Card, Button, Space, Breadcrumb, Divider, Alert, message } from 'antd'
import { ArrowLeftOutlined, HomeOutlined, FileTextOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useContractDetail } from '../../hooks/useContract'
import type { CreateContractDto } from '../../types/contract'
import ProductServiceAgreement, {
  type ProductServiceAgreementRef,
} from '../../components/contracts/ProductServiceAgreement'
import AgencyAccountingAgreement, {
  type AgencyAccountingAgreementRef,
} from '../../components/contracts/AgencyAccountingAgreement'
import SingleServiceAgreement, {
  type SingleServiceAgreementRef,
} from '../../components/contracts/SingleServiceAgreement'

interface LocationState {
  signatory: string
  contractType: string
}

const CreateContract: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState
  const [isSubmitting, setIsSubmitting] = useState(false)
  const productServiceAgreementRef = useRef<ProductServiceAgreementRef>(null)
  const agencyAccountingAgreementRef = useRef<AgencyAccountingAgreementRef>(null)
  const singleServiceAgreementRef = useRef<SingleServiceAgreementRef>(null)

  const { createContractData } = useContractDetail()

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

  // 处理合同提交 - 通过ref调用
  const handleContractSubmit = async () => {
    try {
      setIsSubmitting(true)

      if (state?.contractType === '产品服务协议') {
        if (!productServiceAgreementRef.current) {
          message.error('合同组件未准备就绪')
          return
        }
        await productServiceAgreementRef.current.handleSubmit()
      } else if (state?.contractType === '代理记账合同') {
        if (!agencyAccountingAgreementRef.current) {
          message.error('合同组件未准备就绪')
          return
        }
        await agencyAccountingAgreementRef.current.handleSubmit()
      } else if (state?.contractType === '单项服务合同') {
        if (!singleServiceAgreementRef.current) {
          message.error('合同组件未准备就绪')
          return
        }
        await singleServiceAgreementRef.current.handleSubmit()
      } else {
        message.error('不支持的合同类型')
        return
      }

      // 提交成功后返回合同列表
      setTimeout(() => {
        navigate('/contracts')
      }, 1500)
    } catch (error) {
      console.error('提交合同失败:', error)
      message.error('提交合同失败，请检查填写内容后重试')
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
      title: '创建合同',
    },
  ]

  // 渲染合同内容
  const renderContractContent = () => {
    if (!state?.contractType) {
      return (
        <div className="text-center py-8">
          <Alert message="未选择合同类型" type="warning" />
        </div>
      )
    }

    switch (state.contractType) {
      case '产品服务协议':
        return (
          <ProductServiceAgreement
            signatory={state.signatory}
            contractData={
              {
                // 这里可以传入已有的合同数据
              }
            }
            onSubmit={async contractData => {
              await createContractData(contractData)
            }}
            isSubmitting={isSubmitting}
            ref={productServiceAgreementRef}
          />
        )
      case '代理记账合同':
        return (
          <AgencyAccountingAgreement
            signatory={state.signatory}
            contractData={
              {
                // 这里可以传入已有的合同数据
              }
            }
            onSubmit={async contractData => {
              await createContractData(contractData)
            }}
            isSubmitting={isSubmitting}
            ref={agencyAccountingAgreementRef}
          />
        )
      case '单项服务合同':
        return (
          <SingleServiceAgreement
            signatory={state.signatory}
            contractData={
              {
                // 这里可以传入已有的合同数据
              }
            }
            onSubmit={async contractData => {
              await createContractData(contractData)
            }}
            isSubmitting={isSubmitting}
            ref={singleServiceAgreementRef}
          />
        )
      default:
        return (
          <div className="text-center py-8">
            <Alert
              message="不支持的合同类型"
              description={`暂不支持 "${state.contractType}" 类型的合同。`}
              type="error"
              showIcon
            />
          </div>
        )
    }
  }

  if (!state?.signatory || !state?.contractType) {
    return null // 会被重定向处理
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
            <h2 className="text-xl font-semibold m-0">创建合同</h2>
          </div>
          <Space>
            <Button
              type="primary"
              loading={isSubmitting}
              disabled={
                !state?.contractType ||
                (state.contractType !== '产品服务协议' &&
                  state.contractType !== '代理记账合同' &&
                  state.contractType !== '单项服务合同')
              }
              onClick={handleContractSubmit}
            >
              {isSubmitting ? '提交中...' : '提交合同'}
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
      <div
        className="contract-content-wrapper"
        style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}
      >
        {renderContractContent()}
      </div>
    </div>
  )
}

export default CreateContract
