import React, { useEffect, useState, useRef } from 'react'
import { Card, Button, Space, Breadcrumb, Alert, Spin, Divider, Typography, message } from 'antd'
import {
  ArrowLeftOutlined,
  HomeOutlined,
  FileTextOutlined,
  EditOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { useContractDetail } from '../../hooks/useContract'
import ProductServiceAgreementView from '../../components/contracts/ProductServiceAgreementView'
import AgencyAccountingAgreementView from '../../components/contracts/AgencyAccountingAgreementView'
import SingleServiceAgreementView from '../../components/contracts/SingleServiceAgreementView'

const { Title, Text } = Typography

const ContractDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const contractId = parseInt(id || '0', 10)
  const contractContentRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  // 获取合同详情数据
  const { data: contractData, isLoading, error } = useContractDetail(contractId)

  // 检查合同ID有效性
  useEffect(() => {
    if (!id || isNaN(contractId)) {
      navigate('/contracts', { replace: true })
    }
  }, [id, contractId, navigate])

  // 返回合同列表
  const handleBack = () => {
    navigate('/contracts')
  }

  // 编辑合同
  const handleEdit = () => {
    navigate(`/contracts/edit/${id}`)
  }

  // 下载合同图片
  const handleDownloadContract = async () => {
    if (!contractContentRef.current || !contractData) {
      message.error('无法获取合同内容，请稍后重试')
      return
    }

    setIsExporting(true)

    try {
      // 配置html2canvas选项
      const canvas = await html2canvas(contractContentRef.current, {
        backgroundColor: '#ffffff',
        scale: 2, // 提高清晰度
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        width: contractContentRef.current.scrollWidth,
        height: contractContentRef.current.scrollHeight,
        onclone: clonedDoc => {
          // 在克隆的文档中应用打印样式
          const clonedElement = clonedDoc.querySelector('.contract-content-wrapper') as HTMLElement
          if (clonedElement) {
            clonedElement.style.background = '#ffffff'
            clonedElement.style.padding = '20px'
            clonedElement.style.borderRadius = '0'
            clonedElement.style.boxShadow = 'none'
            clonedElement.style.display = 'flex'
            clonedElement.style.justifyContent = 'center'
            clonedElement.style.alignItems = 'flex-start'
          }

          // 确保合同组件本身也居中
          const agreementElement = clonedDoc.querySelector('.product-service-agreement')
          const accountingElement = clonedDoc.querySelector('.agency-accounting-agreement-view')
          
          if (agreementElement instanceof HTMLElement) {
            agreementElement.style.margin = '0 auto'
            agreementElement.style.display = 'block'
          }
          
          if (accountingElement instanceof HTMLElement) {
            accountingElement.style.margin = '0 auto'
            accountingElement.style.display = 'block'
          }
        },
      })

      // 转换为Blob并下载
      canvas.toBlob(
        blob => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `合同_${contractData.contractNumber || contractData.id}_${new Date().toLocaleDateString()}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            message.success('合同图片下载成功')
          } else {
            message.error('生成图片失败，请重试')
          }
        },
        'image/png',
        0.9
      )
    } catch (error) {
      console.error('导出合同图片失败:', error)
      message.error('导出合同图片失败，请重试')
    } finally {
      setIsExporting(false)
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
      title: '合同详情',
    },
  ]

  // 获取合同状态显示文本和颜色
  const getContractStatusDisplay = (status?: string) => {
    switch (status) {
      case '1':
        return { text: '已签署', color: 'green' }
      case '2':
        return { text: '已终止', color: 'red' }
      case '0':
      default:
        return { text: '未签署', color: 'orange' }
    }
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
          <Alert
            message="加载合同详情失败"
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
        return <ProductServiceAgreementView contractData={contractData} />
      case '代理记账合同':
        return <AgencyAccountingAgreementView contractData={contractData} />
      case '单项服务合同':
        return <SingleServiceAgreementView contractData={contractData} />
      default:
        return (
          <div className="text-center py-8">
            <Alert
              message="不支持的合同类型"
              description={`暂不支持展示 "${contractData.contractType}" 类型的合同。`}
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
            <h2 className="text-xl font-semibold m-0">合同详情</h2>
          </div>
          <Space>
            {contractData && contractData.contractStatus === '0' && (
              <Button
                icon={<EditOutlined />}
                onClick={handleEdit}
                disabled={contractData.contractType !== '产品服务协议' && contractData.contractType !== '代理记账合同'}
              >
                编辑合同
              </Button>
            )}
            <Button
              icon={<DownloadOutlined />}
              loading={isExporting}
              onClick={handleDownloadContract}
              disabled={!contractData || (contractData.contractType !== '产品服务协议' && contractData.contractType !== '代理记账合同')}
            >
              {isExporting ? '导出中...' : '下载合同'}
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
              <span className="font-medium text-blue-600">
                {contractData.contractNumber || '未生成'}
              </span>
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
              <span
                className={`font-medium text-${getContractStatusDisplay(contractData.contractStatus).color}-600`}
              >
                {getContractStatusDisplay(contractData.contractStatus).text}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 w-24">甲方公司：</span>
              <span className="font-medium">{contractData.partyACompany || '-'}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 w-24">费用总计：</span>
              <span className="font-medium text-red-600">
                {contractData.totalCost ? `¥${contractData.totalCost}` : '-'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 w-24">提交人：</span>
              <span className="font-medium">{contractData.submitter || '-'}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 w-24">创建时间：</span>
              <span className="font-medium">
                {contractData.createTime
                  ? new Date(contractData.createTime).toLocaleString()
                  : '未知'}
              </span>
            </div>
            {contractData.contractStatus === '1' && (
              <div className="flex items-center">
                <span className="text-gray-600 w-24">签署时间：</span>
                <span className="font-medium">
                  {contractData.updateTime
                    ? new Date(contractData.updateTime).toLocaleString()
                    : '未知'}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      <Divider />

      {/* 合同内容区域 */}
      <div
        className="contract-content-wrapper"
        style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}
        ref={contractContentRef}
      >
        {renderContractContent()}
      </div>
    </div>
  )
}

export default ContractDetail
