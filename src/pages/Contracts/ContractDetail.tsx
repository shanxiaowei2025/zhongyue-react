import React, { useEffect, useState, useRef } from 'react'
import { Card, Button, Space, Breadcrumb, Alert, Spin, Divider, Typography, message, Modal, Input } from 'antd'
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
      img.onerror = (e) => {
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
    if (params.get('generateLink') === 'true' && contractData && contractData.contractStatus === '0') {
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
      await Promise.all(Array.from(images).map(async (img) => {
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
      }))
      
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
            partyCompanyName.style.whiteSpace = 'nowrap'
            partyCompanyName.style.overflow = 'visible'
            partyCompanyName.style.textOverflow = 'ellipsis'
          }
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
      
      // 如果是产品服务协议，则只获取产品服务协议元素
      if (contractData.contractType === '产品服务协议') {
        const agreementElement = contractContentRef.current.querySelector('.product-service-agreement')
        if (agreementElement && agreementElement instanceof HTMLElement) {
          targetElement = agreementElement
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
        onclone: async (clonedDoc) => {
          // 获取克隆的目标元素
          let clonedElement: HTMLElement | null = null
          
          if (contractData.contractType === '产品服务协议') {
            const element = clonedDoc.querySelector('.product-service-agreement')
            if (element instanceof HTMLElement) {
              clonedElement = element
              
              // 保持产品服务协议原样，只添加关键样式确保正确生成
              clonedElement.style.overflow = 'visible';
              clonedElement.style.pageBreakInside = 'avoid';
              clonedElement.style.paddingBottom = '50px'; // 增加底部填充
              
              // 修复甲方乙方布局问题
              const partyHeaders = clonedElement.querySelectorAll('.party-header')
              partyHeaders.forEach(header => {
                if (header instanceof HTMLElement) {
                  console.log('修复甲方乙方布局 - 克隆文档')
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
                    partyCompanyName.style.whiteSpace = 'nowrap'
                    partyCompanyName.style.overflow = 'visible'
                    partyCompanyName.style.textOverflow = 'ellipsis'
                  }
                }
              })
              
              // 设置服务项目样式
              const serviceItemsTexts = clonedElement.querySelectorAll('.service-items-text')
              serviceItemsTexts.forEach(itemsText => {
                if (itemsText instanceof HTMLElement) {
                  console.log('应用服务项目文本样式 - 克隆文档')
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
              
              // 确保页脚元素可见
              const footerElement = clonedElement.querySelector('.contract-footer')
              if (footerElement instanceof HTMLElement) {
                footerElement.style.display = 'block'
                footerElement.style.visibility = 'visible'
                footerElement.style.position = 'relative' // 确保正常文档流
                footerElement.style.marginTop = '30px'
                footerElement.style.paddingTop = '20px'
                footerElement.style.borderTop = '1px solid #ddd'
                footerElement.style.pageBreakInside = 'avoid'
                
                // 确保页脚内的文本元素可见
                const footerTexts = footerElement.querySelectorAll('p')
                footerTexts.forEach(p => {
                  if (p instanceof HTMLElement) {
                    p.style.display = 'block'
                    p.style.visibility = 'visible'
                    p.style.margin = '8px 0'
                    p.style.fontSize = '12px'
                    p.style.lineHeight = '1.4'
                    p.style.color = '#333'
                    p.style.fontFamily = "'SourceHanSerifCN', '思源宋体', serif"
                  }
                })
              }
              
              // 确保签署区域的左右布局
              const signatureSection = clonedElement.querySelector('.signature-section');
              if (signatureSection instanceof HTMLElement) {
                signatureSection.style.marginTop = '50px';
                signatureSection.style.marginBottom = '30px';
                signatureSection.style.pageBreakInside = 'avoid';
              }
              
              const signatureRow = clonedElement.querySelector('.signature-row');
              if (signatureRow instanceof HTMLElement) {
                signatureRow.style.display = 'flex';
                signatureRow.style.flexDirection = 'row';
                signatureRow.style.justifyContent = 'space-between';
                signatureRow.style.alignItems = 'flex-start';
                signatureRow.style.marginBottom = '20px';
                signatureRow.style.width = '100%';
              }
              
              const signatureColumns = clonedElement.querySelectorAll('.signature-column');
              signatureColumns.forEach((column, index) => {
                if (column instanceof HTMLElement) {
                  column.style.display = 'flex';
                  column.style.flexDirection = 'column';
                  column.style.width = '48%';
                  column.style.gap = '45px';
                  column.style.maxWidth = '48%';
                  column.style.boxSizing = 'border-box';
                }
              });

              // 确保费用总计部分的样式正确
              const totalCostSection = clonedElement.querySelector('.total-cost');
              if (totalCostSection instanceof HTMLElement) {
                console.log('应用费用总计样式');
                
                // 设置总体容器样式
                totalCostSection.style.marginTop = '20px';
                totalCostSection.style.paddingTop = '15px';
                totalCostSection.style.borderTop = '1px solid #ddd';
                
                // 设置费用金额行样式
                const costAmountRow = totalCostSection.querySelector('.cost-amount-row');
                if (costAmountRow instanceof HTMLElement) {
                  costAmountRow.style.display = 'flex';
                  costAmountRow.style.alignItems = 'center';
                  costAmountRow.style.gap = '5px';
                  costAmountRow.style.flexWrap = 'nowrap';
                  costAmountRow.style.whiteSpace = 'nowrap';
                  costAmountRow.style.width = '100%';
                  costAmountRow.style.marginBottom = '8px';
                  costAmountRow.style.overflow = 'visible';
                  
                  // 确保所有span元素正确显示
                  const spans = costAmountRow.querySelectorAll('span');
                  spans.forEach(span => {
                    if (span instanceof HTMLElement) {
                      span.style.display = 'inline-block';
                      span.style.whiteSpace = 'nowrap';
                      span.style.fontSize = '13px';
                      span.style.fontWeight = 'bold';
                      span.style.fontFamily = "'SourceHanSerifCN', '思源宋体', serif";
                    }
                  });
                  
                  // 特别处理金额标签和金额值
                  const amountLabel = costAmountRow.querySelector('.amount-label');
                  if (amountLabel instanceof HTMLElement) {
                    amountLabel.style.marginLeft = '10px';
                    amountLabel.style.marginRight = '5px';
                    amountLabel.style.whiteSpace = 'nowrap';
                    amountLabel.style.fontSize = '13px';
                    amountLabel.style.fontWeight = 'bold';
                  }
                  
                  // 处理金额值
                  const amountValue = costAmountRow.querySelector('.amount-value');
                  if (amountValue instanceof HTMLElement) {
                    amountValue.style.fontSize = '13px';
                    amountValue.style.fontWeight = 'bold';
                  }
                  
                  // 处理大写金额值
                  const amountTextValue = costAmountRow.querySelector('.amount-text-value');
                  if (amountTextValue instanceof HTMLElement) {
                    amountTextValue.style.fontSize = '13px';
                    amountTextValue.style.fontWeight = 'bold';
                  }
                }
                
                // 设置备注行样式
                const costRemark = totalCostSection.querySelector('.cost-remark');
                if (costRemark instanceof HTMLElement) {
                  costRemark.style.display = 'flex';
                  costRemark.style.alignItems = 'flex-start';
                  costRemark.style.gap = '5px';
                  costRemark.style.marginTop = '5px';
                  costRemark.style.flexWrap = 'wrap';
                  
                  // 处理所有span元素
                  const spans = costRemark.querySelectorAll('span');
                  spans.forEach(span => {
                    if (span instanceof HTMLElement) {
                      span.style.fontSize = '13px';
                      span.style.fontWeight = 'bold';
                      span.style.fontFamily = "'SourceHanSerifCN', '思源宋体', serif";
                    }
                  });
                  
                  // 确保备注内容可以换行
                  const remarkValue = costRemark.querySelector('.remark-value');
                  if (remarkValue instanceof HTMLElement) {
                    remarkValue.style.wordBreak = 'break-word';
                    remarkValue.style.whiteSpace = 'normal';
                    remarkValue.style.fontSize = '13px';
                    remarkValue.style.fontWeight = 'bold';
                  }
                }
              }
            }
          } else {
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
              const accountingElement = clonedDoc.querySelector('.agency-accounting-agreement-view')
              if (accountingElement instanceof HTMLElement) {
                accountingElement.style.margin = '0 auto'
                accountingElement.style.display = 'block'
                accountingElement.style.pageBreakInside = 'avoid'
              }
              
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
      
      // 如果是产品服务协议，则只获取产品服务协议元素
      if (contractData.contractType === '产品服务协议') {
        const agreementElement = contractContentRef.current.querySelector('.product-service-agreement')
        if (agreementElement && agreementElement instanceof HTMLElement) {
          targetElement = agreementElement
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
        onclone: async (clonedDoc) => {
          // 获取克隆的目标元素
          let clonedElement: HTMLElement | null = null
          
          if (contractData.contractType === '产品服务协议') {
            const element = clonedDoc.querySelector('.product-service-agreement')
            if (element instanceof HTMLElement) {
              clonedElement = element
              
              // 保持产品服务协议原样，只添加关键样式确保正确生成
              clonedElement.style.overflow = 'visible';
              clonedElement.style.pageBreakInside = 'avoid';
              clonedElement.style.paddingBottom = '50px'; // 增加底部填充
              
              // 修复甲方乙方布局问题
              const partyHeaders = clonedElement.querySelectorAll('.party-header')
              partyHeaders.forEach(header => {
                if (header instanceof HTMLElement) {
                  console.log('修复甲方乙方布局 - 克隆文档')
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
                    partyCompanyName.style.whiteSpace = 'nowrap'
                    partyCompanyName.style.overflow = 'visible'
                    partyCompanyName.style.textOverflow = 'ellipsis'
                  }
                }
              })
              
              // 设置服务项目样式
              const serviceItemsTexts = clonedElement.querySelectorAll('.service-items-text')
              serviceItemsTexts.forEach(itemsText => {
                if (itemsText instanceof HTMLElement) {
                  console.log('应用服务项目文本样式 - 克隆文档')
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
              
              // 确保页脚元素可见
              const footerElement = clonedElement.querySelector('.contract-footer')
              if (footerElement instanceof HTMLElement) {
                footerElement.style.display = 'block'
                footerElement.style.visibility = 'visible'
                footerElement.style.position = 'relative' // 确保正常文档流
                footerElement.style.marginTop = '30px'
                footerElement.style.paddingTop = '20px'
                footerElement.style.borderTop = '1px solid #ddd'
                footerElement.style.pageBreakInside = 'avoid'
                
                // 确保页脚内的文本元素可见
                const footerTexts = footerElement.querySelectorAll('p')
                footerTexts.forEach(p => {
                  if (p instanceof HTMLElement) {
                    p.style.display = 'block'
                    p.style.visibility = 'visible'
                    p.style.margin = '8px 0'
                    p.style.fontSize = '12px'
                    p.style.lineHeight = '1.4'
                    p.style.color = '#333'
                    p.style.fontFamily = "'SourceHanSerifCN', '思源宋体', serif"
                  }
                })
              }
              
              // 确保签署区域的左右布局
              const signatureSection = clonedElement.querySelector('.signature-section');
              if (signatureSection instanceof HTMLElement) {
                signatureSection.style.marginTop = '50px';
                signatureSection.style.marginBottom = '30px';
                signatureSection.style.pageBreakInside = 'avoid';
              }
              
              const signatureRow = clonedElement.querySelector('.signature-row');
              if (signatureRow instanceof HTMLElement) {
                signatureRow.style.display = 'flex';
                signatureRow.style.flexDirection = 'row';
                signatureRow.style.justifyContent = 'space-between';
                signatureRow.style.alignItems = 'flex-start';
                signatureRow.style.marginBottom = '20px';
                signatureRow.style.width = '100%';
              }
              
              const signatureColumns = clonedElement.querySelectorAll('.signature-column');
              signatureColumns.forEach((column, index) => {
                if (column instanceof HTMLElement) {
                  column.style.display = 'flex';
                  column.style.flexDirection = 'column';
                  column.style.width = '48%';
                  column.style.gap = '45px';
                  column.style.maxWidth = '48%';
                  column.style.boxSizing = 'border-box';
                }
              });

              // 确保费用总计部分的样式正确
              const totalCostSection = clonedElement.querySelector('.total-cost');
              if (totalCostSection instanceof HTMLElement) {
                console.log('应用费用总计样式');
                
                // 设置总体容器样式
                totalCostSection.style.marginTop = '20px';
                totalCostSection.style.paddingTop = '15px';
                totalCostSection.style.borderTop = '1px solid #ddd';
                
                // 设置费用金额行样式
                const costAmountRow = totalCostSection.querySelector('.cost-amount-row');
                if (costAmountRow instanceof HTMLElement) {
                  costAmountRow.style.display = 'flex';
                  costAmountRow.style.alignItems = 'center';
                  costAmountRow.style.gap = '5px';
                  costAmountRow.style.flexWrap = 'nowrap';
                  costAmountRow.style.whiteSpace = 'nowrap';
                  costAmountRow.style.width = '100%';
                  costAmountRow.style.marginBottom = '8px';
                  costAmountRow.style.overflow = 'visible';
                  
                  // 确保所有span元素正确显示
                  const spans = costAmountRow.querySelectorAll('span');
                  spans.forEach(span => {
                    if (span instanceof HTMLElement) {
                      span.style.display = 'inline-block';
                      span.style.whiteSpace = 'nowrap';
                      span.style.fontSize = '13px';
                      span.style.fontWeight = 'bold';
                      span.style.fontFamily = "'SourceHanSerifCN', '思源宋体', serif";
                    }
                  });
                  
                  // 特别处理金额标签和金额值
                  const amountLabel = costAmountRow.querySelector('.amount-label');
                  if (amountLabel instanceof HTMLElement) {
                    amountLabel.style.marginLeft = '10px';
                    amountLabel.style.marginRight = '5px';
                    amountLabel.style.whiteSpace = 'nowrap';
                    amountLabel.style.fontSize = '13px';
                    amountLabel.style.fontWeight = 'bold';
                  }
                  
                  // 处理金额值
                  const amountValue = costAmountRow.querySelector('.amount-value');
                  if (amountValue instanceof HTMLElement) {
                    amountValue.style.fontSize = '13px';
                    amountValue.style.fontWeight = 'bold';
                  }
                  
                  // 处理大写金额值
                  const amountTextValue = costAmountRow.querySelector('.amount-text-value');
                  if (amountTextValue instanceof HTMLElement) {
                    amountTextValue.style.fontSize = '13px';
                    amountTextValue.style.fontWeight = 'bold';
                  }
                }
                
                // 设置备注行样式
                const costRemark = totalCostSection.querySelector('.cost-remark');
                if (costRemark instanceof HTMLElement) {
                  costRemark.style.display = 'flex';
                  costRemark.style.alignItems = 'flex-start';
                  costRemark.style.gap = '5px';
                  costRemark.style.marginTop = '5px';
                  costRemark.style.flexWrap = 'wrap';
                  
                  // 处理所有span元素
                  const spans = costRemark.querySelectorAll('span');
                  spans.forEach(span => {
                    if (span instanceof HTMLElement) {
                      span.style.fontSize = '13px';
                      span.style.fontWeight = 'bold';
                      span.style.fontFamily = "'SourceHanSerifCN', '思源宋体', serif";
                    }
                  });
                  
                  // 确保备注内容可以换行
                  const remarkValue = costRemark.querySelector('.remark-value');
                  if (remarkValue instanceof HTMLElement) {
                    remarkValue.style.wordBreak = 'break-word';
                    remarkValue.style.whiteSpace = 'normal';
                    remarkValue.style.fontSize = '13px';
                    remarkValue.style.fontWeight = 'bold';
                  }
                }
              }
            }
          } else {
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
              const accountingElement = clonedDoc.querySelector('.agency-accounting-agreement-view')
              if (accountingElement instanceof HTMLElement) {
                accountingElement.style.margin = '0 auto'
                accountingElement.style.display = 'block'
                accountingElement.style.pageBreakInside = 'avoid'
              }
              
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
      const imageUrl = uploadResponse.data.url

      // 检查并设置合同签署日期
      const currentDate = new Date().toISOString().split('T')[0] // 当前日期，格式为 YYYY-MM-DD
      const updateData: any = { contractImage: imageUrl }

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
              <>
                <Button
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                >
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
        className={styles.contractContentWrapper}
        ref={contractContentRef}
      >
        <div className={styles.contractContentInner}>
          {renderContractContent()}
        </div>
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
            onClick={(e) => (e.target as HTMLTextAreaElement).select()}
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
