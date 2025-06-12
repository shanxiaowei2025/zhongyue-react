import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Spin, Alert, Button, Typography, message } from 'antd'
import { getSignedContractByCode } from '../../api/contract'
import { buildImageUrl } from '../../utils/upload'

const { Title, Paragraph } = Typography

interface ContractViewProps {}

const ContractView: React.FC<ContractViewProps> = () => {
  const { encryptedCode } = useParams<{ encryptedCode: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contractImage, setContractImage] = useState<string | null>(null)

  // 获取合同图片
  useEffect(() => {
    const fetchContractImage = async () => {
      if (!encryptedCode) {
        setError('无效的访问链接')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        // 调用获取已签名合同图片的API
        const response = await getSignedContractByCode(encryptedCode)

        if (response.data && response.data.contractImage) {
          setContractImage(response.data.contractImage)
          setError(null)
        } else {
          setError('未找到合同图片')
        }
      } catch (error: any) {
        console.error('获取合同图片失败:', error)
        if (error.response?.status === 404) {
          setError('该链接已失效或不存在')
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
  }, [encryptedCode])

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

  // 合同查看页面内容
  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-6xl mx-auto sm:px-4">
        {/* 页面标题 */}
        <div className="text-center mb-4 sm:mb-8 px-4 sm:px-0">
          <Title level={2} className="text-lg sm:text-2xl">
            已签署合同
          </Title>
          <Paragraph className="text-gray-600 text-sm sm:text-base">
            以下是已签署的合同内容
          </Paragraph>
        </div>

        {/* 合同图片展示区域 */}
        {contractImage ? (
          <Card className="mb-4 sm:mb-6 mx-0 sm:mx-0 contract-image-card">
            <div className="contract-image-container">
              <img
                src={buildImageUrl(contractImage)}
                alt="已签署合同内容"
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
      </div>
    </div>
  )
}

export default ContractView
