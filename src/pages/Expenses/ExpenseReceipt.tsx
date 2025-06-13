import React, { useState, useEffect } from 'react'
import { Modal, Spin, Button, Flex, Radio, AutoComplete, Tag } from 'antd'
import { useExpenseReceipt, getExpenseReceiptKey, useExpenseDetail } from '../../hooks/useExpense'
import { DownloadOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import html2canvas from 'html2canvas'
import { message } from 'antd'
import { mutate } from 'swr'
import MultiFileUpload from '../../components/MultiFileUpload'
import { buildImageUrl } from '../../utils/upload'
import { getContractList } from '../../api/contract'
import ContractLink from '../../components/ContractLink'
import './expenses.css'

interface ExpenseReceiptProps {
  visible: boolean
  expenseId: number
  onClose: () => void
  previewMode?: boolean // 新增预览模式参数
}

// 定义印章类型
type SealType = '中岳' | '雄安' | '高碑店' | '脉信' | '金盾' | '如你心意'

// 定义哪些印章类型需要显示logo
const showLogoSealTypes: SealType[] = ['中岳', '雄安', '高碑店']

const sealImages: Record<SealType, string> = {
  中岳: '/images/dingxing-zhang.png',
  雄安: '/images/xiongan-zhang.png',
  高碑店: '/images/gaobeidian-zhang.png',
  脉信: '/images/maixin-zhang.png',
  金盾: '/images/jindun-zhang.png',
  如你心意: '/images/runixinyi-zhang.png',
}

// 定义不同盖章单位对应的收款方信息
const receiverMap: Record<SealType, string> = {
  中岳: '定兴县中岳会计服务有限责任公司',
  雄安: '定兴县中岳会计服务有限责任公司河北雄安分公司',
  高碑店: '定兴县中岳会计服务有限责任公司高碑店分公司',
  脉信: '保定脉信会计服务有限公司',
  金盾: '定兴县金盾企业管理咨询有限公司',
  如你心意: '保定如你心意企业管理咨询有限公司',
}

const ExpenseReceipt: React.FC<ExpenseReceiptProps> = ({
  visible,
  expenseId,
  onClose,
  previewMode = false,
}) => {
  const { receipt, isLoading } = useExpenseReceipt(
    visible && expenseId ? { id: expenseId } : null
  )
  const { expense, updateExpense, refreshExpenseDetail } = useExpenseDetail(
    visible ? expenseId : null
  )
  const [selectedSeal, setSelectedSeal] = useState<SealType>('中岳')
  const [hasRefreshed, setHasRefreshed] = useState(false)
  const [contractImage, setContractImage] = useState<Array<{ fileName: string; url: string }>>([])
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  // 关联合同搜索状态
  const [contractOptions, setContractOptions] = useState<{ value: string; id: number }[]>([])
  const [contractSearchLoading, setContractSearchLoading] = useState(false)
  const [relatedContracts, setRelatedContracts] = useState<
    { id: number; contractNumber: string }[]
  >([])

  // 在组件显示时刷新数据，但只刷新一次
  useEffect(() => {
    // 只有当模态框打开且有ID且尚未刷新过时才刷新
    if (visible && expenseId && !hasRefreshed) {
      // 自动刷新时不显示消息提示
      refreshReceipt(false)
      setHasRefreshed(true)
    }

    // 当模态框关闭时重置刷新状态
    if (!visible) {
      setHasRefreshed(false)
    }
  }, [visible, expenseId, hasRefreshed])

  // 仅在开发环境下记录日志，并添加条件以避免频繁输出
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && receipt && !isLoading && visible) {
      console.log('收据数据加载完成:', receipt)
      if (receipt.feeItems && receipt.feeItems.length > 0) {
        console.log('费用明细项目:', receipt.feeItems)
      }
    }
  }, [receipt, isLoading, visible])

  // 在组件显示时初始化合同数据 - 从expense数据获取，而不是receipt
  useEffect(() => {
    console.log('ExpenseReceipt - 初始化电子合同数据:', {
      visible,
      expense,
      contractImage: expense?.contractImage,
    })

    if (visible && expense) {
      if (expense.contractImage && expense.contractImage.length > 0) {
        // 处理contractImage数据，可能是字符串数组或单个字符串
        if (Array.isArray(expense.contractImage)) {
          console.log('ExpenseReceipt - 处理数组格式的合同数据:', expense.contractImage)
          setContractImage(
            expense.contractImage.map((fileName: string) => ({
              fileName,
              url: buildImageUrl(fileName),
            }))
          )
        } else if (typeof expense.contractImage === 'string' && expense.contractImage) {
          console.log('ExpenseReceipt - 处理字符串格式的合同数据:', expense.contractImage)
          setContractImage([
            {
              fileName: expense.contractImage,
              url: buildImageUrl(expense.contractImage),
            },
          ])
        } else {
          console.log('ExpenseReceipt - 合同数据格式不正确，清空合同数据')
          setContractImage([])
        }
      } else {
        console.log('ExpenseReceipt - 没有合同数据，清空合同数据')
        setContractImage([])
      }
    } else {
      console.log('ExpenseReceipt - 模态框未显示或expense数据未加载，清空合同数据')
      setContractImage([])
    }
  }, [visible, expense])

  // 在组件显示时初始化关联合同数据
  useEffect(() => {
    console.log('ExpenseReceipt - 初始化关联合同数据:', {
      visible,
      expense,
      relatedContract: expense?.relatedContract,
    })

    if (visible && expense) {
      if (expense.relatedContract && expense.relatedContract.length > 0) {
        setRelatedContracts(expense.relatedContract)
      } else {
        setRelatedContracts([])
      }
    } else {
      setRelatedContracts([])
    }
  }, [visible, expense])

  // 刷新收据数据
  const refreshReceipt = async (showMessage = true) => {
    if (!expenseId) return

    try {
      if (showMessage) {
        message.loading('正在刷新收据数据...', 0.5)
      }

      await mutate(getExpenseReceiptKey({ id: expenseId }))
      // 同时刷新费用详情数据以获取最新的电子合同
      await refreshExpenseDetail()

      if (showMessage) {
        message.success('收据数据已刷新')
      }
    } catch (error) {
      console.error('刷新收据数据失败:', error)
      if (showMessage) {
        message.error('刷新收据数据失败')
      }
    }
  }

  // 处理保存为图片
  const handleSaveAsImage = () => {
    const element = document.getElementById('receipt-printable')
    if (!element) {
      message.error('无法找到收据内容')
      return
    }

    // 获取公司名称用于文件名
    const companyName = receipt?.companyName || '未知企业'
    const receiptId = receipt?.id || 'unknown'
    const fileName = `${companyName.trim()}-收据-${receiptId}.png`

    // 隐藏印章选择器、电子合同上传部分和关联合同部分，以便截图不包含它们
    const sealSelector = element.querySelector('.seal-selector') as HTMLElement
    const contractUploadSection = element.querySelector('.contract-upload-section') as HTMLElement
    const relatedContractSection = element.querySelector('.related-contract-section') as HTMLElement

    const originalSealDisplay = sealSelector ? sealSelector.style.display : ''
    const originalContractDisplay = contractUploadSection ? contractUploadSection.style.display : ''
    const originalRelatedContractDisplay = relatedContractSection
      ? relatedContractSection.style.display
      : ''

    if (sealSelector) {
      sealSelector.style.display = 'none'
    }
    if (contractUploadSection) {
      contractUploadSection.style.display = 'none'
    }
    if (relatedContractSection) {
      relatedContractSection.style.display = 'none'
    }

    // 在导出前临时添加样式修复表格边框
    const exportStyle = document.createElement('style')
    exportStyle.innerHTML = `
      .receipt-printable-export .receipt-table {
        border-collapse: separate !important;
        border-spacing: 0 !important;
        border: 1px solid #000 !important;
      }
      
      .receipt-printable-export .receipt-table td {
        border: none !important;
        border-right: 1px solid #000 !important;
        border-bottom: 1px solid #000 !important;
      }
      
      .receipt-printable-export .receipt-table tr:last-child td {
        border-bottom: 1px solid #000 !important;
      }
      
      .receipt-printable-export .receipt-table tr td:last-child {
        border-right: none !important;
      }
      
      .receipt-printable-export .fee-details-cell {
        padding: 0 !important;
        border: none !important;
      }
      
      .receipt-printable-export .fee-items-table {
        border-collapse: separate !important;
        border-spacing: 0 !important;
        border: none !important;
      }
      
      .receipt-printable-export .fee-items-table th {
        border: none !important;
        border-bottom: 1px solid #e8e8e8 !important;
        background-color: #f9f9f9 !important;
      }
      
      .receipt-printable-export .fee-items-table td {
        border: none !important;
        border-bottom: 1px solid #e8e8e8 !important;
      }
      
      .receipt-printable-export .fee-items-table tr:last-child td {
        border-bottom: none !important;
      }
    `
    document.head.appendChild(exportStyle)
    element.classList.add('receipt-printable-export')

    message.loading('正在生成图片...', 0)

    // 给样式一点应用时间
    setTimeout(() => {
      // 使用html2canvas生成图片
      html2canvas(element, {
        scale: 2, // 提高分辨率
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true, // 允许加载跨域图片
        allowTaint: true,
        onclone: documentClone => {
          // 在克隆的文档中强制应用样式，确保边框正确
          const clonedElement = documentClone.getElementById('receipt-printable')
          if (clonedElement) {
            const receiptTable = documentClone.querySelector('.receipt-table')
            if (receiptTable) {
              ;(receiptTable as HTMLElement).style.border = '1px solid #000'
              ;(receiptTable as HTMLElement).style.borderCollapse = 'separate'
            }

            const tableCells = documentClone.querySelectorAll('.receipt-table td')
            tableCells.forEach(cell => {
              ;(cell as HTMLElement).style.border = 'none'
              ;(cell as HTMLElement).style.borderRight = '1px solid #000'
              ;(cell as HTMLElement).style.borderBottom = '1px solid #000'
            })

            const lastCells = documentClone.querySelectorAll('.receipt-table tr td:last-child')
            lastCells.forEach(cell => {
              ;(cell as HTMLElement).style.borderRight = 'none'
            })
          }
        },
      })
        .then(canvas => {
          // 恢复印章选择器、电子合同上传部分和关联合同部分显示
          if (sealSelector) {
            sealSelector.style.display = originalSealDisplay
          }
          if (contractUploadSection) {
            contractUploadSection.style.display = originalContractDisplay
          }
          if (relatedContractSection) {
            relatedContractSection.style.display = originalRelatedContractDisplay
          }

          // 移除临时样式
          document.head.removeChild(exportStyle)
          element.classList.remove('receipt-printable-export')

          message.destroy() // 清除加载提示

          // 转换为图片并下载
          const imgData = canvas.toDataURL('image/png')
          const link = document.createElement('a')
          link.download = fileName
          link.href = imgData
          link.click()

          message.success('收据图片已保存')
        })
        .catch(err => {
          console.error('生成图片错误:', err)
          message.error('生成图片失败')

          // 恢复印章选择器、电子合同上传部分和关联合同部分显示以及移除临时样式
          if (sealSelector) {
            sealSelector.style.display = originalSealDisplay
          }
          if (contractUploadSection) {
            contractUploadSection.style.display = originalContractDisplay
          }
          if (relatedContractSection) {
            relatedContractSection.style.display = originalRelatedContractDisplay
          }
          if (document.head.contains(exportStyle)) {
            document.head.removeChild(exportStyle)
          }
          element.classList.remove('receipt-printable-export')
        })
    }, 100)
  }

  // 处理印章选择变更
  const handleSealChange = (e: any) => {
    setSelectedSeal(e.target.value)
  }

  // 处理电子合同变更 - 自动保存
  const handleContractChange = async (files: Array<{ fileName: string; url: string }>) => {
    setContractImage(files)

    // 自动保存电子合同
    if (!expenseId) return

    try {
      // 将对象数组转换为文件名数组
      const fileNames = files.map(item => item.fileName)

      await updateExpense(expenseId, {
        contractImage: fileNames,
      })

      message.success('电子合同已自动保存')
      // 刷新收据数据和费用详情数据
      await mutate(getExpenseReceiptKey({ id: expenseId }))
      await refreshExpenseDetail()
    } catch (error) {
      console.error('自动保存电子合同失败:', error)
      message.error('自动保存电子合同失败')
    }
  }

  // 处理文件上传成功
  const handleFileUpload = (fileName: string) => {
    setUploadedFiles(prev => [...prev, fileName])
  }

  // 处理文件删除
  const handleFileRemove = (fileName: string) => {
    setUploadedFiles(prev => prev.filter(name => name !== fileName))
  }

  // 搜索合同
  const searchContract = async (value: string) => {
    if (!value.trim()) {
      setContractOptions([])
      return
    }

    setContractSearchLoading(true)
    try {
      const response = await getContractList({
        page: 1,
        pageSize: 20,
        contractNumber: value.trim(),
      })

      if (response.data.list && response.data.list.length > 0) {
        const options = response.data.list.map((contract: any) => ({
          value: contract.contractNumber,
          id: contract.id,
        }))
        setContractOptions(options)
      } else {
        setContractOptions([])
      }
    } catch (error) {
      console.error('搜索合同失败:', error)
      setContractOptions([])
    } finally {
      setContractSearchLoading(false)
    }
  }

  // 添加关联合同
  const handleAddRelatedContract = (value: string, option: any) => {
    if (!value || !option || !option.id) return

    // 检查是否已存在
    const existingContract = relatedContracts.find(c => c.id === option.id)
    if (existingContract) {
      message.warning('该合同已添加')
      return
    }

    // 添加新合同
    const newContract = {
      id: option.id,
      contractNumber: value,
    }

    const updatedContracts = [...relatedContracts, newContract]
    setRelatedContracts(updatedContracts)

    // 自动保存关联合同
    handleRelatedContractChange(updatedContracts)

    // 清空搜索字段
    setTimeout(() => {
      const searchInput = document.querySelector(
        'input[id="contractSearchReceipt"]'
      ) as HTMLInputElement
      if (searchInput) {
        searchInput.value = ''
      }
    }, 0)
  }

  // 删除关联合同
  const handleRemoveRelatedContract = (id: number) => {
    const updatedContracts = relatedContracts.filter(c => c.id !== id)
    setRelatedContracts(updatedContracts)

    // 自动保存关联合同
    handleRelatedContractChange(updatedContracts)
  }

  // 处理关联合同变更 - 自动保存
  const handleRelatedContractChange = async (
    contracts: { id: number; contractNumber: string }[]
  ) => {
    // 自动保存关联合同
    if (!expenseId) return

    try {
      await updateExpense(expenseId, {
        relatedContract: contracts,
      })

      message.success('关联合同已自动保存')
      // 刷新收据数据和费用详情数据
      await mutate(getExpenseReceiptKey({ id: expenseId }))
      await refreshExpenseDetail()
    } catch (error) {
      console.error('自动保存关联合同失败:', error)
      message.error('自动保存关联合同失败')
    }
  }

  // 格式化金额为大写
  const formatAmountToChinese = (amount: number | string): string => {
    // 确保将任何类型的值转换为数字
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : Number(amount)

    if (numAmount === 0 || isNaN(numAmount)) return '零元整'
    if (!numAmount) return '零元整'

    const cnNums = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
    const cnIntRadice = ['', '拾', '佰', '仟']
    const cnIntUnits = ['', '万', '亿', '兆']
    const cnDecUnits = ['角', '分', '毫', '厘']
    const cnInteger = '整'
    const cnIntLast = '元'

    let integerNum
    let decimalNum
    let chineseStr = ''
    let parts
    let zeroCount = 0

    // 转换为字符串
    const amountStr = numAmount.toString()

    if (amountStr.indexOf('.') === -1) {
      integerNum = amountStr
      decimalNum = ''
    } else {
      parts = amountStr.split('.')
      integerNum = parts[0]
      decimalNum = parts[1].substr(0, 2)
    }

    // 处理整数部分
    if (parseInt(integerNum, 10) > 0) {
      let zeroFlag = false
      const intLen = integerNum.length

      for (let i = 0; i < intLen; i++) {
        const n = integerNum.substr(i, 1)
        const p = intLen - i - 1
        const q = Math.floor(p / 4)
        const m = p % 4

        if (n === '0') {
          zeroCount++
        } else {
          if (zeroCount > 0) {
            chineseStr += cnNums[0]
          }
          zeroCount = 0
          chineseStr += cnNums[parseInt(n)] + cnIntRadice[m]
        }

        if (m === 0 && zeroCount < 4) {
          chineseStr += cnIntUnits[q]
        }
      }

      chineseStr += cnIntLast
    }

    // 处理小数部分
    if (decimalNum !== '') {
      const decLen = decimalNum.length
      for (let i = 0; i < decLen; i++) {
        const n = decimalNum.substr(i, 1)
        if (n !== '0') {
          chineseStr += cnNums[Number(n)] + cnDecUnits[i]
        }
      }
    }

    if (chineseStr === '') {
      chineseStr += cnNums[0] + cnIntLast + cnInteger
    } else if (decimalNum === '' || decimalNum === '0' || decimalNum === '00') {
      chineseStr += cnInteger
    }

    return chineseStr
  }

  // 构建款项明细
  const renderFeeDetails = () => {
    // 首先尝试使用新的feeItems数组（如果存在）
    if (receipt?.feeItems && receipt.feeItems.length > 0) {
      // 返回HTML表格而不是字符串数组，让每个费用项独立成行
      return (
        <table className="fee-items-table">
          <thead>
            <tr>
              <th style={{ padding: '8px 6px', textAlign: 'left', width: '50%' }}>费用项目</th>
              <th style={{ padding: '8px 6px', textAlign: 'right', width: '20%' }}>金额</th>
              <th style={{ padding: '8px 6px', textAlign: 'center', width: '30%' }}>日期范围</th>
            </tr>
          </thead>
          <tbody>
            {receipt.feeItems
              .map((item, index) => {
                // 确保将任何类型的值转换为数字
                const numValue =
                  typeof item.amount === 'string' ? parseFloat(item.amount) : Number(item.amount)

                if (
                  item.name &&
                  numValue !== undefined &&
                  numValue !== null &&
                  !isNaN(numValue) &&
                  numValue > 0
                ) {
                  // 处理日期显示
                  let dateRangeText = '—'
                  if (item.startDate && item.endDate) {
                    dateRangeText = `${dayjs(item.startDate).format('YYYY-MM-DD')} 至 ${dayjs(item.endDate).format('YYYY-MM-DD')}`
                  } else if (item.startDate) {
                    dateRangeText = `从 ${dayjs(item.startDate).format('YYYY-MM-DD')} 起`
                  } else if (item.endDate) {
                    dateRangeText = `至 ${dayjs(item.endDate).format('YYYY-MM-DD')}`
                  }

                  return (
                    <tr key={index}>
                      <td style={{ padding: '8px 6px', textAlign: 'left' }}>{item.name}</td>
                      <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 'bold' }}>
                        ¥{numValue.toFixed(2)}
                      </td>
                      <td
                        style={{
                          padding: '8px 6px',
                          textAlign: 'center',
                        }}
                      >
                        {dateRangeText}
                      </td>
                    </tr>
                  )
                }
                return null
              })
              .filter(Boolean)}
          </tbody>
        </table>
      )
    } else {
      // 回退到旧的单独费用字段（为了向后兼容）
      const details: string[] = []

      // 添加安全检查，确保金额存在且是数字
      const addFeeItem = (label: string, value?: number | string) => {
        if (value !== undefined && value !== null) {
          // 确保将任何类型的值转换为数字
          const numValue = typeof value === 'string' ? parseFloat(value) : Number(value)
          if (!isNaN(numValue) && numValue > 0) {
            details.push(`${label}: ¥${numValue.toFixed(2)}`)
          }
        }
      }

      addFeeItem('办照费用', receipt?.licenseFee)
      addFeeItem('牌子费', receipt?.brandFee)
      addFeeItem('备案章费用', receipt?.recordSealFee)
      addFeeItem('一般刻章费用', receipt?.generalSealFee)
      addFeeItem('代理费', receipt?.agencyFee)
      addFeeItem('记账软件费', receipt?.accountingSoftwareFee)
      addFeeItem('地址费', receipt?.addressFee)
      addFeeItem('发票软件费', receipt?.invoiceSoftwareFee)
      addFeeItem('社保代理费', receipt?.socialInsuranceAgencyFee)
      addFeeItem('统计报表费', receipt?.statisticalReportFee)
      addFeeItem('变更费', receipt?.changeFee)
      addFeeItem('行政许可费', receipt?.administrativeLicenseFee)
      addFeeItem('其他业务费', receipt?.otherBusinessFee)

      if (details.length === 0) return '费用明细'

      return details.join('；')
    }
  }

  // 判断当前选择的印章是否需要显示logo
  const shouldShowLogo = showLogoSealTypes.includes(selectedSeal)

  return (
    <Modal
      title={previewMode ? '预览收据' : '电子收款收据'}
      open={visible}
      onCancel={onClose}
      width={1200}
      className="receipt-modal"
      footer={
        previewMode
          ? [
              <Button key="close" onClick={onClose}>
                关闭
              </Button>,
            ]
          : [
              <Button key="refresh" onClick={() => refreshReceipt(true)} icon={<ReloadOutlined />}>
                刷新数据
              </Button>,
              <Button key="close" onClick={onClose}>
                关闭
              </Button>,
              <Button
                key="download"
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleSaveAsImage}
              >
                保存为图片
              </Button>,
            ]
      }
    >
      {isLoading ? (
        <div className="py-20 text-center">
          <Spin tip="加载中..." />
        </div>
      ) : receipt ? (
        <div
          className={`bg-white receipt-container receipt-document${previewMode ? ' preview-mode' : ''}`}
          id="receipt-printable"
        >
          {/* 收据头部 - 根据是否显示logo使用不同的布局方式 */}
          {shouldShowLogo ? (
            // 当显示logo时，使用三栏布局，但确保标题居中
            <div className="receipt-header" style={{ position: 'relative' }}>
              <div
                className="logo-section"
                style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }}
              >
                <img src="/images/logo.png" alt="中岳会计" className="logo-image" />
              </div>
              <div
                className="title-section"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  margin: '0 auto',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <h1 className="receipt-title">电子收款收据</h1>
                <p className="receipt-date">
                  日期: {receipt?.chargeDate ? dayjs(receipt.chargeDate).format('YYYY-MM-DD') : '-'}
                </p>
              </div>
              <div
                className="receipt-number"
                style={{
                  position: 'absolute',
                  right: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <h3>
                  NO.{' '}
                  {receipt?.receiptNo ||
                    (receipt?.id ? receipt.id.toString().padStart(10, '0') : '0000000000')}
                </h3>
              </div>
            </div>
          ) : (
            // 当不显示logo时，使用单栏布局，标题完全居中
            <div className="receipt-header" style={{ display: 'block', position: 'relative' }}>
              <div
                className="title-section"
                style={{
                  width: '100%',
                  textAlign: 'center',
                  margin: '0 auto',
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <h1 className="receipt-title">电子收款收据</h1>
                <p className="receipt-date">
                  日期: {receipt?.chargeDate ? dayjs(receipt.chargeDate).format('YYYY-MM-DD') : '-'}
                </p>
              </div>
              <div
                className="receipt-number"
                style={{
                  position: 'absolute',
                  right: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              >
                <h3>
                  NO.{' '}
                  {receipt?.receiptNo ||
                    (receipt?.id ? receipt.id.toString().padStart(10, '0') : '0000000000')}
                </h3>
              </div>
            </div>
          )}

          {/* 收据内容 */}
          <div className="receipt-content">
            <table className="receipt-table">
              <tbody>
                <tr>
                  <td className="label-cell">付款单位</td>
                  <td className="value-cell" colSpan={3}>
                    {receipt?.companyName || '-'}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">款项明细</td>
                  <td className="value-cell fee-details-cell" colSpan={3}>
                    {renderFeeDetails()}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">合计金额</td>
                  <td className="value-cell" colSpan={3}>
                    <div className="amount-row">
                      <span className="amount-chinese">
                        大写：{formatAmountToChinese(receipt?.totalFee || 0)}
                      </span>
                      <span className="amount-digit">
                        小写：¥
                        {receipt?.totalFee
                          ? typeof receipt.totalFee === 'string'
                            ? parseFloat(receipt.totalFee).toFixed(2)
                            : Number(receipt.totalFee).toFixed(2)
                          : '0.00'}
                      </span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">收款方式</td>
                  <td className="value-cell" colSpan={3}>
                    {receipt?.chargeMethod || '雄安中岳对公户'}
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">备注</td>
                  <td className="value-cell" colSpan={3}>
                    {receipt?.receiptRemarks || receipt?.remarks || '无'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 添加公章覆盖在表格上 */}
            <div className="receipt-seal-overlay">
              <img src={sealImages[selectedSeal]} alt="公章" className="seal-image-overlay" />
            </div>
          </div>

          {/* 收款方和印章 */}
          <div className="receipt-footer">
            <div className="receipt-issuer">
              <p className="issuer-title">收款方：</p>
              <p className="issuer-name">{receiverMap[selectedSeal]}</p>
            </div>
            <div className="receipt-seal">
              <p className="seal-title">盖章：</p>
            </div>
          </div>

          {/* 印章选择 - 在预览模式下不显示 */}
          {!previewMode && (
            <div className="seal-selector">
              <p>选择盖章单位：</p>
              <Radio.Group onChange={handleSealChange} value={selectedSeal}>
                <Radio.Button value="中岳">中岳</Radio.Button>
                <Radio.Button value="雄安">雄安</Radio.Button>
                <Radio.Button value="高碑店">高碑店</Radio.Button>
                <Radio.Button value="脉信">脉信</Radio.Button>
                <Radio.Button value="金盾">金盾</Radio.Button>
                <Radio.Button value="如你心意">如你心意</Radio.Button>
              </Radio.Group>
            </div>
          )}

          {/* 电子合同上传 - 在预览模式下不显示 */}
          {!previewMode && (
            <div
              className="contract-upload-section"
              style={{ marginTop: '20px', borderTop: '2px dashed #d9d9d9', paddingTop: '15px' }}
            >
              <p style={{ marginBottom: '15px', fontWeight: '600', fontSize: '15px' }}>
                电子合同：
              </p>
              <MultiFileUpload
                label="电子合同"
                value={contractImage}
                onChange={handleContractChange}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                onFileUpload={handleFileUpload}
                onFileRemove={handleFileRemove}
              />
            </div>
          )}

          {/* 关联合同 - 在预览模式下不显示 */}
          {!previewMode && (
            <div
              className="related-contract-section"
              style={{ marginTop: '20px', borderTop: '2px dashed #d9d9d9', paddingTop: '15px' }}
            >
              <p style={{ marginBottom: '15px', fontWeight: '600', fontSize: '15px' }}>
                关联合同：
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AutoComplete
                    id="contractSearchReceipt"
                    style={{ width: '100%' }}
                    placeholder="输入合同编号搜索"
                    onSearch={searchContract}
                    onSelect={handleAddRelatedContract}
                    options={contractOptions}
                    notFoundContent={
                      contractSearchLoading ? (
                        <div className="text-center py-2">
                          <Spin size="small" />
                        </div>
                      ) : null
                    }
                  />
                  <Button
                    type="primary"
                    icon={<SearchOutlined />}
                    loading={contractSearchLoading}
                    onClick={() => {
                      const input = document.querySelector(
                        'input[id="contractSearchReceipt"]'
                      ) as HTMLInputElement
                      if (input && input.value) {
                        searchContract(input.value)
                      }
                    }}
                  >
                    搜索
                  </Button>
                </div>
                {relatedContracts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {relatedContracts.map(contract => (
                      <Tag
                        key={contract.id}
                        closable
                        onClose={() => handleRemoveRelatedContract(contract.id)}
                        className="relative"
                      >
                        <ContractLink contractId={contract.id} className="related-contract-link">
                          {contract.contractNumber}
                        </ContractLink>
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 预览水印 */}
          {previewMode && (
            <div className="receipt-watermark">
              <div className="watermark-grid">
                {[...Array(25)].map((_, i) => (
                  <div key={i} className="watermark-item">
                    预览图片，收据无效
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 添加CSS样式 */}
          <style>{`
            .receipt-container {
              padding: 30px;
              position: relative;
              border: 2px solid #d9d9d9;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              background-color: #fff;
            }
            
            .receipt-header {
              display: block;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 2px dashed #d9d9d9;
              min-height: 90px;
              position: relative;
            }
            
            .logo-section {
              display: flex;
              align-items: center;
              z-index: 1;
            }
            
            .logo-image {
              height: 60px;
            }
            
            .title-section {
              text-align: center;
              z-index: 0;
            }
            
            .receipt-title {
              margin: 0 0 8px 0;
              font-size: 28px;
              font-weight: bold;
              color: #333;
              letter-spacing: 2px;
            }
            
            .receipt-date {
              margin: 0;
              color: #666;
              font-size: 15px;
            }
            
            .receipt-number {
              text-align: right;
              z-index: 1;
            }
            
            .receipt-number h3 {
              margin: 0;
              color: #d81b60;
              font-size: 18px;
              font-weight: 500;
              white-space: nowrap;
            }
            
            .receipt-content {
              margin-bottom: 10px;
              position: relative; /* 为覆盖公章定位提供参考 */
            }
            
            .receipt-table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #000;
              position: relative; /* 确保z-index正常工作 */
              z-index: 1;
            }
            
            .receipt-table td {
              border: 1px solid #000;
              padding: 12px 15px;
              font-size: 13px;
              line-height: 1;
            }
            
            .label-cell {
              background-color: #f8f8f8;
              width: 120px;
              font-weight: 600;
              text-align: center;
              vertical-align: middle;
            }
            
            .value-cell {
              background-color: #fff;
              text-align: left;
              min-height: 24px;
            }
            
            .amount-row {
              display: flex;
              justify-content: space-between;
              font-weight: 600;
            }
            
            .amount-chinese {
              color: #333;
              font-size: 16px;
            }
            
            .amount-digit {
              color: #d81b60;
              font-size: 16px;
            }
            
            .receipt-seal-overlay {
              position: absolute;
              bottom: -80px;
              right: 0px;
              z-index: 10;
            }
            
            .seal-image-overlay {
              width: 130px;
              height: 130px;
              object-fit: contain;
              opacity: 0.8;
              transform: translateY(20px);
            }
            
            .receipt-footer {
              display: flex;
              justify-content: space-between;
              margin-bottom: 30px;
              padding-top: 10px;
              position: relative;
            }
            
            .receipt-issuer {
              position: relative;
              max-width: 60%;
            }
            
            .issuer-title {
              margin: 0 0 5px 0;
              font-weight: 600;
              font-size: 15px;
            }
            
            .issuer-name {
              margin: 0;
              font-size: 15px;
            }
            
            .receipt-seal {
              position: relative;
              text-align: right;
              min-height: 40px;
              right: 130px;
            }
            
            .seal-title {
              margin: 0;
              font-weight: 600;
              font-size: 15px;
              text-align: left;
            }
            
            .seal-selector {
              margin-top: 40px;
              padding-top: 15px;
              border-top: 2px dashed #d9d9d9;
            }
            
            /* 费用明细表格样式 */
            .fee-details-cell {
              padding: 0 !important;
              border: none !important;
            }
            
            .fee-items-table {
              border-spacing: 0;
              width: 100%;
              border-collapse: collapse;
              border: none;
            }
            
            .fee-items-table th, 
            .fee-items-table td {
              border: none;
              border-bottom: 1px solid #e8e8e8;
            }
            
            .fee-items-table th {
              background-color: #f9f9f9;
              font-weight: normal;
              color: #666;
              font-size: 13px;
            }
            
            .fee-items-table tr:last-child td {
              border-bottom: none;
            }
            
            /* 水印样式 */
            .receipt-watermark {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              pointer-events: none;
              z-index: 100;
              display: flex;
              justify-content: center;
              align-items: center;
              overflow: hidden;
            }
            
            .watermark-content {
              transform: rotate(-45deg);
              color: rgba(255, 0, 0, 0.15);
              font-size: 72px;
              font-weight: bold;
              text-align: center;
              white-space: nowrap;
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              pointer-events: none;
              user-select: none;
            }
            
            /* 印刷样式 */
            @media print {
              .receipt-container {
                padding: 0;
                border: none;
                box-shadow: none;
              }
              
              .seal-selector,
              .receipt-watermark {
                display: none;
              }
              
              .receipt-table {
                page-break-inside: avoid;
              }
            }

            .receipt-container.preview-mode {
              pointer-events: none;
              user-select: none;
            }
          `}</style>
        </div>
      ) : (
        <div className="py-10 text-center">
          <p>未找到收据信息</p>
        </div>
      )}
    </Modal>
  )
}

export default ExpenseReceipt
