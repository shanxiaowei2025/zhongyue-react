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
  const [contractParams, setContractParams] = useState<{signatory?: string, contractType?: string}>({})
  const [savedContractData, setSavedContractData] = useState<any>({})
  const productServiceAgreementRef = useRef<ProductServiceAgreementRef>(null)
  const agencyAccountingAgreementRef = useRef<AgencyAccountingAgreementRef>(null)
  const singleServiceAgreementRef = useRef<SingleServiceAgreementRef>(null)

  const { createContractData } = useContractDetail()

  // 从 sessionStorage 获取保存的数据
  const getStorageKey = (type: 'params' | 'data') => {
    return type === 'params' ? 'contractCreateParams' : 'contractCreateData'
  }

  const loadFromStorage = () => {
    try {
      // 恢复合同参数
      const savedParams = sessionStorage.getItem(getStorageKey('params'))
      if (savedParams) {
        const params = JSON.parse(savedParams)
        if (params.signatory && params.contractType) {
          setContractParams(params)
          console.log('🔄 从 sessionStorage 恢复合同创建参数:', params)
          return true // 返回成功标志
        }
      }

      // 恢复表单数据
      const savedData = sessionStorage.getItem(getStorageKey('data'))
      if (savedData) {
        const data = JSON.parse(savedData)
        setSavedContractData(data)
        console.log('🔄 从 sessionStorage 恢复合同表单数据:', data)
      }
      return false // 没有找到参数
    } catch (error) {
      console.error('恢复 sessionStorage 数据失败:', error)
      return false
    }
  }

  // 强制恢复状态的函数
  const forceRecoverState = () => {
    const success = loadFromStorage()
    if (success) {
      console.log('✅ 强制恢复状态成功')
    } else {
      console.warn('⚠️ 无法恢复状态，sessionStorage 中可能没有有效数据')
    }
  }

  // 手动清理 sessionStorage 数据
  const clearStorageData = () => {
    try {
      sessionStorage.removeItem(getStorageKey('params'))
      sessionStorage.removeItem(getStorageKey('data'))
      setContractParams({})
      setSavedContractData({})
      console.log('🧹 手动清理：已清除所有 sessionStorage 数据')
      message.success('已清除保存的合同数据')
    } catch (error) {
      console.error('清理数据失败:', error)
      message.error('清理数据失败')
    }
  }

  const saveToStorage = (params?: any, data?: any) => {
    try {
      if (params) {
        sessionStorage.setItem(getStorageKey('params'), JSON.stringify(params))
      }
      if (data) {
        sessionStorage.setItem(getStorageKey('data'), JSON.stringify(data))
      }
    } catch (error) {
      console.error('保存到 sessionStorage 失败:', error)
    }
  }

  // 初始化合同参数，支持从多个来源获取
  useEffect(() => {
    // 优先使用 location.state
    if (state?.signatory && state?.contractType) {
      const params = {
        signatory: state.signatory,
        contractType: state.contractType
      }
      setContractParams(params)
      saveToStorage(params)
      console.log('💾 保存新的合同创建参数:', params)
      return
    }

    // 如果 location.state 不存在，尝试从 sessionStorage 恢复
    loadFromStorage()
  }, [state?.signatory, state?.contractType]) // 监听 state 变化

  // 监控 contractParams 状态，确保不会意外丢失
  useEffect(() => {
    // 如果 contractParams 为空但 sessionStorage 中有数据，主动恢复
    if ((!contractParams?.signatory || !contractParams?.contractType)) {
      const timer = setTimeout(() => {
        try {
          const savedParams = sessionStorage.getItem(getStorageKey('params'))
          if (savedParams) {
            const params = JSON.parse(savedParams)
            if (params.signatory && params.contractType) {
              console.log('🔄 检测到参数丢失，主动恢复:', params)
              setContractParams(params)
            }
          }
        } catch (error) {
          console.error('主动恢复参数失败:', error)
        }
      }, 100) // 短暂延迟确保组件稳定

      return () => clearTimeout(timer)
    }
  }, [contractParams?.signatory, contractParams?.contractType])
  
  // 定期检查并恢复状态（防止意外丢失）
  useEffect(() => {
    const intervalCheck = setInterval(() => {
      if (!contractParams?.signatory || !contractParams?.contractType) {
        try {
          const savedParams = sessionStorage.getItem(getStorageKey('params'))
          if (savedParams) {
            const params = JSON.parse(savedParams)
            if (params.signatory && params.contractType) {
              console.log('🔄 定期检查：恢复丢失的参数:', params)
              setContractParams(params)
            }
          }
        } catch (error) {
          console.error('定期检查恢复失败:', error)
        }
      }
    }, 5000) // 每5秒检查一次

    return () => clearInterval(intervalCheck)
  }, [])

  // 监听页面可见性变化，当页面重新可见时保存表单数据和恢复状态
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 页面隐藏时保存当前表单数据
        saveCurrentFormData()
      } else if (document.visibilityState === 'visible') {
        // 页面可见时检查并恢复状态
        if (!contractParams?.signatory || !contractParams?.contractType) {
          console.log('🔄 页面重新可见，检查并恢复状态')
          forceRecoverState()
        }
      }
    }

    const handleFocus = () => {
      // 窗口重新获得焦点时也尝试恢复状态
      if (!contractParams?.signatory || !contractParams?.contractType) {
        console.log('🔄 窗口重新聚焦，检查并恢复状态')
        setTimeout(() => forceRecoverState(), 100)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [contractParams])

  // 保存当前表单数据
  const saveCurrentFormData = () => {
    if (!contractParams?.contractType) return

    try {
      let currentData = {}
      
      // 根据合同类型获取当前表单数据
      if (contractParams.contractType === '产品服务协议' && productServiceAgreementRef.current) {
        currentData = productServiceAgreementRef.current.getFormData?.() || {}
      } else if (contractParams.contractType === '代理记账合同' && agencyAccountingAgreementRef.current) {
        currentData = agencyAccountingAgreementRef.current.getFormData?.() || {}
      } else if (contractParams.contractType === '单项服务合同' && singleServiceAgreementRef.current) {
        currentData = singleServiceAgreementRef.current.getFormData?.() || {}
      }

      if (Object.keys(currentData).length > 0) {
        saveToStorage(undefined, currentData)
        console.log('💾 自动保存表单数据:', currentData)
      }
    } catch (error) {
      console.error('保存表单数据失败:', error)
    }
  }

  // 组件卸载时的清理逻辑 - 只保存数据，不自动清理
  useEffect(() => {
    // 监听 beforeunload 事件，在页面真正关闭时保存数据
    const handleBeforeUnload = () => {
      saveCurrentFormData()
      // 在浏览器关闭/刷新时才清理数据
      sessionStorage.removeItem(getStorageKey('params'))
      sessionStorage.removeItem(getStorageKey('data'))
      console.log('🧹 页面关闭：清理 sessionStorage 数据')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      // 组件卸载时只保存数据，不清理参数
      saveCurrentFormData()
      console.log('💾 组件卸载：已保存表单数据，保留参数')
    }
  }, [])

  // 返回合同列表 - 保留数据，下次可以继续编辑
  const handleBack = () => {
    // 保存当前表单数据
    saveCurrentFormData()
    console.log('📝 返回列表：已保存当前数据，下次可继续编辑')
    navigate('/contracts')
  }

  // 处理合同提交 - 通过ref调用
  const handleContractSubmit = async () => {
    try {
      setIsSubmitting(true)

      if (contractParams?.contractType === '产品服务协议') {
        if (!productServiceAgreementRef.current) {
          message.error('合同组件未准备就绪')
          return
        }
        await productServiceAgreementRef.current.handleSubmit()
      } else if (contractParams?.contractType === '代理记账合同') {
        if (!agencyAccountingAgreementRef.current) {
          message.error('合同组件未准备就绪')
          return
        }
        await agencyAccountingAgreementRef.current.handleSubmit()
      } else if (contractParams?.contractType === '单项服务合同') {
        if (!singleServiceAgreementRef.current) {
          message.error('合同组件未准备就绪')
          return
        }
        await singleServiceAgreementRef.current.handleSubmit()
      } else {
        message.error('不支持的合同类型')
        return
      }

      // 提交成功后清理数据并返回合同列表
      clearStorageData()
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
    if (!contractParams?.contractType) {
      return (
        <div className="text-center py-8">
          <Alert 
            message="请选择合同类型" 
            description='请返回合同列表页面，通过"发起合同"按钮重新创建合同。'
            type="warning" 
            action={
              <Button size="small" onClick={handleBack}>
                返回合同列表
              </Button>
            }
          />
        </div>
      )
    }

    if (!contractParams?.signatory) {
      return (
        <div className="text-center py-8">
          <Alert 
            message="请选择签署方" 
            description='请返回合同列表页面，通过"发起合同"按钮重新创建合同。'
            type="warning" 
            action={
              <Button size="small" onClick={handleBack}>
                返回合同列表
              </Button>
            }
          />
        </div>
      )
    }

    switch (contractParams.contractType) {
      case '产品服务协议':
        return (
          <ProductServiceAgreement
            signatory={contractParams.signatory}
            contractData={{
              signatory: contractParams.signatory,
              contractType: contractParams.contractType,
              ...savedContractData
            }}
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
            signatory={contractParams.signatory}
            contractData={{
              signatory: contractParams.signatory,
              contractType: contractParams.contractType,
              ...savedContractData
            }}
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
            signatory={contractParams.signatory}
            contractData={{
              signatory: contractParams.signatory,
              contractType: contractParams.contractType,
              ...savedContractData
            }}
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
              description={`暂不支持 "${contractParams.contractType}" 类型的合同。`}
              type="error"
              showIcon
            />
          </div>
        )
    }
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
                !contractParams?.contractType ||
                (contractParams.contractType !== '产品服务协议' &&
                  contractParams.contractType !== '代理记账合同' &&
                  contractParams.contractType !== '单项服务合同')
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
            <span className="font-medium text-blue-600">
              {contractParams?.signatory || (
                <span 
                  className="text-orange-500 cursor-pointer"
                  onClick={() => {
                    console.log('🔄 手动触发状态恢复')
                    forceRecoverState()
                  }}
                  title="点击尝试恢复状态"
                >
                  未选择 (点击恢复)
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600 w-24">合同类型：</span>
            <span className="font-medium text-green-600">
              {contractParams?.contractType || (
                <span 
                  className="text-orange-500 cursor-pointer"
                  onClick={() => {
                    console.log('🔄 手动触发状态恢复')
                    forceRecoverState()
                  }}
                  title="点击尝试恢复状态"
                >
                  未选择 (点击恢复)
                </span>
              )}
            </span>
          </div>
          
          {/* 调试信息显示（开发环境下） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
              <div className="text-gray-600">调试信息:</div>
              <div>SessionStorage Params: {sessionStorage.getItem(getStorageKey('params')) ? '✅ 存在' : '❌ 不存在'}</div>
              <div>SessionStorage Data: {sessionStorage.getItem(getStorageKey('data')) ? '✅ 存在' : '❌ 不存在'}</div>
              <div>Current State: signatory={contractParams?.signatory || 'null'}, type={contractParams?.contractType || 'null'}</div>
              <div className="mt-1 space-x-2">
                <Button size="small" onClick={forceRecoverState}>
                  强制恢复状态
                </Button>
                <Button size="small" onClick={clearStorageData} danger>
                  清除保存数据
                </Button>
              </div>
            </div>
          )}
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
