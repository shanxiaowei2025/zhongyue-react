import React from 'react'
import { ExportOutlined } from '@ant-design/icons'

interface ContractLinkProps {
  contractId: number
  children: React.ReactNode
  className?: string
}

/**
 * 合同链接组件
 * 点击时会先切换到合同管理tab，再跳转到合同详情页
 */
const ContractLink: React.FC<ContractLinkProps> = ({ contractId, children, className }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    // 检查全局导航函数是否存在
    if (window.activateMenuTab) {
      // 先切换到合同管理tab，再导航到合同详情
      window.activateMenuTab('/contracts', `/contracts/detail/${contractId}`)
    } else {
      // 如果全局函数不存在，直接导航
      window.location.href = `/contracts/detail/${contractId}`
    }
  }

  return (
    <a
      href={`/contracts/detail/${contractId}`}
      onClick={handleClick}
      className={className || 'related-contract-link'}
      title="点击查看合同详情"
    >
      {children}
      <ExportOutlined />
    </a>
  )
}

export default ContractLink
