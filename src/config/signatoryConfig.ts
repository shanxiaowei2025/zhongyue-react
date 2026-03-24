import type { SignatoryConfig, SignatoryStampConfig, SignatoryName } from '../types/signatory'

// 代理记账合同专用配置（使用简化地址格式）
export const AGENCY_SIGNATORY_CONFIG: Record<string, SignatoryConfig> = {
  定兴县中岳会计服务有限公司: {
    title: '定兴县中岳会计服务有限公司',
    englishTitle: 'Dingxing County Zhongyue Accounting Service Co., Ltd.',
    address: '定兴县佶地国际D区120号',
    phone: '15030201110',
    footer: '定兴县中岳会计服务有限公司Tel: 15030201110',
    creditCode: '91130626598283956U',
  },
  定兴县中岳会计服务有限公司河北雄安分公司: {
    title: '定兴县中岳会计服务有限公司河北雄安分公司',
    englishTitle: 'Dingxing County Zhongyue Accounting Service Co., Ltd.',
    address: '河北省雄安新区容城县容城镇容善路39号（自主申报）',
    phone: '15030201110',
    footer: '定兴县中岳会计服务有限公司河北雄安分公司Tel: 15030201110',
    creditCode: '91130629MACECTTD7P',
  },
  定兴县中岳会计服务有限公司高碑店分公司: {
    title: '定兴县中岳会计服务有限公司高碑店分公司',
    englishTitle: 'Dingxing County Zhongyue Accounting Service Co., Ltd.',
    address: '河北省保定市高碑店市北城街道京广北大街188号A07',
    phone: '15030201110',
    footer: '定兴县中岳会计服务有限公司高碑店分公司Tel: 15030201110',
    creditCode: '91130684MA7AE69768',
  },
  保定脉信会计服务有限公司: {
    title: '保定脉信会计服务有限公司',
    englishTitle: '',
    address: '河北省保定市容城县容城镇容美路',
    phone: '15030201110',
    footer: '保定脉信会计服务有限公司Tel: 15030201110',
    creditCode: '91130629MA07XG2A1Q',
  },
  保定如你心意企业管理咨询有限公司: {
    title: '保定如你心意企业管理咨询有限公司',
    englishTitle: 'Baoding Ru Ni Xin Yi Enterprise Management Consulting Co., Ltd.',
    address: '河北省保定市定兴县东落堡镇东落堡村264号',
    phone: '13831247565',
    footer: '保定如你心意企业管理咨询有限公司Tel: 13831247565',
    creditCode: '91130626MADR9GRR0G',
  },
}

// 产品服务协议和单项服务合同专用配置（使用完整地址格式）
export const PRODUCT_SIGNATORY_CONFIG: Record<string, SignatoryConfig> = {
  定兴县中岳会计服务有限公司: {
    title: '定兴县中岳会计服务有限公司',
    englishTitle: 'Dingxing County Zhongyue Accounting Service Co., Ltd.',
    address: '河北省保定市定兴县繁兴街佶地国际D-1-120',
    phone: '15030201110',
    footer: '定兴县中岳会计服务有限公司Tel: 15030201110',
    creditCode: '91130626598283956U',
  },
  定兴县中岳会计服务有限公司河北雄安分公司: {
    title: '定兴县中岳会计服务有限公司河北雄安分公司',
    englishTitle: 'Dingxing County Zhongyue Accounting Service Co., Ltd.',
    address: '河北省雄安新区容城县容城镇容善路39号',
    phone: '15030201110',
    footer: '定兴县中岳会计服务有限公司河北雄安分公司Tel: 15030201110',
    creditCode: '91130629MACECTTD7P',
  },
  定兴县中岳会计服务有限公司高碑店分公司: {
    title: '定兴县中岳会计服务有限公司高碑店分公司',
    englishTitle: 'Dingxing County Zhongyue Accounting Service Co., Ltd.',
    address: '高碑店市北城街道京广北大街188号A07',
    phone: '15030201110',
    footer: '定兴县中岳会计服务有限公司高碑店分公司Tel: 15030201110',
    creditCode: '91130684MA7AE69768',
  },
  保定脉信会计服务有限公司: {
    title: '保定脉信会计服务有限公司',
    englishTitle: '',
    address: '河北省保定市容城县容城镇容美路',
    phone: '15030201110',
    footer: '保定脉信会计服务有限公司Tel: 15030201110',
    creditCode: '91130629MA07XG2A1Q',
  },
  保定如你心意企业管理咨询有限公司: {
    title: '保定如你心意企业管理咨询有限公司',
    englishTitle: 'Baoding Ru Ni Xin Yi Enterprise Management Consulting Co., Ltd.',
    address: '河北省保定市定兴县东落堡镇东落堡村264号',
    phone: '13831247565',
    footer: '保定如你心意企业管理咨询有限公司Tel: 13831247565',
    creditCode: '91130626MADR9GRR0G',
  },
  定兴县金盾企业管理咨询有限公司: {
    title: '定兴县金盾企业管理咨询有限公司',
    englishTitle: 'Dingxing County Golden Shield Enterprise Management Consulting Co., Ltd.',
    address: '河北省保定市定兴县定兴镇北肖庄村',
    phone: '13582229111',
    footer: '定兴县金盾企业管理咨询有限公司Tel: 13582229111',
    creditCode: '91130626308409806A',
  },
}

export const STAMP_IMAGE_CONFIG: Record<SignatoryName, SignatoryStampConfig> = {
  定兴县中岳会计服务有限公司: {
    imagePath: '/images/contract-seals/dingxing-seal.jpg',
  },
  定兴县中岳会计服务有限公司河北雄安分公司: {
    imagePath: '/images/contract-seals/xiongan-seal.jpg',
  },
  定兴县中岳会计服务有限公司高碑店分公司: {
    imagePath: '/images/contract-seals/gaobeidian-seal.jpg',
  },
  保定脉信会计服务有限公司: {
    imagePath: '/images/contract-seals/maixin-seal.jpg',
  },
  保定如你心意企业管理咨询有限公司: {
    imagePath: '/images/contract-seals/runixinyi-seal.jpg',
  },
  定兴县金盾企业管理咨询有限公司: {
    imagePath: '/images/contract-seals/jindun-seal.jpg',
  },
}

// 获取代理记账合同签署方配置
export const getAgencySignatoryConfig = (signatory: string): SignatoryConfig | null => {
  return AGENCY_SIGNATORY_CONFIG[signatory] || null
}

// 获取产品服务协议和单项服务合同签署方配置
export const getProductSignatoryConfig = (signatory: string): SignatoryConfig | null => {
  return PRODUCT_SIGNATORY_CONFIG[signatory] || null
}

// 向后兼容性函数（默认使用产品服务配置）
export const getSignatoryConfig = (signatory: string): SignatoryConfig | null => {
  return getProductSignatoryConfig(signatory)
}

export const getSignatoryStampImage = (signatory: string): string => {
  const config = STAMP_IMAGE_CONFIG[signatory as SignatoryName]
  return config?.imagePath || ''
}
