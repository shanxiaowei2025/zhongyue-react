export interface SignatoryConfig {
  title: string
  englishTitle?: string
  address: string
  phone: string
  footer: string
  creditCode: string
  legalPerson?: string
}

export interface SignatoryStampConfig {
  imagePath: string
}

export type SignatoryName =
  | '定兴县中岳会计服务有限公司'
  | '定兴县中岳会计服务有限公司河北雄安分公司'
  | '定兴县中岳会计服务有限公司高碑店分公司'
  | '保定脉信会计服务有限公司'
  | '保定如你心意企业管理咨询有限公司'
  | '定兴县金盾企业管理咨询有限公司'
