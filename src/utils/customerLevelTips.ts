// 客户分级释义工具函数
export interface CustomerLevelTip {
  level: string
  smallScaleFee: string
  smallScaleBusiness: string
  generalTaxpayerFee: string
  generalTaxpayerBusiness: string
}

// 根据客户分级获取对应的颜色
export const getCustomerLevelColor = (level: string): string => {
  const levelGroup = level.charAt(0).toUpperCase()
  const colorMap: Record<string, string> = {
    A: '#1890ff', // 蓝色
    B: '#52c41a', // 绿色
    C: '#fa8c16', // 橙色
    D: '#f5222d', // 红色
  }
  return colorMap[levelGroup] || '#1890ff'
}

// 客户分级释义映射表
export const CUSTOMER_LEVEL_TIPS: Record<string, CustomerLevelTip> = {
  AA: {
    level: 'AA',
    smallScaleFee: '2000及以上',
    smallScaleBusiness:
      '1、忠实客户：合作年限长、续费率高、沟通顺畅配合度高。\n2、客户购买增值服务的频率多、金额高（变更、审计报告）、转介绍率高。\n3、开票量/凭证量多、银行流水笔数多',
    generalTaxpayerFee: '5500及以上',
    generalTaxpayerBusiness:
      '1、忠实客户：合作年限长、续费率高、沟通顺畅配合度高、税款缴纳及时\n2、客户购买增值服务的频率多、金额高（变更、审计报告）、转介绍率高。\n3、①账务处理难度大（特殊行业、企业规模大）\n②客户账务要求高：有特殊资产、复杂成本核算、研发费用加计扣除、政府补助等。',
  },
  AB: {
    level: 'AB',
    smallScaleFee: '2000及以上',
    smallScaleBusiness:
      '1、稳定客户：续费稳定，偶有降价\n2、日常业务稳定，税款缴纳及时\n3、账务处理：开票稳定、销售品种单一',
    generalTaxpayerFee: '5500及以上',
    generalTaxpayerBusiness:
      '1、稳定客户：续费稳定，偶有降价\n2、日常业务稳定，税款缴纳及时\n3、账务处理：开票稳定、销售品种单一',
  },
  AC: {
    level: 'AC',
    smallScaleFee: '2000及以上',
    smallScaleBusiness: '1、开票少，往来少，税款需催缴。\n2、客户事少、账务处理简单',
    generalTaxpayerFee: '5500及以上',
    generalTaxpayerBusiness: '1、开票少，往来少，税款需催缴。\n2、客户事少、账务处理简单',
  },
  AD: {
    level: 'AD',
    smallScaleFee: '2000及以上',
    smallScaleBusiness:
      '1、有过逾期申报、漏报、错报、被税务机关处罚或稽查的记录。\n2、不开票，没业务，零申报\n3、续费困难、沟通联系困难。\n4、客户税款认知程度低，缴税困难。\n5、未购买增值服务',
    generalTaxpayerFee: '5500及以上',
    generalTaxpayerBusiness:
      '1、有过逾期申报、漏报、错报、被税务机关处罚或稽查的记录。\n2、不开票，没业务，零申报\n3、续费困难、沟通联系困难。\n4、客户税款认知程度低，缴税困难。\n5、未购买增值服务',
  },
  BA: {
    level: 'BA',
    smallScaleFee: '1500-2000',
    smallScaleBusiness:
      '1、忠实客户：合作年限长、续费率高、沟通顺畅配合度高。\n2、客户购买增值服务的频率多、金额高（变更、审计报告）、转介绍率高。\n3、开票量/凭证量多、银行流水笔数多',
    generalTaxpayerFee: '4500-5500',
    generalTaxpayerBusiness:
      '1、忠实客户：合作年限长、续费率高、沟通顺畅配合度高、税款缴纳及时\n2、客户购买增值服务的频率多、金额高（变更、审计报告）、转介绍率高。\n3、①账务处理难度大（特殊行业、企业规模大）\n②客户账务要求高：有特殊资产、复杂成本核算、研发费用加计扣除、政府补助等。',
  },
  BB: {
    level: 'BB',
    smallScaleFee: '1500-2000',
    smallScaleBusiness:
      '1、稳定客户：续费稳定，偶有降价\n2、日常业务稳定，税款缴纳及时\n3、账务处理：开票稳定、销售品种单一',
    generalTaxpayerFee: '4500-5500',
    generalTaxpayerBusiness:
      '1、稳定客户：续费稳定，偶有降价\n2、日常业务稳定，税款缴纳及时\n3、账务处理：开票稳定、销售品种单一',
  },
  BC: {
    level: 'BC',
    smallScaleFee: '1500-2000',
    smallScaleBusiness: '1、开票少，往来少，税款需催缴。\n2、客户事少、账务处理简单',
    generalTaxpayerFee: '4500-5500',
    generalTaxpayerBusiness: '1、开票少，往来少，税款需催缴。\n2、客户事少、账务处理简单',
  },
  BD: {
    level: 'BD',
    smallScaleFee: '1500-2000',
    smallScaleBusiness:
      '1、有过逾期申报、漏报、错报、被税务机关处罚或稽查的记录。\n2、不开票，没业务，零申报\n3、续费困难、沟通联系困难。\n4、客户税款认知程度低，缴税困难。\n5、未购买增值服务',
    generalTaxpayerFee: '4500-5500',
    generalTaxpayerBusiness:
      '1、有过逾期申报、漏报、错报、被税务机关处罚或稽查的记录。\n2、不开票，没业务，零申报\n3、续费困难、沟通联系困难。\n4、客户税款认知程度低，缴税困难。\n5、未购买增值服务',
  },
  CA: {
    level: 'CA',
    smallScaleFee: '1000-1500',
    smallScaleBusiness:
      '1、忠实客户：合作年限长、续费率高、沟通顺畅配合度高。\n2、客户购买增值服务的频率多、金额高（变更、审计报告）、转介绍率高。\n3、开票量/凭证量多、银行流水笔数多',
    generalTaxpayerFee: '3500-4500',
    generalTaxpayerBusiness:
      '1、忠实客户：合作年限长、续费率高、沟通顺畅配合度高、税款缴纳及时\n2、客户购买增值服务的频率多、金额高（变更、审计报告）、转介绍率高。\n3、①账务处理难度大（特殊行业、企业规模大）\n②客户账务要求高：有特殊资产、复杂成本核算、研发费用加计扣除、政府补助等。',
  },
  CB: {
    level: 'CB',
    smallScaleFee: '1000-1500',
    smallScaleBusiness:
      '1、稳定客户：续费稳定，偶有降价\n2、日常业务稳定，税款缴纳及时\n3、账务处理：开票稳定、销售品种单一',
    generalTaxpayerFee: '3500-4500',
    generalTaxpayerBusiness:
      '1、稳定客户：续费稳定，偶有降价\n2、日常业务稳定，税款缴纳及时\n3、账务处理：开票稳定、销售品种单一',
  },
  CC: {
    level: 'CC',
    smallScaleFee: '1000-1500',
    smallScaleBusiness: '1、开票少，往来少，税款需催缴。\n2、客户事少、账务处理简单',
    generalTaxpayerFee: '3500-4500',
    generalTaxpayerBusiness: '1、开票少，往来少，税款需催缴。\n2、客户事少、账务处理简单',
  },
  CD: {
    level: 'CD',
    smallScaleFee: '1000-1500',
    smallScaleBusiness:
      '1、有过逾期申报、漏报、错报、被税务机关处罚或稽查的记录。\n2、不开票，没业务，零申报\n3、续费困难、沟通联系困难。\n4、客户税款认知程度低，缴税困难。\n5、未购买增值服务',
    generalTaxpayerFee: '3500-4500',
    generalTaxpayerBusiness:
      '1、有过逾期申报、漏报、错报、被税务机关处罚或稽查的记录。\n2、不开票，没业务，零申报\n3、续费困难、沟通联系困难。\n4、客户税款认知程度低，缴税困难。\n5、未购买增值服务',
  },
  DA: {
    level: 'DA',
    smallScaleFee: '1000以下',
    smallScaleBusiness:
      '1、忠实客户：合作年限长、续费率高、沟通顺畅配合度高。\n2、客户购买增值服务的频率多、金额高（变更、审计报告）、转介绍率高。\n3、开票量/凭证量多、银行流水笔数多',
    generalTaxpayerFee: '3500以下',
    generalTaxpayerBusiness:
      '1、忠实客户：合作年限长、续费率高、沟通顺畅配合度高、税款缴纳及时\n2、客户购买增值服务的频率多、金额高（变更、审计报告）、转介绍率高。\n3、①账务处理难度大（特殊行业、企业规模大）\n②客户账务要求高：有特殊资产、复杂成本核算、研发费用加计扣除、政府补助等。',
  },
  DB: {
    level: 'DB',
    smallScaleFee: '1000以下',
    smallScaleBusiness:
      '1、稳定客户：续费稳定，偶有降价\n2、日常业务稳定，税款缴纳及时\n3、账务处理：开票稳定、销售品种单一',
    generalTaxpayerFee: '3500以下',
    generalTaxpayerBusiness:
      '1、稳定客户：续费稳定，偶有降价\n2、日常业务稳定，税款缴纳及时\n3、账务处理：开票稳定、销售品种单一',
  },
  DC: {
    level: 'DC',
    smallScaleFee: '1000以下',
    smallScaleBusiness: '1、开票少，往来少，税款需催缴。\n2、客户事少、账务处理简单',
    generalTaxpayerFee: '3500以下',
    generalTaxpayerBusiness: '1、开票少，往来少，税款需催缴。\n2、客户事少、账务处理简单',
  },
  DD: {
    level: 'DD',
    smallScaleFee: '1000以下',
    smallScaleBusiness:
      '1、有过逾期申报、漏报、错报、被税务机关处罚或稽查的记录。\n2、不开票，没业务，零申报\n3、续费困难、沟通联系困难。\n4、客户税款认知程度低，缴税困难。\n5、未购买增值服务',
    generalTaxpayerFee: '3500以下',
    generalTaxpayerBusiness:
      '1、有过逾期申报、漏报、错报、被税务机关处罚或稽查的记录。\n2、不开票，没业务，零申报\n3、续费困难、沟通联系困难。\n4、客户税款认知程度低，缴税困难。\n5、未购买增值服务',
  },
}
