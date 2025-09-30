import React, { useEffect, useState, useRef } from 'react'
import { Card, Button, Space, Breadcrumb, Divider, Alert } from 'antd'
import { showValidationError, showError, showSuccess } from '../../utils/messageHelper'
import { ArrowLeftOutlined, HomeOutlined, FileTextOutlined } from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useContractDetail } from '../../hooks/useContract'
import { useDebounce } from '../../hooks/useDebounce'
import { useContractFormStore } from '../../store/contractForm'
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

  // 使用重构后的store
  const {
    contractType,
    signatory,
    formData,
    setContractType,
    setSignatory,
    batchUpdateFormData,
    clearAllCache,
    lastUpdated,
  } = useContractFormStore()

  const productServiceAgreementRef = useRef<ProductServiceAgreementRef>(null)
  const agencyAccountingAgreementRef = useRef<AgencyAccountingAgreementRef>(null)
  const singleServiceAgreementRef = useRef<SingleServiceAgreementRef>(null)

  const { createContractData } = useContractDetail()

  // 保存当前表单数据到zustand存储
  const saveCurrentFormData = () => {
    if (!contractType) return

    try {
      let currentData: Record<string, any> = {}

      // 根据合同类型获取当前表单数据
      if (contractType === '产品服务协议' && productServiceAgreementRef.current) {
        currentData = productServiceAgreementRef.current.getFormData?.() || {}
      } else if (contractType === '代理记账合同' && agencyAccountingAgreementRef.current) {
        currentData = agencyAccountingAgreementRef.current.getFormData?.() || {}
      } else if (contractType === '单项服务合同' && singleServiceAgreementRef.current) {
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

        batchUpdateFormData(currentData)
        // 自动保存表单数据

        // 保存日期字段
      }
    } catch (error) {
      console.error('保存表单数据失败:', error)
    }
  }

  // 使用防抖的保存表单数据方法
  const debouncedSaveFormData = useDebounce(saveCurrentFormData, 500, [contractType])

  // 初始化合同参数，支持从多个来源获取
  useEffect(() => {
    // 优先使用 location.state
    if (state?.signatory && state?.contractType) {
      // 检查是否是不同的签署方或合同类型
      const isSignatoryChanged = signatory && signatory !== state.signatory
      const isContractTypeChanged = contractType && contractType !== state.contractType

      if (isSignatoryChanged || isContractTypeChanged) {
        // 检测到签署方或合同类型变化，清理旧缓存

        // 清理旧的表单数据
        clearAllCache()
      }

      setSignatory(state.signatory)
      setContractType(state.contractType)
      // 保存新的合同创建参数
      return
    }

    // 否则zustand中已有存储的数据会自动加载
    // 使用已存储的合同参数
  }, [
    state?.signatory,
    state?.contractType,
    setContractType,
    setSignatory,
    signatory,
    contractType,
    clearAllCache,
  ])

  // 组件卸载时的清理逻辑 - 只保存数据，不自动清理
  useEffect(() => {
    // 监听 beforeunload 事件，在页面真正关闭时保存数据
    const handleBeforeUnload = () => {
      saveCurrentFormData()
      // 浏览器关闭/刷新时清理数据
      clearAllCache()
      // 页面关闭：清理所有表单数据
    }

    // 监听标签页关闭事件
    const handleTabClose = (event: any) => {
      const { tabKey } = event.detail || {}
      // 如果关闭的是创建合同标签页，清理表单缓存
      if (tabKey === '/contracts/create') {
        // 创建合同标签页关闭，清理表单缓存
        clearAllCache()
      }
    }

    // 监听来自MainLayout的缓存清理事件
    const handleClearCacheEvent = (event: CustomEvent) => {
      const { tabKey } = event.detail || {}
      // 接收到清理缓存事件

      // 如果是针对当前页面的清理事件，执行清理
      if (tabKey === '/contracts/create') {
        // 响应清理缓存事件，清理表单数据
        clearAllCache()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('tabClose', handleTabClose)
    window.addEventListener('clearContractFormCache', handleClearCacheEvent as EventListener)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('tabClose', handleTabClose)
      window.removeEventListener('clearContractFormCache', handleClearCacheEvent as EventListener)
      // 组件卸载时只保存数据，不清理
      saveCurrentFormData()
      // 组件卸载：已保存表单数据，保留参数
    }
  }, [clearAllCache])

  // 返回合同列表 - 保留数据，下次可以继续编辑
  const handleBack = () => {
    // 保存当前表单数据
    saveCurrentFormData()
    // 返回列表：已保存当前数据，下次可继续编辑
    navigate('/contracts')
  }

  // 清除表单数据
  const clearStorageData = () => {
    try {
      clearAllCache()
      // 手动清理：已清除所有表单数据
      showSuccess.save()
    } catch (error) {
      console.error('清理数据失败:', error)
      showError.delete()
    }
  }

  // 处理合同提交 - 通过ref调用
  const handleContractSubmit = async () => {
    // 防止重复提交
    if (isSubmitting) {
      return
    }

    try {
      setIsSubmitting(true)
      // 开始提交合同

      if (contractType === '产品服务协议') {
        if (!productServiceAgreementRef.current) {
          showValidationError.contractComponentNotReady()
          return
        }
        await productServiceAgreementRef.current.handleSubmit()
      } else if (contractType === '代理记账合同') {
        if (!agencyAccountingAgreementRef.current) {
          showValidationError.contractComponentNotReady()
          return
        }
        await agencyAccountingAgreementRef.current.handleSubmit()
      } else if (contractType === '单项服务合同') {
        if (!singleServiceAgreementRef.current) {
          showValidationError.contractComponentNotReady()
          return
        }
        await singleServiceAgreementRef.current.handleSubmit()
      } else {
        showValidationError.invalidContractType()
        return
      }

      // 提交成功后清理数据，关闭标签页并返回合同列表
      clearAllCache()
      // 成功消息由 useContract 统一处理，避免重复显示

      setTimeout(() => {
        // 先跳转到合同列表页，确保标签页存在
        navigate('/contracts')

        // 延迟关闭创建合同标签页，确保跳转完成
        setTimeout(() => {
          if (window.closeTab) {
            const success = window.closeTab('/contracts/create')
            if (success) {
              // 创建合同标签页已关闭，已返回合同列表
            } else {
              console.warn('⚠️ 创建合同标签页关闭失败')
            }
          }
        }, 200)
      }, 800)
    } catch (error) {
      console.error('提交合同失败:', error)
      showError.create()
    } finally {
      setIsSubmitting(false)
      // 合同提交结束
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
    if (!contractType || !signatory) return

    // 监听整个文档的变更事件，通过事件委托来捕获表单变化
    const handleFormChange = () => {
      // 使用防抖保存表单数据
      debouncedSaveFormData()
    }

    // 监听数据恢复事件，用于触发额外的恢复操作
    const handleDataRestored = () => {
      // 监听到表单数据恢复事件

      // 如果需要，可以在这里添加额外的恢复操作
      // 对于产品服务协议，强制同步客户信息
      if (
        contractType === '产品服务协议' &&
        productServiceAgreementRef.current &&
        formData.partyACompany
      ) {
        const syncEvent = new CustomEvent('syncCustomerData', {
          detail: {
            customerName: formData.partyACompany,
          },
        })
        document.dispatchEvent(syncEvent)
      }
    }

    // 监听 input, select, textarea 元素的 change 事件
    document.addEventListener('change', handleFormChange)
    document.addEventListener('input', handleFormChange)
    document.addEventListener('formDataRestored', handleDataRestored)

    // 监听合同组件的自定义表单变化事件（特别针对DatePicker等Antd组件）
    const handleContractFormFieldChange = () => {
      // 收到合同字段变化事件
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
  }, [contractType, signatory, debouncedSaveFormData, formData])

  const renderContractContent = () => {
    if (!contractType) {
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

    if (!signatory) {
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

    switch (contractType) {
      case '产品服务协议':
        return (
          <ProductServiceAgreement
            signatory={signatory || ''}
            contractData={
              {
                signatory: signatory as string,
                contractType: contractType as string,
                ...formData,
              } as any
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
            signatory={signatory || ''}
            contractData={
              {
                signatory: signatory as string,
                contractType: contractType as string,
                ...formData,
              } as any
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
            signatory={signatory || ''}
            contractData={
              {
                signatory: signatory as string,
                contractType: contractType as string,
                ...formData,
              } as any
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
              description={`暂不支持 "${contractType}" 类型的合同。`}
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
                  !contractType ||
                  (contractType !== '产品服务协议' &&
                    contractType !== '代理记账合同' &&
                    contractType !== '单项服务合同')
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
              {signatory || (
                <span className="text-orange-500" title="未选择签署方">
                  未选择
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-600 w-24">合同类型：</span>
            <span className="font-medium text-green-600">
              {contractType || (
                <span className="text-orange-500" title="未选择合同类型">
                  未选择
                </span>
              )}
            </span>
          </div>

          {/* 调试信息显示（开发环境下） */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
              <div className="text-gray-600">调试信息:</div>
              <div>Zustand 存储: {lastUpdated ? '✅ 存在' : '❌ 不存在'}</div>
              <div>
                Current State: signatory={signatory || 'null'}, type={contractType || 'null'}
              </div>
              <div>
                Saved Data Keys:{' '}
                {formData && Object.keys(formData).length > 0
                  ? Object.keys(formData).join(', ')
                  : '无'}
              </div>
              {formData && formData.partyASignDate && (
                <div>甲方签署日期: {formData.partyASignDate}</div>
              )}
              {formData && formData.partyBSignDate && (
                <div>乙方签署日期: {formData.partyBSignDate}</div>
              )}
              <div className="mt-1 space-x-2">
                <Button size="small" onClick={saveCurrentFormData} type="primary">
                  立即保存表单
                </Button>
                <Button size="small" onClick={clearStorageData} danger>
                  清除保存数据
                </Button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                上次保存时间:{' '}
                {lastUpdated ? new Date(lastUpdated).toLocaleTimeString('zh-CN') : '未保存'}
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
