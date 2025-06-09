import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Spin, Alert, Button, Typography, message, Modal } from 'antd'
import {
  getContractImageByToken,
  saveContractSignature,
  validateContractToken,
} from '../../api/contract'
import { uploadFile } from '../../api/upload'
import { buildImageUrl } from '../../utils/upload'
import SignatureCanvasForward, {
  SignatureCanvasRef,
} from '../../components/contracts/SignatureCanvasForward'
import { publicRequest } from '../../api/request'

// 手机端优化样式
const mobileStyles = `
  .signature-canvas {
    touch-action: none;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  
  .contract-image-container img {
    max-width: 100%;
    height: auto;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }
  
  @media (max-width: 640px) {
    .ant-modal-body {
      padding: 12px 16px !important;
    }
    
    .ant-modal-header {
      padding: 12px 16px !important;
    }
    
    .ant-modal {
      margin: 16px !important;
    }
    
    .ant-modal-content {
      border-radius: 8px !important;
    }
    
    .ant-typography h2 {
      font-size: 1.2rem !important;
      margin-bottom: 0.5rem !important;
    }
    
    .ant-typography h4 {
      font-size: 1rem !important;
      margin-bottom: 0.25rem !important;
    }
    
    /* 移动端合同图片Card撑满屏幕 */
    .contract-image-card {
      margin-left: 0 !important;
      margin-right: 0 !important;
      border-radius: 0 !important;
    }
    
    .contract-image-card .ant-card-body {
      padding: 0 !important;
    }
    
    /* 确保签名板边框样式不被覆盖 */
    .signature-container {
      border: 1px solid #d1d5db !important;
      border-radius: 0.5rem !important;
    }
  }
`

const { Title, Paragraph } = Typography

interface ContractSignProps {}

