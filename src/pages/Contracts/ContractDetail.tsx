import React, { useEffect, useState, useRef } from 'react'
import {
  Card,
  Button,
  Space,
  Breadcrumb,
  Alert,
  Spin,
  Divider,
  Typography,
  message,
  Modal,
  Input,
} from 'antd'
import {
  ArrowLeftOutlined,
  HomeOutlined,
  FileTextOutlined,
  EditOutlined,
  DownloadOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import html2canvas from 'html2canvas'
import { useContractDetail } from '../../hooks/useContract'
import { generateContractToken, updateContract } from '../../api/contract'
import { uploadFile } from '../../api/upload'
import ProductServiceAgreementView from '../../components/contracts/ProductServiceAgreementView'
import AgencyAccountingAgreementView from '../../components/contracts/AgencyAccountingAgreementView'
import SingleServiceAgreementView from '../../components/contracts/SingleServiceAgreementView'
import styles from './ContractDetail.module.css'

const { Title, Text } = Typography

// 加载图片为base64
const loadImageAsBase64 = async (url: string): Promise<string> => {
  try {
    // 如果是相对路径，转为绝对路径
    const absoluteUrl = url.startsWith('/') ? window.location.origin + url : url

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('无法创建canvas上下文'))
            return
          }
          ctx.drawImage(img, 0, 0)
          const dataURL = canvas.toDataURL('image/png')
          resolve(dataURL)
        } catch (err) {
          console.error('转换图片到base64失败:', err)
          reject(err)
        }
      }
      img.onerror = e => {
        console.error('加载图片失败:', absoluteUrl, e)
        reject(new Error(`加载图片失败: ${absoluteUrl}`))
      }
      img.src = absoluteUrl
    })
  } catch (error) {
    console.error('loadImageAsBase64 错误:', error)
    throw error
  }
}

const ContractDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const contractId = parseInt(id || '0', 10)
  const contractContentRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const [signLinkModalVisible, setSignLinkModalVisible] = useState(false)
  const [signUrl, setSignUrl] = useState<string>('')

  // 获取合同详情数据
  const { data: contractData, isLoading, error } = useContractDetail(contractId)

  // 检查合同ID有效性
  useEffect(() => {
    if (!id || isNaN(contractId)) {
      navigate('/contracts', { replace: true })
    }
  }, [id, contractId, navigate])

  // 检查URL查询参数，如果有generateLink=true则自动打开生成签署链接
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (
      params.get('generateLink') === 'true' &&
      contractData &&
      contractData.contractStatus === '0'
    ) {
      handleGenerateSignLink()
    }
  }, [location.search, contractData])

  // 返回合同列表
  const handleBack = () => {
    navigate('/contracts')
  }

  // 编辑合同
  const handleEdit = () => {
    navigate(`/contracts/edit/${id}`)
  }

  // 预处理图片 - 将图片替换为base64格式
  const prepareImagesForHtml2Canvas = async (element: HTMLElement): Promise<void> => {
    try {
      // 获取所有图片元素
      const images = element.querySelectorAll('img')
      console.log(`准备处理 ${images.length} 张图片...`)

      // 处理所有图片
      await Promise.all(
        Array.from(images).map(async img => {
          try {
            if (!img.src) return

            console.log(`处理图片: ${img.src}, 类名: ${img.className}`)

            // 转换为base64
            const base64 = await loadImageAsBase64(img.src)

            // 替换图片源
            img.src = base64
            console.log(`图片转换成功: ${img.className || '未命名图片'}`)

            // 确保图片样式正确
            img.style.display = 'block'
            img.style.visibility = 'visible'
            img.style.opacity = '1'

            // 对于logo特殊处理
            if (img.className.includes('company-logo')) {
              console.log('发现公司logo，应用特殊样式')
              img.style.width = '100px'
              img.style.height = '100px'
              img.style.objectFit = 'contain'
            }

            // 对于印章图片特殊处理
            if (img.className.includes('stamp-image')) {
              console.log('发现印章图片，应用特殊样式')
              img.style.maxWidth = img.style.maxWidth || '150px'
              img.style.maxHeight = img.style.maxHeight || '80px'
              img.style.margin = img.style.margin || '10px 0'
            }
          } catch (err) {
            console.error(`处理图片 ${img.src} 失败:`, err)
          }
        })
      )

      // 确保页脚元素可见
      const footerElement = element.querySelector('.contract-footer')
      if (footerElement instanceof HTMLElement) {
        console.log('应用页脚元素样式')
        footerElement.style.display = 'block'
        footerElement.style.visibility = 'visible'
        footerElement.style.opacity = '1'
        footerElement.style.marginTop = '30px'
        footerElement.style.paddingTop = '20px'
        footerElement.style.borderTop = '1px solid #ddd'
        // 确保页脚内的元素也是可见的
        const footerChildren = footerElement.querySelectorAll('*')
        footerChildren.forEach(child => {
          if (child instanceof HTMLElement) {
            child.style.display = child.tagName.toLowerCase() === 'p' ? 'block' : ''
            child.style.visibility = 'visible'
            child.style.opacity = '1'
            if (child.tagName.toLowerCase() === 'p') {
              child.style.margin = '8px 0'
              child.style.fontSize = '12px'
              child.style.lineHeight = '1.4'
              child.style.color = '#333'
            }
          }
        })
      }

      // 修复甲方乙方布局问题
      const partyHeaders = element.querySelectorAll('.party-header')
      partyHeaders.forEach(header => {
        if (header instanceof HTMLElement) {
          console.log('修复甲方乙方布局')
          // 确保标签和名称水平对齐
          header.style.display = 'flex'
          header.style.flexDirection = 'row'
          header.style.alignItems = 'center'
          header.style.flexWrap = 'nowrap'
          header.style.whiteSpace = 'nowrap'
          header.style.marginBottom = '12px'
          header.style.gap = '10px'

          // 调整标签宽度和间距
          const partyLabel = header.querySelector('.party-label')
          if (partyLabel instanceof HTMLElement) {
            partyLabel.style.display = 'inline-block'
            partyLabel.style.whiteSpace = 'nowrap'
            partyLabel.style.marginRight = '5px'
            partyLabel.style.minWidth = '130px' // 确保有足够空间容纳文字和括号
            partyLabel.style.flexShrink = '0'
            partyLabel.style.letterSpacing = '0.5px' // 增加字母间距，防止重叠
          }

          // 确保公司名称在同一行
          const partyCompanyName = header.querySelector('.party-company-name')
          if (partyCompanyName instanceof HTMLElement) {
            partyCompanyName.style.display = 'inline-block'
            partyCompanyName.style.whiteSpace = 'normal'
            partyCompanyName.style.wordBreak = 'break-word'
            partyCompanyName.style.wordWrap = 'break-word'
            partyCompanyName.style.maxWidth = '450px'
            partyCompanyName.style.overflow = 'visible'
            partyCompanyName.style.textOverflow = 'clip'
            partyCompanyName.style.lineHeight = '1.5'
          }
        }
      })

      // 确保详情描述区域也能自动换行
      const detailRows = element.querySelectorAll('.detail-row')
      detailRows.forEach(row => {
        if (row instanceof HTMLElement) {
          row.style.display = 'flex'
          row.style.flexDirection = 'row'
          row.style.alignItems = 'flex-start'
          row.style.flexWrap = 'wrap'
          row.style.marginBottom = '10px'
          row.style.gap = '10px'
          row.style.width = '100%'

          // 处理标签
          const detailLabel = row.querySelector('.detail-label')
          if (detailLabel instanceof HTMLElement) {
            detailLabel.style.display = 'inline-block'
            detailLabel.style.minWidth = '80px'
            detailLabel.style.flexShrink = '0'
            detailLabel.style.fontSize = '12px'
            detailLabel.style.fontFamily = "'SourceHanSerifCN', '思源宋体', serif"
          }

          // 处理值
          const detailValue = row.querySelector('.detail-value')
          if (detailValue instanceof HTMLElement) {
            detailValue.style.display = 'inline-block'
            detailValue.style.fontSize = '12px'
            detailValue.style.color = '#333'
            detailValue.style.fontFamily = "'SourceHanSerifCN', '思源宋体', serif"
            detailValue.style.wordBreak = 'break-word'
            detailValue.style.wordWrap = 'break-word'
            detailValue.style.whiteSpace = 'normal'
            detailValue.style.flexGrow = '1'
            detailValue.style.maxWidth = 'calc(100% - 100px)' // 100px = 标签宽度 + 间距
          }
        }
      })

      // 处理联系人信息区域
      const contactRows = element.querySelectorAll('.contact-row')
      contactRows.forEach(row => {
        if (row instanceof HTMLElement) {
          row.style.display = 'flex'
          row.style.flexWrap = 'wrap'
          row.style.gap = '30px'

          // 处理每个联系项
          const contactItems = row.querySelectorAll('.contact-item')
          contactItems.forEach(item => {
            if (item instanceof HTMLElement) {
              item.style.display = 'flex'
              item.style.alignItems = 'flex-start'
              item.style.gap = '8px'
              item.style.marginBottom = '8px'

              // 处理标签
              const contactLabel = item.querySelector('.contact-label')
              if (contactLabel instanceof HTMLElement) {
                contactLabel.style.whiteSpace = 'nowrap'
                contactLabel.style.fontSize = '12px'
                contactLabel.style.fontFamily = "'SourceHanSerifCN', '思源宋体', serif"
              }

              // 处理值
              const contactValue = item.querySelector('.contact-value')
              if (contactValue instanceof HTMLElement) {
                contactValue.style.display = 'inline-block'
                contactValue.style.fontSize = '12px'
                contactValue.style.color = '#333'
                contactValue.style.fontFamily = "'SourceHanSerifCN', '思源宋体', serif"
                contactValue.style.wordBreak = 'break-word'
                contactValue.style.wordWrap = 'break-word'
                contactValue.style.whiteSpace = 'normal'
              }
            }
          })
        }
      })

      // 设置服务项目样式
      const serviceItemsTexts = element.querySelectorAll('.service-items-text')
      serviceItemsTexts.forEach(itemsText => {
        if (itemsText instanceof HTMLElement) {
          console.log('应用服务项目文本样式')
          itemsText.style.display = 'inline-block'
          itemsText.style.color = '#000'
          itemsText.style.fontFamily = "'SourceHanSerifCN', '思源宋体', serif"
          itemsText.style.lineHeight = '1.8'

          // 处理每个项目名称
          const itemNames = itemsText.querySelectorAll('.service-item-name')
          itemNames.forEach(name => {
            if (name instanceof HTMLElement) {
              name.style.fontWeight = '500'
              name.style.color = '#000'
            }
          })

          // 处理分隔符
          const separators = itemsText.querySelectorAll('.service-item-separator')
          separators.forEach(separator => {
            if (separator instanceof HTMLElement) {
              separator.style.margin = '0 3px'
              separator.style.color = '#000'
            }
          })
        }
      })

      console.log('所有图片和元素处理完成')
    } catch (error) {
      console.error('预处理图片失败:', error)
    }
  }

  // 下载合同图片
  const handleDownloadContract = async () => {
    if (!contractContentRef.current || !contractData) {
      message.error('无法获取合同内容，请稍后重试')
      return
    }

    setIsExporting(true)

    try {
      // 确定要截图的元素
      let targetElement: HTMLElement = contractContentRef.current

      // 根据合同类型选择不同的目标元素
      if (contractData.contractType === '产品服务协议') {
        const agreementElement = contractContentRef.current.querySelector(
          '.product-service-agreement'
        )
        if (agreementElement && agreementElement instanceof HTMLElement) {
          targetElement = agreementElement
        }
      } else if (contractData.contractType === '代理记账合同') {
        // 通过ID选择代理记账合同视图元素
        const agreementElement = document.getElementById('agency-accounting-agreement-view')
        if (agreementElement && agreementElement instanceof HTMLElement) {
          targetElement = agreementElement
        } else {
          console.error('未找到代理记账合同视图元素')
        }
      } else if (contractData.contractType === '单项服务合同') {
        // 通过ID选择单项服务合同视图元素
        const agreementElement = document.getElementById('single-service-agreement-view')
        if (agreementElement && agreementElement instanceof HTMLElement) {
          targetElement = agreementElement
        } else {
          console.error('未找到单项服务合同视图元素')
        }
      }

      // 预处理图片元素 - 转换为base64以避免跨域问题
      await prepareImagesForHtml2Canvas(targetElement)

      // 配置html2canvas选项
      const canvas = await html2canvas(targetElement, {
        backgroundColor: '#ffffff',
        scale: 3, // 提高清晰度，从2提高到3
        useCORS: true,
        allowTaint: true,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        width: targetElement.scrollWidth,
        height: targetElement.scrollHeight + 50, // 增加高度以确保捕获底部内容
        windowWidth: targetElement.scrollWidth,
        windowHeight: targetElement.scrollHeight + 50, // 增加高度以确保捕获底部内容
        onclone: async clonedDoc => {
          // 获取克隆的目标元素
          let clonedElement: HTMLElement | null = null

          if (contractData.contractType === '产品服务协议') {
            const element = clonedDoc.querySelector('.product-service-agreement')
            if (element instanceof HTMLElement) {
              clonedElement = element

              // 保持产品服务协议原样，只添加关键样式确保正确生成
              clonedElement.style.overflow = 'visible'
              clonedElement.style.pageBreakInside = 'avoid'
              clonedElement.style.paddingBottom = '50px' // 增加底部填充

              // 应用样式修复
              const partyHeaders = clonedElement.querySelectorAll('[class*="partyHeader"]')
              partyHeaders.forEach(header => {
                if (header instanceof HTMLElement) {
                  // 确保标签和名称水平对齐
                  header.style.display = 'flex'
                  header.style.flexDirection = 'row'
                  header.style.alignItems = 'flex-start'
                  header.style.flexWrap = 'wrap'
                  header.style.whiteSpace = 'normal'
                  header.style.marginBottom = '12px'
                  header.style.gap = '10px'
                  header.style.width = '100%'
                }
              })

              // 处理费用行，确保费用总计和大写金额在同一行
              const feeRows = clonedElement.querySelectorAll('[class*="feeRow"]')
              feeRows.forEach(row => {
                if (row instanceof HTMLElement) {
                  row.style.display = 'flex'
                  row.style.flexDirection = 'row'
                  row.style.alignItems = 'center'
                  row.style.flexWrap = 'nowrap'
                  row.style.whiteSpace = 'nowrap'
                  row.style.width = '100%'
                  row.style.marginBottom = '20px'
                  row.style.gap = '15px'

                  // 处理费用标签
                  const feeLabels = row.querySelectorAll('[class*="feeLabel"]')
                  feeLabels.forEach(label => {
                    if (label instanceof HTMLElement) {
                      label.style.fontWeight = 'bold'
                      label.style.minWidth = '120px'
                      label.style.flexShrink = '0'
                      label.style.whiteSpace = 'nowrap'
                      label.style.fontSize = '12px'
                    }
                  })

                  // 处理金额
                  const feeAmount = row.querySelector('[class*="feeAmount"]')
                  if (feeAmount instanceof HTMLElement) {
                    feeAmount.style.whiteSpace = 'nowrap'
                    feeAmount.style.marginRight = '20px'
                    feeAmount.style.fontSize = '12px'
                  }

                  // 处理金额大写
                  const feeWords = row.querySelector('[class*="feeWords"]')
                  if (feeWords instanceof HTMLElement) {
                    feeWords.style.whiteSpace = 'nowrap'
                    feeWords.style.fontWeight = 'bold'
                    feeWords.style.fontSize = '12px'
                  }
                }
              })

              // 处理签署区域，确保甲方和乙方盖章区域左右排列
              const signatureSection = clonedElement.querySelector('.signature-section')
              if (signatureSection instanceof HTMLElement) {
                signatureSection.style.margin = '50px 0 30px 0'
                signatureSection.style.pageBreakInside = 'avoid'
              }

              const signatureRow = clonedElement.querySelector('.signature-row')
              if (signatureRow instanceof HTMLElement) {
                signatureRow.style.display = 'flex'
                signatureRow.style.flexDirection = 'row'
                signatureRow.style.justifyContent = 'space-between'
                signatureRow.style.alignItems = 'flex-start'
                signatureRow.style.marginBottom = '20px'
              }

              const signatureColumns = clonedElement.querySelectorAll('.signature-column')
              signatureColumns.forEach(column => {
                if (column instanceof HTMLElement) {
                  column.style.display = 'flex'
                  column.style.flexDirection = 'column'
                  column.style.width = '48%'
                }
              })

              const signatureBlocks = clonedElement.querySelectorAll('.signature-block')
              signatureBlocks.forEach(block => {
                if (block instanceof HTMLElement) {
                  block.style.display = 'flex'
                  block.style.flexDirection = 'column'
                  block.style.gap = '10px'
                }
              })

              const signatureItems = clonedElement.querySelectorAll('.signature-item')
              signatureItems.forEach(item => {
                if (item instanceof HTMLElement) {
                  item.style.display = 'flex'
                  item.style.alignItems = 'center'
                  item.style.gap = '20px'
                }
              })

              const dateItems = clonedElement.querySelectorAll('.date-item')
              dateItems.forEach(item => {
                if (item instanceof HTMLElement) {
                  item.style.display = 'flex'
                  item.style.alignItems = 'center'
                  item.style.gap = '10px'
                }
              })

              // 确保盖章区域样式正确
              const signatureAreas = clonedElement.querySelectorAll('.signature-area')
              signatureAreas.forEach(area => {
                if (area instanceof HTMLElement) {
                  if (area.classList.contains('signed')) {
                    area.style.border = 'none'
                    area.style.background = 'transparent'
                  } else {
                    area.style.width = '120px'
                    area.style.height = '60px'
                    area.style.border = '1px dashed #999'
                    area.style.background = '#fafafa'
                  }
                }
              })

              // 确保印章图片样式正确
              const stampImages = clonedElement.querySelectorAll('.stamp-image')
              stampImages.forEach(img => {
                if (img instanceof HTMLElement) {
                  img.style.display = 'block'

                  // 甲方印章和乙方印章可能需要不同的样式
                  const altText = img.getAttribute('alt') || ''
                  if (altText.includes('甲方签名')) {
                    img.style.maxWidth = '150px'
                    img.style.maxHeight = '80px'
                    img.style.margin = '10px 0'
                  } else if (altText.includes('甲方')) {
                    img.style.maxWidth = '150px'
                    img.style.maxHeight = '80px'
                    img.style.margin = '10px 0'
                  } else if (altText.includes('乙方')) {
                    img.style.maxWidth = '130px'
                    img.style.maxHeight = '130px'
                    img.style.margin = '-25px 0 -10px 0'
                  }
                }
              })
            }
          } else if (contractData.contractType === '代理记账合同') {
            // 通过ID选择代理记账合同视图元素
            const element = clonedDoc.getElementById('agency-accounting-agreement-view')
            if (element instanceof HTMLElement) {
              clonedElement = element

              // 应用样式修复
              const partyHeaders = clonedElement.querySelectorAll('[class*="partyHeader"]')
              partyHeaders.forEach(header => {
                if (header instanceof HTMLElement) {
                  // 确保标签和名称水平对齐
                  header.style.display = 'flex'
                  header.style.flexDirection = 'row'
                  header.style.alignItems = 'flex-start'
                  header.style.flexWrap = 'wrap'
                  header.style.whiteSpace = 'normal'
                  header.style.marginBottom = '12px'
                  header.style.gap = '10px'
                  header.style.width = '100%'
                }
              })

              // 处理费用行，确保费用总计和大写金额在同一行
              const feeRows = clonedElement.querySelectorAll('[class*="feeRow"]')
              feeRows.forEach(row => {
                if (row instanceof HTMLElement) {
                  row.style.display = 'flex'
                  row.style.flexDirection = 'row'
                  row.style.alignItems = 'center'
                  row.style.flexWrap = 'nowrap'
                  row.style.whiteSpace = 'nowrap'
                  row.style.width = '100%'
                  row.style.marginBottom = '20px'
                  row.style.gap = '15px'

                  // 处理费用标签
                  const feeLabels = row.querySelectorAll('[class*="feeLabel"]')
                  feeLabels.forEach(label => {
                    if (label instanceof HTMLElement) {
                      label.style.fontWeight = 'bold'
                      label.style.minWidth = '120px'
                      label.style.flexShrink = '0'
                      label.style.whiteSpace = 'nowrap'
                      label.style.fontSize = '12px'
                    }
                  })

                  // 处理金额
                  const feeAmount = row.querySelector('[class*="feeAmount"]')
                  if (feeAmount instanceof HTMLElement) {
                    feeAmount.style.whiteSpace = 'nowrap'
                    feeAmount.style.marginRight = '20px'
                    feeAmount.style.fontSize = '12px'
                  }

                  // 处理金额大写
                  const feeWords = row.querySelector('[class*="feeWords"]')
                  if (feeWords instanceof HTMLElement) {
                    feeWords.style.whiteSpace = 'nowrap'
                    feeWords.style.fontWeight = 'bold'
                    feeWords.style.fontSize = '12px'
                  }
                }
              })
            }
          } else if (contractData.contractType === '单项服务合同') {
            // 通过ID选择单项服务合同视图元素
            const element = clonedDoc.getElementById('single-service-agreement-view')
            if (element instanceof HTMLElement) {
              clonedElement = element

              // 修复合同标题样式
              const contractTitle = clonedElement.querySelector('[class*="contractTitle"]')
              if (contractTitle instanceof HTMLElement) {
                contractTitle.style.textAlign = 'center'
                contractTitle.style.margin = '20px 0'
                contractTitle.style.fontSize = '18px'
                contractTitle.style.fontWeight = 'bold'
              }

              // 修复甲方乙方信息样式
              const partyHeaders = clonedElement.querySelectorAll('[class*="partyHeader"]')
              partyHeaders.forEach(header => {
                if (header instanceof HTMLElement) {
                  // 确保标签和名称水平对齐在同一行
                  header.style.display = 'flex'
                  header.style.flexDirection = 'row'
                  header.style.alignItems = 'center'
                  header.style.flexWrap = 'nowrap'
                  header.style.marginBottom = '10px'
                  header.style.width = '100%'
                }
              })

              // 修复甲方乙方标签和公司名称样式
              const partyLabels = clonedElement.querySelectorAll('[class*="partyLabel"]')
              partyLabels.forEach(label => {
                if (label instanceof HTMLElement) {
                  label.style.fontWeight = 'bold'
                  label.style.minWidth = 'fit-content'
                  label.style.flexShrink = '0'
                  label.style.display = 'inline-block'
                  label.style.marginRight = '0'
                  label.style.whiteSpace = 'nowrap'
                  label.style.fontSize = '12px'
                }
              })

              const partyCompanyNames = clonedElement.querySelectorAll(
                '[class*="partyCompanyName"]'
              )
              partyCompanyNames.forEach(name => {
                if (name instanceof HTMLElement) {
                  name.style.display = 'inline-block'
                  name.style.whiteSpace = 'normal'
                  name.style.fontSize = '12px'
                }
              })

              // 修复明细行样式
              const detailRows = clonedElement.querySelectorAll('[class*="detailRow"]')
              detailRows.forEach(row => {
                if (row instanceof HTMLElement) {
                  row.style.display = 'flex'
                  row.style.flexDirection = 'row'
                  row.style.flexWrap = 'nowrap'
                  row.style.alignItems = 'center'
                  row.style.marginBottom = '8px'
                  row.style.width = '100%'
                }
              })

              // 修复明细标签和值的样式
              const detailLabels = clonedElement.querySelectorAll('[class*="detailLabel"]')
              detailLabels.forEach(label => {
                if (label instanceof HTMLElement) {
                  label.style.fontWeight = 'bold'
                  label.style.minWidth = 'fit-content'
                  label.style.flexShrink = '0'
                  label.style.display = 'inline-block'
                  label.style.marginRight = '0'
                  label.style.whiteSpace = 'nowrap'
                  label.style.fontSize = '12px'
                }
              })

              const detailValues = clonedElement.querySelectorAll('[class*="detailValue"]')
              detailValues.forEach(value => {
                if (value instanceof HTMLElement) {
                  value.style.display = 'inline-block'
                  value.style.whiteSpace = 'normal'
                  value.style.fontSize = '12px'
                  // 保持原有宽度设置
                  if (!value.style.width) {
                    value.style.flex = '1'
                  }
                }
              })

              // 确保所有文本大小一致
              const allTextElements = clonedElement.querySelectorAll('p, span, div')
              allTextElements.forEach(el => {
                if (el instanceof HTMLElement && !el.style.fontSize) {
                  el.style.fontSize = '12px'
                }
              })

              // 处理费用行，确保费用总计和大写金额在同一行
              const feeRows = clonedElement.querySelectorAll('[class*="feeRow"]')
              feeRows.forEach(row => {
                if (row instanceof HTMLElement) {
                  row.style.display = 'flex'
                  row.style.flexDirection = 'row'
                  row.style.alignItems = 'center'
                  row.style.flexWrap = 'nowrap'
                  row.style.whiteSpace = 'nowrap'
                  row.style.width = '100%'
                  row.style.marginBottom = '10px'
                  row.style.gap = '5px'
                }
              })

              // 处理费用标签
              const feeLabels = clonedElement.querySelectorAll('[class*="feeLabel"]')
              feeLabels.forEach(label => {
                if (label instanceof HTMLElement) {
                  label.style.fontWeight = 'bold'
                  label.style.minWidth = 'fit-content'
                  label.style.flexShrink = '0'
                  label.style.whiteSpace = 'nowrap'
                  label.style.fontSize = '12px'
                  label.style.display = 'inline-block'
                  label.style.marginRight = '0'
                }
              })

              // 处理金额
              const feeAmounts = clonedElement.querySelectorAll('[class*="feeAmount"]')
              feeAmounts.forEach(amount => {
                if (amount instanceof HTMLElement) {
                  amount.style.whiteSpace = 'nowrap'
                  amount.style.marginRight = '10px'
                  amount.style.fontSize = '12px'
                  amount.style.display = 'inline-block'
                }
              })

              // 处理金额大写
              const feeWords = clonedElement.querySelectorAll('[class*="feeWords"]')
              feeWords.forEach(words => {
                if (words instanceof HTMLElement) {
                  words.style.whiteSpace = 'nowrap'
                  words.style.fontWeight = 'bold'
                  words.style.fontSize = '12px'
                  words.style.display = 'inline-block'
                }
              })
            }
          } else {
            // 处理其他合同类型
            const element = clonedDoc.querySelector('[class*="contractContentInner"]')
            if (element instanceof HTMLElement) {
              clonedElement = element

              // 设置样式确保全部内容可见
              clonedElement.style.overflow = 'visible'
              clonedElement.style.height = 'auto'
              clonedElement.style.minHeight = targetElement.scrollHeight + 'px'
              clonedElement.style.width = '210mm'
              clonedElement.style.minWidth = '210mm'
              clonedElement.style.padding = '0'
              clonedElement.style.margin = '0 auto'
              clonedElement.style.background = '#ffffff'
              clonedElement.style.boxShadow = 'none'
              clonedElement.style.borderRadius = '0'
              clonedElement.style.paddingBottom = '50px' // 增加底部填充

              // 处理所有子元素，确保没有溢出隐藏
              const allElements = clonedElement.querySelectorAll('*')
              allElements.forEach(el => {
                if (el instanceof HTMLElement) {
                  el.style.overflow = 'visible'
                }
              })

              // 处理外层容器
              const wrapperElement = clonedDoc.querySelector('[class*="contractContentWrapper"]')
              if (wrapperElement instanceof HTMLElement) {
                wrapperElement.style.background = '#ffffff'
                wrapperElement.style.padding = '0'
                wrapperElement.style.borderRadius = '0'
                wrapperElement.style.boxShadow = 'none'
                wrapperElement.style.overflow = 'visible'
              }

              // 确保合同组件本身也居中
              const serviceElement = clonedDoc.querySelector('.single-service-agreement-view')
              if (serviceElement instanceof HTMLElement) {
                serviceElement.style.margin = '0 auto'
                serviceElement.style.display = 'block'
                serviceElement.style.pageBreakInside = 'avoid'
              }
            }
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
        1.0 // 提高质量到最高
      )
    } catch (error) {
      console.error('导出合同图片失败:', error)
      message.error('导出合同图片失败，请重试')
    } finally {
      setIsExporting(false)
    }
  }

  // 生成签署链接
  const handleGenerateSignLink = async () => {
    if (!contractContentRef.current || !contractData) {
      message.error('无法获取合同内容，请稍后重试')
      return
    }

    setIsGeneratingLink(true)

    try {
      // 确定要截图的元素
      let targetElement: HTMLElement = contractContentRef.current

      // 根据合同类型选择不同的目标元素
      if (contractData.contractType === '产品服务协议') {
        const agreementElement = contractContentRef.current.querySelector(
          '.product-service-agreement'
        )
        if (agreementElement && agreementElement instanceof HTMLElement) {
          targetElement = agreementElement
        }
      } else if (contractData.contractType === '代理记账合同') {
        // 通过ID选择代理记账合同视图元素
        const agreementElement = document.getElementById('agency-accounting-agreement-view')
        if (agreementElement && agreementElement instanceof HTMLElement) {
          targetElement = agreementElement
        } else {
          console.error('未找到代理记账合同视图元素')
        }
      } else if (contractData.contractType === '单项服务合同') {
        // 通过ID选择单项服务合同视图元素
        const agreementElement = document.getElementById('single-service-agreement-view')
        if (agreementElement && agreementElement instanceof HTMLElement) {
          targetElement = agreementElement
        } else {
          console.error('未找到单项服务合同视图元素')
        }
      }

      // 显示生成进度提示
      message.loading({
        content: '正在生成合同图片，请稍候...',
        key: 'contractImageGen',
        duration: 0,
      })

      // 预处理图片元素 - 转换为base64以避免跨域问题
      await prepareImagesForHtml2Canvas(targetElement)

      // 配置html2canvas选项
      const canvas = await html2canvas(targetElement, {
        backgroundColor: '#ffffff',
        scale: 3, // 提高清晰度，从2提高到3
        useCORS: true,
        allowTaint: true,
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
        width: targetElement.scrollWidth,
        height: targetElement.scrollHeight + 50, // 增加高度以确保捕获底部内容
        windowWidth: targetElement.scrollWidth,
        windowHeight: targetElement.scrollHeight + 50, // 增加高度以确保捕获底部内容
        onclone: async clonedDoc => {
          // 获取克隆的目标元素
          let clonedElement: HTMLElement | null = null

          if (contractData.contractType === '产品服务协议') {
            const element = clonedDoc.querySelector('.product-service-agreement')
            if (element instanceof HTMLElement) {
              clonedElement = element

              // 保持产品服务协议原样，只添加关键样式确保正确生成
              clonedElement.style.overflow = 'visible'
              clonedElement.style.pageBreakInside = 'avoid'
              clonedElement.style.paddingBottom = '50px' // 增加底部填充

              // 应用样式修复
              const partyHeaders = clonedElement.querySelectorAll('[class*="partyHeader"]')
              partyHeaders.forEach(header => {
                if (header instanceof HTMLElement) {
                  // 确保标签和名称水平对齐
                  header.style.display = 'flex'
                  header.style.flexDirection = 'row'
                  header.style.alignItems = 'flex-start'
                  header.style.flexWrap = 'wrap'
                  header.style.whiteSpace = 'normal'
                  header.style.marginBottom = '12px'
                  header.style.gap = '10px'
                  header.style.width = '100%'
                }
              })

              // 处理费用行，确保费用总计和大写金额在同一行
              const feeRows = clonedElement.querySelectorAll('[class*="feeRow"]')
              feeRows.forEach(row => {
                if (row instanceof HTMLElement) {
                  row.style.display = 'flex'
                  row.style.flexDirection = 'row'
                  row.style.alignItems = 'center'
                  row.style.flexWrap = 'nowrap'
                  row.style.whiteSpace = 'nowrap'
                  row.style.width = '100%'
                  row.style.marginBottom = '20px'
                  row.style.gap = '15px'

                  // 处理费用标签
                  const feeLabels = row.querySelectorAll('[class*="feeLabel"]')
                  feeLabels.forEach(label => {
                    if (label instanceof HTMLElement) {
                      label.style.fontWeight = 'bold'
                      label.style.minWidth = '120px'
                      label.style.flexShrink = '0'
                      label.style.whiteSpace = 'nowrap'
                      label.style.fontSize = '12px'
                    }
                  })

                  // 处理金额
                  const feeAmount = row.querySelector('[class*="feeAmount"]')
                  if (feeAmount instanceof HTMLElement) {
                    feeAmount.style.whiteSpace = 'nowrap'
                    feeAmount.style.marginRight = '20px'
                    feeAmount.style.fontSize = '12px'
                  }

                  // 处理金额大写
                  const feeWords = row.querySelector('[class*="feeWords"]')
                  if (feeWords instanceof HTMLElement) {
                    feeWords.style.whiteSpace = 'nowrap'
                    feeWords.style.fontWeight = 'bold'
                    feeWords.style.fontSize = '12px'
                  }
                }
              })

              // 处理签署区域，确保甲方和乙方盖章区域左右排列
              const signatureSection = clonedElement.querySelector('.signature-section')
              if (signatureSection instanceof HTMLElement) {
                signatureSection.style.margin = '50px 0 30px 0'
                signatureSection.style.pageBreakInside = 'avoid'
              }

              const signatureRow = clonedElement.querySelector('.signature-row')
              if (signatureRow instanceof HTMLElement) {
                signatureRow.style.display = 'flex'
                signatureRow.style.flexDirection = 'row'
                signatureRow.style.justifyContent = 'space-between'
                signatureRow.style.alignItems = 'flex-start'
                signatureRow.style.marginBottom = '20px'
              }

              const signatureColumns = clonedElement.querySelectorAll('.signature-column')
              signatureColumns.forEach(column => {
                if (column instanceof HTMLElement) {
                  column.style.display = 'flex'
                  column.style.flexDirection = 'column'
                  column.style.width = '48%'
                }
              })

              const signatureBlocks = clonedElement.querySelectorAll('.signature-block')
              signatureBlocks.forEach(block => {
                if (block instanceof HTMLElement) {
                  block.style.display = 'flex'
                  block.style.flexDirection = 'column'
                  block.style.gap = '10px'
                }
              })

              const signatureItems = clonedElement.querySelectorAll('.signature-item')
              signatureItems.forEach(item => {
                if (item instanceof HTMLElement) {
                  item.style.display = 'flex'
                  item.style.alignItems = 'center'
                  item.style.gap = '20px'
                }
              })

              const dateItems = clonedElement.querySelectorAll('.date-item')
              dateItems.forEach(item => {
                if (item instanceof HTMLElement) {
                  item.style.display = 'flex'
                  item.style.alignItems = 'center'
                  item.style.gap = '10px'
                }
              })

              // 确保盖章区域样式正确
              const signatureAreas = clonedElement.querySelectorAll('.signature-area')
              signatureAreas.forEach(area => {
                if (area instanceof HTMLElement) {
                  if (area.classList.contains('signed')) {
                    area.style.border = 'none'
                    area.style.background = 'transparent'
                  } else {
                    area.style.width = '120px'
                    area.style.height = '60px'
                    area.style.border = '1px dashed #999'
                    area.style.background = '#fafafa'
                  }
                }
              })

              // 确保印章图片样式正确
              const stampImages = clonedElement.querySelectorAll('.stamp-image')
              stampImages.forEach(img => {
                if (img instanceof HTMLElement) {
                  img.style.display = 'block'

                  // 甲方印章和乙方印章可能需要不同的样式
                  const altText = img.getAttribute('alt') || ''
                  if (altText.includes('甲方签名')) {
                    img.style.maxWidth = '150px'
                    img.style.maxHeight = '80px'
                    img.style.margin = '10px 0'
                  } else if (altText.includes('甲方')) {
                    img.style.maxWidth = '150px'
                    img.style.maxHeight = '80px'
                    img.style.margin = '10px 0'
                  } else if (altText.includes('乙方')) {
                    img.style.maxWidth = '130px'
                    img.style.maxHeight = '130px'
                    img.style.margin = '-25px 0 -10px 0'
                  }
                }
              })
            }
          } else if (contractData.contractType === '代理记账合同') {
            // 通过ID选择代理记账合同视图元素
            const element = clonedDoc.getElementById('agency-accounting-agreement-view')
            if (element instanceof HTMLElement) {
              clonedElement = element

              // 应用样式修复
              const partyHeaders = clonedElement.querySelectorAll('[class*="partyHeader"]')
              partyHeaders.forEach(header => {
                if (header instanceof HTMLElement) {
                  // 确保标签和名称水平对齐
                  header.style.display = 'flex'
                  header.style.flexDirection = 'row'
                  header.style.alignItems = 'flex-start'
                  header.style.flexWrap = 'wrap'
                  header.style.whiteSpace = 'normal'
                  header.style.marginBottom = '12px'
                  header.style.gap = '10px'
                  header.style.width = '100%'
                }
              })

              // 处理费用行，确保费用总计和大写金额在同一行
              const feeRows = clonedElement.querySelectorAll('[class*="feeRow"]')
              feeRows.forEach(row => {
                if (row instanceof HTMLElement) {
                  row.style.display = 'flex'
                  row.style.flexDirection = 'row'
                  row.style.alignItems = 'center'
                  row.style.flexWrap = 'nowrap'
                  row.style.whiteSpace = 'nowrap'
                  row.style.width = '100%'
                  row.style.marginBottom = '20px'
                  row.style.gap = '15px'

                  // 处理费用标签
                  const feeLabels = row.querySelectorAll('[class*="feeLabel"]')
                  feeLabels.forEach(label => {
                    if (label instanceof HTMLElement) {
                      label.style.fontWeight = 'bold'
                      label.style.minWidth = '120px'
                      label.style.flexShrink = '0'
                      label.style.whiteSpace = 'nowrap'
                      label.style.fontSize = '12px'
                    }
                  })

                  // 处理金额
                  const feeAmount = row.querySelector('[class*="feeAmount"]')
                  if (feeAmount instanceof HTMLElement) {
                    feeAmount.style.whiteSpace = 'nowrap'
                    feeAmount.style.marginRight = '20px'
                    feeAmount.style.fontSize = '12px'
                  }

                  // 处理金额大写
                  const feeWords = row.querySelector('[class*="feeWords"]')
                  if (feeWords instanceof HTMLElement) {
                    feeWords.style.whiteSpace = 'nowrap'
                    feeWords.style.fontWeight = 'bold'
                    feeWords.style.fontSize = '12px'
                  }
                }
              })
            }
          } else if (contractData.contractType === '单项服务合同') {
            // 通过ID选择单项服务合同视图元素
            const element = clonedDoc.getElementById('single-service-agreement-view')
            if (element instanceof HTMLElement) {
              clonedElement = element

              // 修复合同标题样式
              const contractTitle = clonedElement.querySelector('[class*="contractTitle"]')
              if (contractTitle instanceof HTMLElement) {
                contractTitle.style.textAlign = 'center'
                contractTitle.style.margin = '20px 0'
                contractTitle.style.fontSize = '18px'
                contractTitle.style.fontWeight = 'bold'
              }

              // 修复甲方乙方信息样式
              const partyHeaders = clonedElement.querySelectorAll('[class*="partyHeader"]')
              partyHeaders.forEach(header => {
                if (header instanceof HTMLElement) {
                  // 确保标签和名称水平对齐在同一行
                  header.style.display = 'flex'
                  header.style.flexDirection = 'row'
                  header.style.alignItems = 'center'
                  header.style.flexWrap = 'nowrap'
                  header.style.marginBottom = '10px'
                  header.style.width = '100%'
                }
              })

              // 修复甲方乙方标签和公司名称样式
              const partyLabels = clonedElement.querySelectorAll('[class*="partyLabel"]')
              partyLabels.forEach(label => {
                if (label instanceof HTMLElement) {
                  label.style.fontWeight = 'bold'
                  label.style.minWidth = 'fit-content'
                  label.style.flexShrink = '0'
                  label.style.display = 'inline-block'
                  label.style.marginRight = '0'
                  label.style.whiteSpace = 'nowrap'
                  label.style.fontSize = '12px'
                }
              })

              const partyCompanyNames = clonedElement.querySelectorAll(
                '[class*="partyCompanyName"]'
              )
              partyCompanyNames.forEach(name => {
                if (name instanceof HTMLElement) {
                  name.style.display = 'inline-block'
                  name.style.whiteSpace = 'normal'
                  name.style.fontSize = '12px'
                }
              })

              // 修复明细行样式
              const detailRows = clonedElement.querySelectorAll('[class*="detailRow"]')
              detailRows.forEach(row => {
                if (row instanceof HTMLElement) {
                  row.style.display = 'flex'
                  row.style.flexDirection = 'row'
                  row.style.flexWrap = 'nowrap'
                  row.style.alignItems = 'center'
                  row.style.marginBottom = '8px'
                  row.style.width = '100%'
                }
              })

              // 修复明细标签和值的样式
              const detailLabels = clonedElement.querySelectorAll('[class*="detailLabel"]')
              detailLabels.forEach(label => {
                if (label instanceof HTMLElement) {
                  label.style.fontWeight = 'bold'
                  label.style.minWidth = 'fit-content'
                  label.style.flexShrink = '0'
                  label.style.display = 'inline-block'
                  label.style.marginRight = '0'
                  label.style.whiteSpace = 'nowrap'
                  label.style.fontSize = '12px'
                }
              })

              const detailValues = clonedElement.querySelectorAll('[class*="detailValue"]')
              detailValues.forEach(value => {
                if (value instanceof HTMLElement) {
                  value.style.display = 'inline-block'
                  value.style.whiteSpace = 'normal'
                  value.style.fontSize = '12px'
                  // 保持原有宽度设置
                  if (!value.style.width) {
                    value.style.flex = '1'
                  }
                }
              })

              // 确保所有文本大小一致
              const allTextElements = clonedElement.querySelectorAll('p, span, div')
              allTextElements.forEach(el => {
                if (el instanceof HTMLElement && !el.style.fontSize) {
                  el.style.fontSize = '12px'
                }
              })

              // 处理费用行，确保费用总计和大写金额在同一行
              const feeRows = clonedElement.querySelectorAll('[class*="feeRow"]')
              feeRows.forEach(row => {
                if (row instanceof HTMLElement) {
                  row.style.display = 'flex'
                  row.style.flexDirection = 'row'
                  row.style.alignItems = 'center'
                  row.style.flexWrap = 'nowrap'
                  row.style.whiteSpace = 'nowrap'
                  row.style.width = '100%'
                  row.style.marginBottom = '10px'
                  row.style.gap = '5px'
                }
              })

              // 处理费用标签
              const feeLabels = clonedElement.querySelectorAll('[class*="feeLabel"]')
              feeLabels.forEach(label => {
                if (label instanceof HTMLElement) {
                  label.style.fontWeight = 'bold'
                  label.style.minWidth = 'fit-content'
                  label.style.flexShrink = '0'
                  label.style.whiteSpace = 'nowrap'
                  label.style.fontSize = '12px'
                  label.style.display = 'inline-block'
                  label.style.marginRight = '0'
                }
              })

              // 处理金额
              const feeAmounts = clonedElement.querySelectorAll('[class*="feeAmount"]')
              feeAmounts.forEach(amount => {
                if (amount instanceof HTMLElement) {
                  amount.style.whiteSpace = 'nowrap'
                  amount.style.marginRight = '10px'
                  amount.style.fontSize = '12px'
                  amount.style.display = 'inline-block'
                }
              })

              // 处理金额大写
              const feeWords = clonedElement.querySelectorAll('[class*="feeWords"]')
              feeWords.forEach(words => {
                if (words instanceof HTMLElement) {
                  words.style.whiteSpace = 'nowrap'
                  words.style.fontWeight = 'bold'
                  words.style.fontSize = '12px'
                  words.style.display = 'inline-block'
                }
              })
            }
          } else {
            // 处理其他合同类型
            const element = clonedDoc.querySelector('[class*="contractContentInner"]')
            if (element instanceof HTMLElement) {
              clonedElement = element

              // 设置样式确保全部内容可见
              clonedElement.style.overflow = 'visible'
              clonedElement.style.height = 'auto'
              clonedElement.style.minHeight = targetElement.scrollHeight + 'px'
              clonedElement.style.width = '210mm'
              clonedElement.style.minWidth = '210mm'
              clonedElement.style.padding = '0'
              clonedElement.style.margin = '0 auto'
              clonedElement.style.background = '#ffffff'
              clonedElement.style.boxShadow = 'none'
              clonedElement.style.borderRadius = '0'
              clonedElement.style.paddingBottom = '50px' // 增加底部填充

              // 处理所有子元素，确保没有溢出隐藏
              const allElements = clonedElement.querySelectorAll('*')
              allElements.forEach(el => {
                if (el instanceof HTMLElement) {
                  el.style.overflow = 'visible'
                }
              })

              // 处理外层容器
              const wrapperElement = clonedDoc.querySelector('[class*="contractContentWrapper"]')
              if (wrapperElement instanceof HTMLElement) {
                wrapperElement.style.background = '#ffffff'
                wrapperElement.style.padding = '0'
                wrapperElement.style.borderRadius = '0'
                wrapperElement.style.boxShadow = 'none'
                wrapperElement.style.overflow = 'visible'
              }

              // 确保合同组件本身也居中
              const serviceElement = clonedDoc.querySelector('.single-service-agreement-view')
              if (serviceElement instanceof HTMLElement) {
                serviceElement.style.margin = '0 auto'
                serviceElement.style.display = 'block'
                serviceElement.style.pageBreakInside = 'avoid'
              }
            }
          }
        },
      })

      // 将canvas转为blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          blob => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('生成图片失败'))
            }
          },
          'image/png',
          1.0 // 提高质量到最高
        )
      })

      // 创建File对象
      const fileName = `contract_${contractData.id}_${new Date().getTime()}.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      // 上传到服务器
      const uploadResponse = await uploadFile(file, 'contracts')
      const imageFileName = uploadResponse.data.fileName

      // 检查并设置合同签署日期
      const currentDate = new Date().toISOString().split('T')[0] // 当前日期，格式为 YYYY-MM-DD
      const updateData: any = { contractImage: imageFileName }

      // 如果甲方签署日期为空，设置为当前日期
      if (!contractData.partyASignDate) {
        updateData.partyASignDate = currentDate
      }

      // 如果乙方签署日期为空，设置为当前日期
      if (!contractData.partyBSignDate) {
        updateData.partyBSignDate = currentDate
      }

      // 更新合同信息
      await updateContract(contractId, updateData)

      // 生成签署链接
      const tokenResponse = (await generateContractToken(contractId)) as any
      const { token } = tokenResponse.data

      // 生成签署页面链接
      const url = `${window.location.origin}/contract-sign/${token}`
      setSignUrl(url)
      setSignLinkModalVisible(true)

      // 关闭loading提示并显示成功消息
      message.destroy('contractImageGen')
      message.success('签署链接生成成功')
    } catch (error) {
      console.error('生成签署链接失败:', error)
      // 关闭loading提示
      message.destroy('contractImageGen')
      message.error('生成签署链接失败，请重试')
    } finally {
      setIsGeneratingLink(false)
    }
  }

  // 复制链接到剪贴板
  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(signUrl)
      .then(() => message.success('链接已复制到剪贴板'))
      .catch(() => message.error('复制失败，请手动复制'))
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
        return (
          <div id="agency-accounting-agreement-view">
            <AgencyAccountingAgreementView contractData={contractData} />
          </div>
        )
      case '单项服务合同':
        return (
          <div id="single-service-agreement-view">
            <SingleServiceAgreementView contractData={contractData} />
          </div>
        )
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
              <>
                <Button icon={<EditOutlined />} onClick={handleEdit}>
                  编辑合同
                </Button>
                <Button
                  type="primary"
                  icon={<LinkOutlined />}
                  loading={isGeneratingLink}
                  onClick={handleGenerateSignLink}
                >
                  生成签署链接
                </Button>
              </>
            )}
            {contractData && (
              <Button
                icon={<DownloadOutlined />}
                loading={isExporting}
                onClick={handleDownloadContract}
              >
                {isExporting ? '导出中...' : '下载合同'}
              </Button>
            )}
          </Space>
        </div>
      </div>

      {/* 合同基本信息 */}
      {contractData && (
        <Card className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center">
              <span className="text-gray-600 min-w-24">合同编号：</span>
              <span className="font-medium text-blue-600 ml-2">
                {contractData.contractNumber || '未生成'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 min-w-24">签署方：</span>
              <span className="font-medium text-blue-600 ml-2">{contractData.signatory}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 min-w-24">合同类型：</span>
              <span className="font-medium text-green-600 ml-2">{contractData.contractType}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 min-w-24">合同状态：</span>
              <span
                className={`font-medium text-${getContractStatusDisplay(contractData.contractStatus).color}-600 ml-2`}
              >
                {getContractStatusDisplay(contractData.contractStatus).text}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 min-w-24">甲方公司：</span>
              <span className="font-medium ml-2">{contractData.partyACompany || '-'}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 min-w-24">费用总计：</span>
              <span className="font-medium text-red-600 ml-2">
                {contractData.totalCost ? `¥${contractData.totalCost}` : '-'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 min-w-24">提交人：</span>
              <span className="font-medium ml-2">{contractData.submitter || '-'}</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-600 min-w-24">创建时间：</span>
              <span className="font-medium ml-2">
                {contractData.createTime
                  ? new Date(contractData.createTime).toLocaleString()
                  : '未知'}
              </span>
            </div>
            {contractData.contractStatus === '1' && (
              <div className="flex items-center">
                <span className="text-gray-600 min-w-24">签署时间：</span>
                <span className="font-medium ml-2">
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
      <div className={styles.contractContentWrapper} ref={contractContentRef}>
        <div className={styles.contractContentInner}>{renderContractContent()}</div>
      </div>

      {/* 签署链接模态框 */}
      <Modal
        title="合同签署链接"
        open={signLinkModalVisible}
        onCancel={() => setSignLinkModalVisible(false)}
        footer={[
          <Button key="copy" type="primary" onClick={handleCopyLink}>
            复制链接
          </Button>,
          <Button key="close" onClick={() => setSignLinkModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        <div className="py-4">
          <p className="mb-4">请将以下链接发送给对方进行合同签署：</p>
          <Input.TextArea
            value={signUrl}
            readOnly
            rows={3}
            className="mb-2"
            onClick={e => (e.target as HTMLTextAreaElement).select()}
          />
          <p className="text-gray-500 text-sm mt-4">
            提示：链接有效期为30分钟，请及时将链接发送给签署方。
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default ContractDetail
