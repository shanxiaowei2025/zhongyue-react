import React, { useState } from 'react'
import { Modal, Spin, Button, Flex, Radio } from 'antd'
import { useExpenseReceipt } from '../../hooks/useExpense'
import { DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

interface ExpenseReceiptProps {
  visible: boolean
  expenseId: number
  onClose: () => void
}

// 定义印章类型
type SealType = '中岳' | '雄安' | '高碑店' | '脉信' | '金盾' | '如你心意'

const sealImages: Record<SealType, string> = {
  '中岳': '/images/dingxing-zhang.png',
  '雄安': '/images/xiongan-zhang.png',
  '高碑店': '/images/gaobeidian-zhang.png',
  '脉信': '/images/maixin-zhang.png',
  '金盾': '/images/jindun-zhang.png',
  '如你心意': '/images/runixinyi-zhang.png'
}

const ExpenseReceipt: React.FC<ExpenseReceiptProps> = ({ visible, expenseId, onClose }) => {
  const { receipt, isLoading } = useExpenseReceipt(visible ? expenseId : null)
  const [selectedSeal, setSelectedSeal] = useState<SealType>('中岳')

  // 处理保存为图片
  const handleSaveAsImage = () => {
    // 这里使用html2canvas实现
    // 由于需要额外引入库，先用alert代替
    alert('保存为图片功能正在开发中')
  }

  // 处理印章选择变更
  const handleSealChange = (e: any) => {
    setSelectedSeal(e.target.value)
  }

  // 格式化金额为大写
  const formatAmountToChinese = (amount: number): string => {
    if (amount === 0) return '零元整'
    if (!amount) return '零元整'
    
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
    const amountStr = amount.toString()
    
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
    const details = [];
    
    if (receipt?.licenseFee) details.push(`办照费用: ¥${receipt.licenseFee.toFixed(2)}`);
    if (receipt?.brandFee) details.push(`牌子费: ¥${receipt.brandFee.toFixed(2)}`);
    if (receipt?.recordSealFee) details.push(`备案章费用: ¥${receipt.recordSealFee.toFixed(2)}`);
    if (receipt?.generalSealFee) details.push(`一般刻章费用: ¥${receipt.generalSealFee.toFixed(2)}`);
    if (receipt?.agencyFee) details.push(`代理费: ¥${receipt.agencyFee.toFixed(2)}`);
    if (receipt?.accountingSoftwareFee) details.push(`记账软件费: ¥${receipt.accountingSoftwareFee.toFixed(2)}`);
    if (receipt?.addressFee) details.push(`地址费: ¥${receipt.addressFee.toFixed(2)}`);
    if (receipt?.invoiceSoftwareFee) details.push(`发票软件费: ¥${receipt.invoiceSoftwareFee.toFixed(2)}`);
    if (receipt?.socialInsuranceAgencyFee) details.push(`社保代理费: ¥${receipt.socialInsuranceAgencyFee.toFixed(2)}`);
    if (receipt?.statisticalReportFee) details.push(`统计报表费: ¥${receipt.statisticalReportFee.toFixed(2)}`);
    if (receipt?.changeFee) details.push(`变更费: ¥${receipt.changeFee.toFixed(2)}`);
    if (receipt?.administrativeLicenseFee) details.push(`行政许可费: ¥${receipt.administrativeLicenseFee.toFixed(2)}`);
    if (receipt?.otherBusinessFee) details.push(`其他业务费: ¥${receipt.otherBusinessFee.toFixed(2)}`);
    
    if (details.length === 0) return '费用明细';
    
    return details.join('；');
  }

  return (
    <Modal
      title="电子收款收据"
      open={visible}
      onCancel={onClose}
      width={800}
      className="receipt-modal"
      footer={[
        <Button key="close" onClick={onClose}>关闭</Button>,
        <Button 
          key="download" 
          type="primary" 
          icon={<DownloadOutlined />} 
          onClick={handleSaveAsImage}
        >
          保存为图片
        </Button>
      ]}
    >
      {isLoading ? (
        <div className="py-20 text-center">
          <Spin tip="加载中..." />
        </div>
      ) : receipt ? (
        <div className="bg-white receipt-container" id="receipt-printable">
          {/* 收据头部 */}
          <div className="receipt-header">
            <div className="logo-section">
              <img src="/images/logo.png" alt="中岳会计" className="logo-image" />
            </div>
            <div className="title-section">
              <h1 className="receipt-title">电子收款收据</h1>
              <p className="receipt-date">日期: {receipt?.chargeDate ? dayjs(receipt.chargeDate).format('YYYY-MM-DD') : '-'}</p>
            </div>
            <div className="receipt-number">
              <h3>NO. {receipt?.id ? receipt.id.toString().padStart(10, '0') : '0000000000'}</h3>
            </div>
          </div>

          {/* 收据内容 */}
          <div className="receipt-content">
            <table className="receipt-table">
              <tbody>
                <tr>
                  <td className="label-cell">付款单位</td>
                  <td className="value-cell" colSpan={3}>{receipt?.companyName || '-'}</td>
                </tr>
                <tr>
                  <td className="label-cell">款项明细</td>
                  <td className="value-cell" colSpan={3}>{renderFeeDetails()}</td>
                </tr>
                <tr>
                  <td className="label-cell">合计金额</td>
                  <td className="value-cell" colSpan={3}>
                    <div className="amount-row">
                      <span className="amount-chinese">大写：{formatAmountToChinese(receipt?.totalFee || 0)}</span>
                      <span className="amount-digit">小写：¥{receipt?.totalFee?.toFixed(2) || '0.00'}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="label-cell">收款方式</td>
                  <td className="value-cell" colSpan={3}>{receipt?.chargeMethod || '雄安中岳对公户'}</td>
                </tr>
                <tr>
                  <td className="label-cell">备注</td>
                  <td className="value-cell" colSpan={3}>{receipt?.receiptRemarks || receipt?.remarks || '无'}</td>
                </tr>
              </tbody>
            </table>

            {/* 添加公章覆盖在表格上 */}
            <div className="receipt-seal-overlay">
              <img 
                src={sealImages[selectedSeal]} 
                alt="公章" 
                className="seal-image-overlay" 
              />
            </div>
          </div>

          {/* 收款方和印章 */}
          <div className="receipt-footer">
            <div className="receipt-issuer">
              <p className="issuer-title">收款方：</p>
              <p className="issuer-name">定兴县中岳会计服务有限责任公司</p>
            </div>
            <div className="receipt-seal">
              <p className="seal-title">盖章：</p>
            </div>
          </div>

          {/* 印章选择 */}
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

          {/* 添加CSS样式 */}
          <style>{`
            .receipt-container {
              padding: 30px;
              position: relative;
              border: 2px solid #d9d9d9;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              font-family: 'SimSun', serif;
              background-color: #fff;
            }
            
            .receipt-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              padding-bottom: 15px;
              border-bottom: 2px dashed #d9d9d9;
            }
            
            .logo-section {
              display: flex;
              align-items: center;
            }
            
            .logo-image {
              height: 60px;
            }
            
            .title-section {
              text-align: center;
              flex: 1;
              margin: 0 15px;
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
            }
            
            .receipt-number h3 {
              margin: 0;
              color: #d81b60;
              font-size: 18px;
              font-weight: 500;
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
              font-size: 15px;
              line-height: 1.5;
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
            
            /* 印刷样式 */
            @media print {
              .receipt-container {
                padding: 0;
                border: none;
                box-shadow: none;
              }
              
              .seal-selector {
                display: none;
              }
              
              .receipt-table {
                page-break-inside: avoid;
              }
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