const ContractSign: React.FC<ContractSignProps> = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contractImage, setContractImage] = useState<string | null>(null)
  const [contractId, setContractId] = useState<number | null>(null)
  const [signModalVisible, setSignModalVisible] = useState(false)
  const [signing, setSigning] = useState(false)
  const [windowWidth, setWindowWidth] = useState(0)
  const signatureRef = useRef<SignatureCanvasRef | null>(null)

  // 获取窗口宽度
  useEffect(() => {
    const updateWindowWidth = () => {
      setWindowWidth(window.innerWidth)
    }

    // 初始化窗口宽度
    updateWindowWidth()

    // 监听窗口大小变化
    window.addEventListener('resize', updateWindowWidth)
    return () => window.removeEventListener('resize', updateWindowWidth)
  }, [])

  // 验证令牌并获取合同图片
  useEffect(() => {
    const fetchContractImage = async () => {
      if (!token) {
        setError('无效的链接')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = (await getContractImageByToken(token)) as any

        if (response.data && response.data.contractImage) {
          setContractImage(response.data.contractImage)
          setContractId(response.data.contractId || null)
          setError(null)
        } else {
          setError('未找到合同图片')
        }
      } catch (error: any) {
        console.error('获取合同图片失败:', error)
        if (error.response?.status === 404) {
          setError('该连接已失效')
        } else if (error.response?.status === 400) {
          setError(error.response?.data?.message || '链接无效或参数错误')
        } else {
          setError('获取合同图片失败，请重试')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchContractImage()
  }, [token])

  // 打开签名模态框
  const handleSign = () => {
    setSignModalVisible(true)
  }

  // 关闭签名模态框
  const handleCancelSign = () => {
    setSignModalVisible(false)
  }

  // 清除签名
  const handleClearSign = () => {
    if (signatureRef.current) {
      signatureRef.current.clear()
    }
  }

  // 确认签署
  const handleConfirmSign = async () => {
    if (!signatureRef.current || !token || !contractId) {
      message.error('签名无效或合同信息不完整')
      return
    }

    // 检查签名是否为空
    if (signatureRef.current.isEmpty()) {
      message.error('请先进行签名')
      return
    }

    try {
      setSigning(true)

      // 1. 获取签名图片的dataURL
      const signatureDataUrl = signatureRef.current.toDataURL('image/png')
      console.log('生成签名数据URL成功，长度:', signatureDataUrl.length)

      // 2. 转换为Blob
      const response = await fetch(signatureDataUrl)
      const blob = await response.blob()
      console.log('签名Blob生成成功，大小:', blob.size, 'bytes')

      // 3. 创建File对象
      const fileName = `signature_${contractId}_${new Date().getTime()}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      // 4. 上传签名图片 - 使用token参数
      console.log('开始上传签名图片:', fileName)
      const formData = new FormData()
      formData.append('file', file)

      // 使用完整URL，包含token参数
      const uploadUrl = `/storage/upload?token=${token}`
      const uploadResponse = await publicRequest.post<{
        code: number
        data: { url: string; fileName: string }
        message: string
      }>(uploadUrl, formData)

      console.log('签名上传响应:', uploadResponse)

      if (!uploadResponse || !uploadResponse.data || !uploadResponse.data.fileName) {
        throw new Error('签名上传失败: 未返回有效的文件名')
      }

      const signatureFileName = uploadResponse.data.fileName
      console.log('签名上传成功，文件名:', signatureFileName)

      // 使用buildImageUrl函数构建完整URL
      const signatureUrl = buildImageUrl(signatureFileName)
      console.log('签名URL:', signatureUrl)

      // 5. 保存合同签名 - 使用正确的接口参数
      console.log('开始保存合同签名, 合同ID:', contractId)
      const saveData = {
        contractId,
        token,
        signatureUrl,
      }

      const saveResponse = await publicRequest.post('/contract-token/signature', saveData)
      console.log('保存签名响应:', saveResponse)

      // 6. 关闭模态框并显示成功消息
      setSignModalVisible(false)

      // 显示成功模态框
      Modal.success({
        title: '签署成功',
        content: '合同已成功签署，感谢您的配合！',
        okText: '返回首页',
        onOk: () => navigate('/'),
      })
    } catch (error: any) {
      console.error('签署失败:', error)
      let errorMessage = '签署失败，请重试'

      if (error.response) {
        console.error('错误响应数据:', error.response.data)
        console.error('错误状态码:', error.response.status)
        errorMessage = error.response.data?.message || errorMessage
      }

      message.error(errorMessage)
    } finally {
      setSigning(false)
    }
  }

  // 如果正在加载
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md text-center">
          <Spin size="large" />
          <div className="mt-4">
            <Paragraph>正在加载合同内容...</Paragraph>
          </div>
        </Card>
      </div>
    )
  }

  // 如果有错误
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <Alert message="访问失败" description={error} type="error" showIcon className="mb-4" />
          <div className="text-center">
            <Button type="primary" onClick={() => navigate('/')}>
              返回首页
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // 签署页面内容
  return (
    <>
      {/* 注入手机端优化样式 */}
      <style dangerouslySetInnerHTML={{ __html: mobileStyles }} />

      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-6xl mx-auto sm:px-4">
          {/* 页面标题 */}
          <div className="text-center mb-4 sm:mb-8 px-4 sm:px-0">
            <Title level={2} className="text-lg sm:text-2xl">
              合同签署
            </Title>
            <Paragraph className="text-gray-600 text-sm sm:text-base">
              请仔细阅读合同内容，确认无误后进行签署
            </Paragraph>
            {contractId && (
              <Paragraph className="text-xs sm:text-sm text-gray-500">
                合同ID: {contractId}
              </Paragraph>
            )}
          </div>

          {/* 合同图片展示区域 */}
          {contractImage ? (
            <Card className="mb-4 sm:mb-6 mx-0 sm:mx-0 contract-image-card">
              <div className="text-center px-4 sm:px-6">
                <Title level={4} className="mb-2 sm:mb-4 text-base sm:text-lg">
                  合同内容
                </Title>
              </div>
              <div
                className="contract-image-container"
                style={{
                  maxWidth: '100%',
                  overflow: 'auto',
                  border: 'none',
                  borderRadius: '0',
                  padding: '0',
                  backgroundColor: '#ffffff',
                }}
              >
                <img
                  src={buildImageUrl(contractImage)}
                  alt="合同内容"
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    margin: '0 auto',
                  }}
                />
              </div>
            </Card>
          ) : (
            <Card className="mb-4 sm:mb-6 mx-4 sm:mx-0">
              <div className="text-center py-8 sm:py-12">
                <Title level={4} className="text-gray-500 text-base sm:text-lg">
                  未找到合同图片
                </Title>
                <Paragraph className="text-gray-400 text-sm sm:text-base">
                  该合同可能尚未生成图片或图片已被删除
                </Paragraph>
              </div>
            </Card>
          )}

          {/* 签署操作区域 */}
          <Card className="mx-4 sm:mx-0">
            <div className="text-center py-4 sm:py-8">
              <Title level={4} className="mb-2 sm:mb-4 text-base sm:text-lg">
                签署操作
              </Title>
              <Paragraph className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                确认合同内容无误后，请点击下方按钮进行签署
              </Paragraph>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button size="large" onClick={() => navigate('/')} className="w-full sm:w-auto">
                  返回首页
                </Button>
                <Button
                  type="primary"
                  size="large"
                  onClick={handleSign}
                  disabled={!contractImage || !contractId}
                  className="w-full sm:w-auto"
                >
                  确认签署
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* 签名模态框 */}
        <Modal
          title="请在下方进行签名"
          open={signModalVisible}
          onCancel={handleCancelSign}
          footer={null}
          width="90%"
          style={{ maxWidth: '500px' }}
          maskClosable={false}
          centered
          destroyOnClose
        >
          <div className="py-2 sm:py-4">
            <Paragraph className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
              请在下方空白区域进行手写签名，签名将用于确认合同签署
            </Paragraph>

            <div
              className="mb-3 sm:mb-4 touch-pan-y signature-container"
              style={{
                padding: '4px',
                border: '1px solid #d1d5db',
                borderRadius: '0.5rem',
              }}
            >
              <SignatureCanvasForward
                ref={signatureRef}
                canvasProps={{
                  className: 'signature-canvas w-full',
                  width: windowWidth > 640 ? 450 : Math.min(windowWidth - 120, 320),
                  height: windowWidth > 640 ? 200 : 150,
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
              <Button onClick={handleClearSign} className="w-full sm:w-auto">
                清除签名
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                <Button className="w-full sm:w-auto sm:mr-2" onClick={handleCancelSign}>
                  取消
                </Button>
                <Button
                  type="primary"
                  onClick={handleConfirmSign}
                  loading={signing}
                  className="w-full sm:w-auto"
                >
                  {signing ? '正在提交...' : '确认签署'}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </>
  )
}

export default ContractSign
