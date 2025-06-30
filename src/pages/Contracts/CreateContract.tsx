import React, { useEffect, useState, useRef } from 'react'
import { Card, Button, Space, Breadcrumb, Divider, Alert, message } from 'antd'
import { ArrowLeftOutlined, HomeOutlined, FileTextOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useContractDetail } from '../../hooks/useContract'
import { useDebounce } from '../../hooks/useDebounce'
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

// 声明全局Window接口扩展
declare global {
  interface Window {
    closeTab?: (tabKey: string) => boolean
  }
}

interface LocationState {
  signatory: string
  contractType: string
}

const CreateContract: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingInProgress, setIsSubmittingInProgress] = useState(false) // 新增：标记提交进行中
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
      let paramsLoaded = false;
      if (savedParams) {
        const params = JSON.parse(savedParams)
        if (params.signatory && params.contractType) {
          setContractParams(params)
          console.log('🔄 从 sessionStorage 恢复合同创建参数:', params)
          paramsLoaded = true;
        }
      }

      // 恢复表单数据
      const savedData = sessionStorage.getItem(getStorageKey('data'))
      if (savedData) {
        const data = JSON.parse(savedData)
        if (Object.keys(data).length > 0) {
          // 强制设置甲方公司名称等关键字段，确保它们在UI中正确显示
          if (data.partyACompany) {
            console.log('🎯 恢复关键字段：甲方公司名', data.partyACompany)
          }
          if (data.partyASignDate) {
            console.log('🎯 恢复关键字段：甲方签署日期', data.partyASignDate)
          }
          if (data.partyBSignDate) {
            console.log('🎯 恢复关键字段：乙方签署日期', data.partyBSignDate)
          }
          setSavedContractData(data)
          console.log('🔄 从 sessionStorage 恢复合同表单数据:', data)
          
          // 创建一个假的事件来触发数据保存和恢复机制
          setTimeout(() => {
            const event = new Event('formDataRestored', { bubbles: true })
            document.dispatchEvent(event)
          }, 200);
        }
      }
      return paramsLoaded // 返回参数恢复状态
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
        // 记录保存时间
        const now = new Date()
        const formattedTime = now.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
        sessionStorage.setItem('lastFormSaveTime', formattedTime)
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
      // 如果正在提交，跳过恢复逻辑
      if (isSubmittingInProgress) {
        console.log('⏸️ 提交进行中，跳过定期检查恢复')
        return
      }

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
      } else {
        // 参数正常，检查表单数据是否完整恢复
        try {
          const savedData = sessionStorage.getItem(getStorageKey('data'))
          if (savedData && Object.keys(savedContractData).length === 0) {
            const data = JSON.parse(savedData)
            if (Object.keys(data).length > 0) {
              console.log('🔄 定期检查：恢复丢失的表单数据')
              setSavedContractData(data)
              
              // 特别关注日期字段的恢复
              if (data.partyASignDate || data.partyBSignDate) {
                console.log('🕒 定期检查：发现并恢复日期字段')
                console.log('  甲方签署日期:', data.partyASignDate)
                console.log('  乙方签署日期:', data.partyBSignDate)
              }
            }
          }
        } catch (error) {
          console.error('表单数据恢复失败:', error)
        }
      }
    }, 5000) // 每5秒检查一次

    return () => clearInterval(intervalCheck)
  }, [contractParams?.signatory, contractParams?.contractType, savedContractData, isSubmittingInProgress])

  // 监听页面可见性变化，当页面重新可见时保存表单数据和恢复状态
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 页面隐藏时立即保存当前表单数据（不使用防抖）
        if (!isSubmittingInProgress) {
          saveCurrentFormData()
        }
      } else if (document.visibilityState === 'visible') {
        // 如果正在提交，跳过恢复逻辑
        if (isSubmittingInProgress) {
          console.log('⏸️ 提交进行中，跳过页面可见性恢复')
          return
        }
        // 页面可见时检查并恢复状态
        if (!contractParams?.signatory || !contractParams?.contractType) {
          console.log('🔄 页面重新可见，检查并恢复状态')
          forceRecoverState()
        }
      }
    }

    const handleFocus = () => {
      // 如果正在提交，跳过恢复逻辑
      if (isSubmittingInProgress) {
        console.log('⏸️ 提交进行中，跳过窗口聚焦恢复')
        return
      }

      // 窗口重新获得焦点时也尝试恢复状态
      if (!contractParams?.signatory || !contractParams?.contractType) {
        console.log('🔄 窗口重新聚焦，检查并恢复状态')
        setTimeout(() => forceRecoverState(), 100)
      } else {
        // 有参数时，确保表单内容也被恢复
        const savedData = sessionStorage.getItem(getStorageKey('data'))
        if (savedData) {
          try {
            const data = JSON.parse(savedData)
            setSavedContractData(data)
            console.log('🔄 窗口聚焦时恢复表单数据')
            
            // 日期字段特殊处理日志
            if (data.partyASignDate || data.partyBSignDate) {
              console.log('🕒 窗口聚焦：恢复日期字段')
              console.log('  甲方签署日期:', data.partyASignDate)
              console.log('  乙方签署日期:', data.partyBSignDate)
            }
          } catch (error) {
            console.error('恢复表单数据失败:', error)
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [contractParams, isSubmittingInProgress])

  // 保存当前表单数据
  const saveCurrentFormData = () => {
    if (!contractParams?.contractType) return

    try {
      let currentData: Record<string, any> = {}
      
      // 根据合同类型获取当前表单数据
      if (contractParams.contractType === '产品服务协议' && productServiceAgreementRef.current) {
        currentData = productServiceAgreementRef.current.getFormData?.() || {}
      } else if (contractParams.contractType === '代理记账合同' && agencyAccountingAgreementRef.current) {
        currentData = agencyAccountingAgreementRef.current.getFormData?.() || {}
      } else if (contractParams.contractType === '单项服务合同' && singleServiceAgreementRef.current) {
        currentData = singleServiceAgreementRef.current.getFormData?.() || {}
      }

      if (Object.keys(currentData).length > 0) {
        // 确保重要字段不会为undefined
        currentData = {
          ...currentData,
          partyACompany: currentData.partyACompany || currentData.customerSearchValue || '',
          partyAAddress: currentData.partyAAddress || '',
          partyAContact: currentData.partyAContact || '',
          partyAPhone: currentData.partyAPhone || '',
          partyBContact: currentData.partyBContact || '',
          partyBPhone: currentData.partyBPhone || '',
        }

        saveToStorage(undefined, currentData)
        console.log('💾 自动保存表单数据:', currentData)
        
        // 特别监控日期字段的保存
        if (currentData.partyASignDate) {
          console.log('📅 保存甲方签署日期:', currentData.partyASignDate)
        }
        if (currentData.partyBSignDate) {
          console.log('📅 保存乙方签署日期:', currentData.partyBSignDate)
        }
      }
    } catch (error) {
      console.error('保存表单数据失败:', error)
    }
  }
  
  // 使用防抖的保存表单数据方法
  const debouncedSaveFormData = useDebounce(saveCurrentFormData, 500, [contractParams?.contractType])

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
      setIsSubmittingInProgress(true) // 标记提交进行中，暂停所有自动恢复逻辑
      console.log('🚀 开始提交合同，暂停自动恢复逻辑')

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

      // 提交成功后清理数据，关闭标签页并返回合同列表
      clearStorageData()
      message.success('合同创建成功！', 2)
      
      setTimeout(() => {
        // 先跳转到合同列表页，确保标签页存在
        navigate('/contracts')
        
        // 延迟关闭创建合同标签页，确保跳转完成
        setTimeout(() => {
          if (window.closeTab) {
            const success = window.closeTab('/contracts/create')
            if (success) {
              console.log('✅ 创建合同标签页已关闭，已返回合同列表')
            } else {
              console.warn('⚠️ 创建合同标签页关闭失败')
            }
          }
        }, 200)
      }, 800)
    } catch (error) {
      console.error('提交合同失败:', error)
      message.error('提交合同失败，请检查填写内容后重试')
    } finally {
      setIsSubmitting(false)
      setIsSubmittingInProgress(false) // 提交结束，恢复自动恢复逻辑
      console.log('🔚 合同提交结束，恢复自动恢复逻辑')
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
  // 监听合同表单的更改事件，通过事件委托来捕获
  useEffect(() => {
    // 只有在有合同类型和签署方时才监听
    if (!contractParams?.contractType || !contractParams?.signatory) return
    
    // 监听整个文档的变更事件，通过事件委托来捕获表单变化
    const handleFormChange = () => {
      // 使用防抖保存表单数据
      debouncedSaveFormData()
    }
    
    // 监听数据恢复事件，用于触发额外的恢复操作
    const handleDataRestored = () => {
      console.log('📣 监听到表单数据恢复事件，触发额外恢复操作')
      
      // 如果需要，可以在这里添加额外的恢复操作
      // 例如，强制更新某些特定表单字段或触发其他操作
      
      // 对于产品服务协议，强制同步客户信息
      if (contractParams.contractType === '产品服务协议' && 
          productServiceAgreementRef.current && 
          savedContractData.partyACompany) {
        const syncEvent = new CustomEvent('syncCustomerData', {
          detail: {
            customerName: savedContractData.partyACompany,
          }
        })
        document.dispatchEvent(syncEvent)
      }
    }

    // 监听 input, select, textarea 元素的 change 事件
    document.addEventListener('change', handleFormChange)
    document.addEventListener('input', handleFormChange)
    document.addEventListener('formDataRestored', handleDataRestored)
    
    // 监听合同组件的自定义表单变化事件（特别针对DatePicker等Antd组件）
    const handleContractFormFieldChange = (event: any) => {
      const { field, value, contractType } = event.detail || {}
      console.log(`📅 [CreateContract] 收到合同字段变化事件: ${field}=${value} (${contractType})`)
      // 触发自动保存
      debouncedSaveFormData()
    }
    document.addEventListener('contractFormFieldChange', handleContractFormFieldChange)
    
    // 强制初始恢复
    setTimeout(() => {
      const event = new Event('formDataRestored', { bubbles: true })
      document.dispatchEvent(event)
    }, 500)
    
    // 定期自动保存表单（备份方案）
    const autoSaveInterval = setInterval(() => {
      saveCurrentFormData()
    }, 60000) // 每1分钟自动保存一次
    
    return () => {
      document.removeEventListener('change', handleFormChange)
      document.removeEventListener('input', handleFormChange)
      document.removeEventListener('formDataRestored', handleDataRestored)
      document.removeEventListener('contractFormFieldChange', handleContractFormFieldChange)
      clearInterval(autoSaveInterval)
    }
  }, [contractParams?.contractType, contractParams?.signatory, debouncedSaveFormData, savedContractData])

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

      {/* 头部操作区域 - 添加 sticky 吸附效果 */}
      <div className="mb-4 sticky -top-6 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="py-3 px-4 -mx-4">
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
              <div>Saved Data Keys: {Object.keys(savedContractData).length > 0 ? Object.keys(savedContractData).join(', ') : '无'}</div>
              {savedContractData.partyASignDate && (
                <div>甲方签署日期: {savedContractData.partyASignDate}</div>
              )}
              {savedContractData.partyBSignDate && (
                <div>乙方签署日期: {savedContractData.partyBSignDate}</div>
              )}
              <div className="mt-1 space-x-2">
                <Button size="small" onClick={forceRecoverState}>
                  强制恢复状态
                </Button>
                <Button size="small" onClick={saveCurrentFormData} type="primary">
                  立即保存表单
                </Button>
                <Button size="small" onClick={clearStorageData} danger>
                  清除保存数据
                </Button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                上次保存时间: {sessionStorage.getItem('lastFormSaveTime') || '未保存'}
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
