import React from 'react'
import { Table, Typography } from 'antd'
import { CUSTOMER_LEVEL_TIPS, type CustomerLevelTip } from '../utils/customerLevelTips'

const { Title, Text } = Typography

interface CustomerLevelTipProps {
  level?: string // 如果提供level，只显示该级别的信息；否则显示所有级别
}

interface TableDataType {
  key: string
  level: string
  smallScaleFee: string
  smallScaleBusiness: string
  generalTaxpayerFee: string
  generalTaxpayerBusiness: string
}

const CustomerLevelTipComponent: React.FC<CustomerLevelTipProps> = ({ level }) => {
  // 准备表格数据
  const tableData: TableDataType[] = level
    ? [CUSTOMER_LEVEL_TIPS[level]].filter(Boolean).map(tip => ({
        key: tip.level,
        level: tip.level,
        smallScaleFee: tip.smallScaleFee,
        smallScaleBusiness: tip.smallScaleBusiness,
        generalTaxpayerFee: tip.generalTaxpayerFee,
        generalTaxpayerBusiness: tip.generalTaxpayerBusiness,
      }))
    : Object.values(CUSTOMER_LEVEL_TIPS).map(tip => ({
        key: tip.level,
        level: tip.level,
        smallScaleFee: tip.smallScaleFee,
        smallScaleBusiness: tip.smallScaleBusiness,
        generalTaxpayerFee: tip.generalTaxpayerFee,
        generalTaxpayerBusiness: tip.generalTaxpayerBusiness,
      }))

  const columns = [
    {
      title: '等级',
      dataIndex: 'level',
      key: 'level',
      width: 60,
      align: 'center' as const,
      render: (text: string) => (
        <Text strong style={{ fontSize: '14px', color: '#1890ff' }}>
          {text}
        </Text>
      ),
    },
    {
      title: '小规模纳税人',
      children: [
        {
          title: '费用级别',
          dataIndex: 'smallScaleFee',
          key: 'smallScaleFee',
          width: 120,
          align: 'center' as const,
          render: (text: string) => (
            <Text style={{ fontSize: '12px', fontWeight: 'bold', color: '#52c41a' }}>{text}</Text>
          ),
        },
        {
          title: '日常业务级别划分',
          dataIndex: 'smallScaleBusiness',
          key: 'smallScaleBusiness',
          width: 200,
          render: (text: string) => (
            <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
              {text.split('\n').map((line, index) => (
                <div key={index} style={{ marginBottom: '2px' }}>
                  {line}
                </div>
              ))}
            </div>
          ),
        },
      ],
    },
    {
      title: '一般纳税人',
      children: [
        {
          title: '费用级别',
          dataIndex: 'generalTaxpayerFee',
          key: 'generalTaxpayerFee',
          width: 120,
          align: 'center' as const,
          render: (text: string) => (
            <Text style={{ fontSize: '12px', fontWeight: 'bold', color: '#fa8c16' }}>{text}</Text>
          ),
        },
        {
          title: '日常业务级别划分',
          dataIndex: 'generalTaxpayerBusiness',
          key: 'generalTaxpayerBusiness',
          width: 200,
          render: (text: string) => (
            <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
              {text.split('\n').map((line, index) => (
                <div key={index} style={{ marginBottom: '2px' }}>
                  {line}
                </div>
              ))}
            </div>
          ),
        },
      ],
    },
  ]

  return (
    <div style={{ maxWidth: level ? '800px' : '900px' }}>
      {level ? (
        <Title level={5} style={{ margin: '0 0 12px 0', color: '#1890ff' }}>
          {level}级别客户分级释义
        </Title>
      ) : (
        <Title level={4} style={{ margin: '0 0 16px 0', textAlign: 'center' }}>
          客户分级释义表
        </Title>
      )}

      <Table
        dataSource={tableData}
        columns={columns}
        pagination={false}
        size="small"
        bordered
        style={{ fontSize: '12px' }}
        scroll={{ y: level ? undefined : 400 }}
        rowClassName={(record, index) => {
          const levelGroup = record.level.charAt(0)
          const colorMap: Record<string, string> = {
            A: 'rgba(24, 144, 255, 0.05)', // 蓝色背景
            B: 'rgba(82, 196, 26, 0.05)', // 绿色背景
            C: 'rgba(250, 140, 22, 0.05)', // 橙色背景
            D: 'rgba(245, 34, 45, 0.05)', // 红色背景
          }
          return levelGroup ? `customer-level-${levelGroup.toLowerCase()}` : ''
        }}
      />

      <style>
        {`
          .customer-level-a td {
            background-color: rgba(24, 144, 255, 0.03) !important;
          }
          .customer-level-b td {
            background-color: rgba(82, 196, 26, 0.03) !important;
          }
          .customer-level-c td {
            background-color: rgba(250, 140, 22, 0.03) !important;
          }
          .customer-level-d td {
            background-color: rgba(245, 34, 45, 0.03) !important;
          }
          .customer-level-a:hover td,
          .customer-level-b:hover td,
          .customer-level-c:hover td,
          .customer-level-d:hover td {
            background-color: rgba(0, 0, 0, 0.05) !important;
          }
        `}
      </style>
    </div>
  )
}

export default CustomerLevelTipComponent
