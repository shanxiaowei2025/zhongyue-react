import React, { useState, useRef, useEffect } from 'react'
import { Modal, Button, Spin, message, Space, Input } from 'antd'
import html2canvas from 'html2canvas'
import { useContractDetail } from '../../hooks/useContract'
import { updateContract, generateContractToken } from '../../api/contract'
import { uploadFile } from '../../api/upload'
import ProductServiceAgreementView from './ProductServiceAgreementView'
import AgencyAccountingAgreementView from './AgencyAccountingAgreementView'
import SingleServiceAgreementView from './SingleServiceAgreementView'

interface ContractPreviewModalProps {
  visible: boolean
  contractId: number
  onClose: () => void
}

const ContractPreviewModal: React.FC<ContractPreviewModalProps> = ({
  visible,
  contractId,
  onClose,
}) => {
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [signUrl, setSignUrl] = useState<string>('')
  const contractContentRef = useRef<HTMLDivElement>(null)
  
  // 获取合同详情
  const { data: contractData, isLoading, error } = useContractDetail(contractId)

  // 关闭时重置状态
  useEffect(() => {
    if (!visible) {
      setSignUrl('')
    }
  }, [visible])

  // 生成并保存合同图片，然后创建签署链接
  const handleGenerateSignLink = async () => {
    if (!contractContentRef.current || !contractData) {
      message.error('无法获取合同内容，请稍后重试')
      return
    }

    setGenerating(true)

    try {
      // 准备html2canvas配置
      const contentElement = contractContentRef.current
      
      // 1. 使用html2canvas生成合同图片
      const canvas = await html2canvas(contentElement, {
        backgroundColor: '#ffffff',
        scale: 2, // 提高清晰度
        useCORS: true,
        allowTaint: true,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        width: contentElement.scrollWidth,
        height: contentElement.scrollHeight,
        windowWidth: contentElement.scrollWidth,
        windowHeight: contentElement.scrollHeight,
        // 关键：捕获完整内容
        onclone: clonedDoc => {
          // 获取克隆的内容元素
          const clonedElement = clonedDoc.querySelector('.contract-preview-content') as HTMLElement
          if (clonedElement) {
            // 设置样式确保全部内容可见
            clonedElement.style.overflow = 'visible'
            clonedElement.style.width = '210mm'
            clonedElement.style.minWidth = '210mm'
            clonedElement.style.height = 'auto'
            clonedElement.style.minHeight = contentElement.scrollHeight + 'px'
            clonedElement.style.padding = '0'
            clonedElement.style.margin = '0 auto'
            clonedElement.style.background = '#ffffff'
            clonedElement.style.boxShadow = 'none'
            clonedElement.style.borderRadius = '0'
            
            // 处理所有子元素，确保没有溢出隐藏
            const allElements = clonedElement.querySelectorAll('*')
            allElements.forEach(el => {
              if (el instanceof HTMLElement) {
                // 保留原始margin和padding，不要覆盖为0
                el.style.overflow = 'visible'
              }
            })
            
            // 特别处理协议组件
            const agreementElement = clonedElement.querySelector('.product-service-agreement') as HTMLElement
            if (agreementElement) {
              agreementElement.style.margin = '0 auto'
              agreementElement.style.display = 'block'
              agreementElement.style.pageBreakInside = 'avoid'
            }
            
            // 特别处理代理记账合同组件
            const accountingElement = clonedElement.querySelector('.agency-accounting-agreement-view') as HTMLElement
            if (accountingElement) {
              accountingElement.style.margin = '0 auto'
              accountingElement.style.display = 'block'
              accountingElement.style.pageBreakInside = 'avoid'
            }
            
            // 特别处理单项服务合同组件
            const serviceElement = clonedElement.querySelector('.single-service-agreement-view') as HTMLElement
            if (serviceElement) {
              serviceElement.style.margin = '0 auto'
              serviceElement.style.display = 'block'
              serviceElement.style.pageBreakInside = 'avoid'
            }
          }
        },
      })

      // 2. 将canvas转为blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('生成图片失败'))
          }
        }, 'image/png', 0.95) // 增加质量参数
      })

      // 3. 创建File对象
      const fileName = `contract_${contractData.id}_${new Date().getTime()}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      // 4. 上传到服务器
      const uploadResponse = await uploadFile(file, 'contracts')
      const imageUrl = uploadResponse.data.url

      // 5. 检查并设置合同签署日期
      const currentDate = new Date().toISOString().split('T')[0] // 当前日期，格式为 YYYY-MM-DD
      const updateData: any = { contractImage: imageUrl }
      
      // 如果甲方签署日期为空，设置为当前日期
      if (!contractData.partyASignDate) {
        updateData.partyASignDate = currentDate
        console.log('设置甲方签署日期为当前日期:', currentDate)
      }
      
      // 如果乙方签署日期为空，设置为当前日期
      if (!contractData.partyBSignDate) {
        updateData.partyBSignDate = currentDate
        console.log('设置乙方签署日期为当前日期:', currentDate)
      }
      
      // 更新合同信息
      await updateContract(contractId, updateData)

      // 6. 生成签署链接
      const tokenResponse = await generateContractToken(contractId) as any
      const { token } = tokenResponse.data
      
      // 7. 生成签署页面链接
      const url = `${window.location.origin}/contract-sign/${token}`
      setSignUrl(url)

      message.success('签署链接生成成功')
    } catch (error) {
      console.error('生成签署链接失败:', error)
      message.error('生成签署链接失败，请重试')
    } finally {
      setGenerating(false)
    }
  }

  // 复制链接到剪贴板
  const handleCopyLink = () => {
    navigator.clipboard.writeText(signUrl)
      .then(() => message.success('链接已复制到剪贴板'))
      .catch(() => message.error('复制失败，请手动复制'))
  }

  // 渲染合同内容
  const renderContractContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">正在加载合同详情...</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500">加载合同详情失败，请重试</p>
        </div>
      )
    }

    if (!contractData) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">合同数据不存在</p>
        </div>
      )
    }

    // 根据合同类型渲染不同组件
    switch (contractData.contractType) {
      case '产品服务协议':
        return <ProductServiceAgreementView contractData={contractData} />
      case '代理记账合同':
        return <AgencyAccountingAgreementView contractData={contractData} />
      case '单项服务合同':
        return <SingleServiceAgreementView contractData={contractData} />
      default:
        return (
          <div className="text-center py-8">
            <p className="text-red-500">不支持的合同类型: {contractData.contractType}</p>
          </div>
        )
    }
  }

  return (
    <Modal
      title="生成合同签署链接"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      centered
      maskClosable={false}
      bodyStyle={{ maxHeight: '80vh', overflowY: 'auto', padding: '20px' }}
    >
      {/* 合同预览和操作区域 */}
      <div className="flex flex-col gap-4">
        {!signUrl ? (
          <>
            {/* 合同预览 */}
            <div 
              className="contract-preview-wrapper mb-4" 
              style={{ 
                width: '100%',
                overflowX: 'auto',
                padding: '10px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px'
              }}
            >
              <div 
                className="contract-preview-content"
                style={{
                  width: '210mm',
                  minWidth: '210mm',
                  background: '#ffffff',
                  padding: '0',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  margin: '0 auto',
                  overflow: 'visible',
                  height: 'auto'
                }}
                ref={contractContentRef}
              >
                {renderContractContent()}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-center">
              <Button 
                type="primary"
                size="large"
                loading={generating}
                onClick={handleGenerateSignLink}
              >
                {generating ? '正在生成签署链接...' : '确认生成签署链接'}
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* 签署链接区域 */}
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                合同：{contractData?.contractNumber || `#${contractId}`}
              </p>
              <p className="text-gray-600 mb-4">
                请将以下链接发送给甲方进行签署（链接30分钟内有效）：
              </p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded border">
              <Input.TextArea
                value={signUrl}
                readOnly
                rows={3}
                style={{ fontSize: '12px' }}
              />
            </div>
            
            <div className="mt-4 flex justify-center space-x-4">
              <Button onClick={onClose}>
                关闭
              </Button>
              <Button type="primary" onClick={handleCopyLink}>
                复制链接
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default ContractPreviewModal 