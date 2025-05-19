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
  '中岳': '/images/zhongyue-zhang.png',
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
        <div className="bg-white p-8 border rounded-md shadow-sm relative">
          {/* 收据头部 */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center">
              <img 
                src="/images/logo.png" 
                alt="中岳会计" 
                className="h-16 mr-4" 
              />
              <div>
                <h2 className="text-xl font-semibold text-red-600">中岳会计</h2>
                <p className="text-gray-500">Zhongyue Accounting</p>
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">电子收款收据</h1>
              <p className="text-gray-500">日期: {receipt.chargeDate ? dayjs(receipt.chargeDate).format('YYYY-MM-DD') : '-'}</p>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-semibold text-red-600">NO. {receipt.id.toString().padStart(12, '0')}</h3>
            </div>
          </div>

          {/* 收据内容 */}
          <table className="w-full border-collapse mb-8">
            <tbody>
              <tr className="border border-gray-300">
                <td className="border border-gray-300 p-3 bg-gray-50 w-1/6 font-medium">付款单位</td>
                <td className="border border-gray-300 p-3" colSpan={3}>{receipt.companyName || '-'}</td>
              </tr>
              <tr className="border border-gray-300">
                <td className="border border-gray-300 p-3 bg-gray-50 font-medium">款项明细</td>
                <td className="border border-gray-300 p-3" colSpan={3}></td>
              </tr>
              <tr className="border border-gray-300">
                <td className="border border-gray-300 p-3 bg-gray-50 font-medium">合计金额</td>
                <td className="border border-gray-300 p-3" colSpan={3}>
                  <div className="flex justify-between">
                    <span>大写：{formatAmountToChinese(receipt.totalFee || 0)}</span>
                    <span>小写：¥{receipt.totalFee?.toFixed(2) || '0.00'}</span>
                  </div>
                </td>
              </tr>
              <tr className="border border-gray-300">
                <td className="border border-gray-300 p-3 bg-gray-50 font-medium">收款方式</td>
                <td className="border border-gray-300 p-3" colSpan={3}>{receipt.chargeMethod || '雄安中岳对公户'}</td>
              </tr>
              <tr className="border border-gray-300">
                <td className="border border-gray-300 p-3 bg-gray-50 font-medium">备注</td>
                <td className="border border-gray-300 p-3" colSpan={3}>{receipt.remarks || '无'}</td>
              </tr>
            </tbody>
          </table>

          {/* 收款方和印章 */}
          <div className="flex justify-between items-center">
            <div>
              <p className="mb-2">收款人：定兴县中岳会计服务有限责任公司</p>
            </div>
            <div className="text-right relative">
              <p className="mb-2">盖章：</p>
              <div className="absolute right-0 top-4">
                <img 
                  src={sealImages[selectedSeal]} 
                  alt="公章" 
                  className="w-32 h-32 object-contain" 
                />
              </div>
            </div>
          </div>

          {/* 印章选择 */}
          <div className="mt-16 pt-6 border-t border-gray-200">
            <p className="mb-2">选择盖章单位：</p>
            <Radio.Group onChange={handleSealChange} value={selectedSeal}>
              <Radio.Button value="中岳">中岳</Radio.Button>
              <Radio.Button value="雄安">雄安</Radio.Button>
              <Radio.Button value="高碑店">高碑店</Radio.Button>
              <Radio.Button value="脉信">脉信</Radio.Button>
              <Radio.Button value="金盾">金盾</Radio.Button>
              <Radio.Button value="如你心意">如你心意</Radio.Button>
            </Radio.Group>
          </div>
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