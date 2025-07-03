import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer'
import type { Contract } from '../../types/contract'
import { numberToChinese } from '../../utils/numberToChinese'

// 注册中文字体
Font.register({
  family: 'SimSun',
  src: '/fonts/simsun.ttf',
})

Font.register({
  family: 'SourceHanSerifCN-Regular',
  src: '/fonts/SourceHanSerifCN-Regular.ttf',
})

Font.register({
  family: 'SourceHanSerifCN-Bold',
  src: '/fonts/SourceHanSerifCN-Bold.ttf',
})

// 注册中文断字回调函数
Font.registerHyphenationCallback((word: string) => {
  // 中文字符可以在任意位置断行
  if (/[\u4e00-\u9fff]/.test(word)) {
    return word.split('')
  }
  
  // 对于英文和数字，保持原有的断字逻辑
  if (word.length <= 3) {
    return [word]
  }
  
  // 简单的英文断字处理
  const syllables = []
  let current = ''
  for (let i = 0; i < word.length; i++) {
    current += word[i]
    if (current.length >= 3 && i < word.length - 1) {
      syllables.push(current)
      current = ''
    }
  }
  if (current) {
    syllables.push(current)
  }
  
  return syllables.length > 0 ? syllables : [word]
})

// 签署方配置
const SIGNATORY_CONFIG = {
  定兴县中岳会计服务有限公司: {
    title: '定兴县中岳会计服务有限公司',
    englishTitle: 'Dingxing County Zhongyue Accounting Service Co., Ltd.',
    address: '河北省保定市定兴县繁兴街佶地国际D-1-120',
    phone: '15030201110',
    footer: '定兴县中岳会计服务有限公司Tel: 15030201110',
    creditCode: '91130629MA07XG2A1Q',
  },
  定兴县中岳会计服务有限公司河北雄安分公司: {
    title: '定兴县中岳会计服务有限公司河北雄安分公司',
    englishTitle: 'Dingxing County Zhongyue Accounting Service Co., Ltd.',
    address: '河北省雄安新区容城县容善路39号',
    phone: '15030201110',
    footer: '定兴县中岳会计服务有限公司河北雄安分公司Tel: 15030201110',
    creditCode: '91130600MA0G259B3H',
  },
  定兴县中岳会计服务有限公司高碑店分公司: {
    title: '定兴县中岳会计服务有限公司高碑店分公司',
    englishTitle: 'Dingxing County Zhongyue Accounting Service Co., Ltd.',
    address: '高碑店市北城街道京广北大街188号A07',
    phone: '15030201110',
    footer: '定兴县中岳会计服务有限公司高碑店分公司Tel: 15030201110',
    creditCode: '91130684MA0G3CQJ32',
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
    creditCode: '',
  },
  定兴县金盾企业管理咨询有限公司: {
    title: '定兴县金盾企业管理咨询有限公司',
    englishTitle: 'Dingxing County Golden Shield Enterprise Management Consulting Co., Ltd.',
    address: '河北省保定市定兴县定兴镇北肖庄村',
    phone: '13582229111',
    footer: '定兴县金盾企业管理咨询有限公司Tel: 13582229111',
    creditCode: '',
  },
} as const

// 章图片映射配置
const STAMP_IMAGE_MAP = {
  定兴县中岳会计服务有限公司: '/images/contract-seals/dingxing-seal.jpg',
  定兴县中岳会计服务有限公司河北雄安分公司: '/images/contract-seals/xiongan-seal.jpg',
  定兴县中岳会计服务有限公司高碑店分公司: '/images/contract-seals/gaobeidian-seal.jpg',
  保定脉信会计服务有限公司: '/images/contract-seals/maixin-seal.jpg',
  保定如你心意企业管理咨询有限公司: '/images/contract-seals/runixinyi-seal.jpg',
  定兴县金盾企业管理咨询有限公司: '/images/contract-seals/jindun-seal.jpg',
} as const

// 申报服务项目
const DECLARATION_SERVICE_OPTIONS = [
  { label: '月度或季度增值税申报', value: 'vat' },
  { label: '月度或季度企业所得税预缴申报', value: 'corporate_income_tax' },
  { label: '月度个人所得税申报', value: 'personal_income_tax' },
  { label: '年度企业所得税汇算清缴', value: 'corporate_income_tax_annual' },
  { label: '年度个人所得税申报', value: 'personal_income_tax_annual' },
  { label: '财税咨询服务', value: 'tax_consulting' },
  { label: '代开发票', value: 'invoice_service' },
]

// PDF样式
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    paddingTop: '20mm',
    paddingBottom: '20mm',
    paddingLeft: '20mm',
    paddingRight: '20mm',
    fontFamily: 'SourceHanSerifCN-Regular',
    fontSize: 9,
    lineHeight: 1.4,
  },
  // 合同头部
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  companyLogo: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  companyInfo: {
    flex: 1,
    paddingLeft: 15,
    borderLeftWidth: 1,
    borderLeftColor: '#000',
  },
  companyInfoNoLogo: {
    flex: 1,
    paddingLeft: 0,
    borderLeftWidth: 0,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'SourceHanSerifCN-Bold',
    color: '#000',
    marginBottom: 3,
  },
  companyNameEn: {
    fontSize: 8,
    color: '#666',
    marginBottom: 3,
  },
  contactInfo: {
    fontSize: 9,
    color: '#333',
    marginBottom: 2,
  },
  companyRegistration: {
    fontSize: 7,
    color: '#999',
  },
  // 合同标题
  contractTitle: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SourceHanSerifCN-Bold',
    marginBottom: 20,
    marginTop: 10,
  },
  // 合同双方信息
  partiesSection: {
    marginBottom: 15,
  },
  partyBlock: {
    marginBottom: 10,
  },
  partyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  partyLabel: {
    fontWeight: 'bold',
    fontFamily: 'SourceHanSerifCN-Bold',
    minWidth: 60,
    fontSize: 9,
  },
  partyCompanyName: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'SourceHanSerifCN-Bold',
  },
  partyDetails: {
    marginLeft: 15,
    marginRight: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontWeight: 'bold',
    fontFamily: 'SourceHanSerifCN-Bold',
    minWidth: 80,
    fontSize: 9,
  },
  detailValue: {
    flex: 1,
    fontSize: 9,
  },
  // 代理记账合同专用样式
  agreementHeader: {
    marginBottom: 20,
  },
  agreementTitle: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SourceHanSerifCN-Bold',
    marginBottom: 20,
  },
  agreementParties: {
    marginBottom: 15,
  },
  partySection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  partyField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    marginLeft: 15,
    flexWrap: 'wrap',
  },
  partyContent: {
    flex: 1,
    flexWrap: 'wrap',
  },
  partyValue: {
    fontSize: 9,
  },
  partyBName: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'SourceHanSerifCN-Bold',
  },
  partyBCreditCode: {
    fontSize: 9,
  },
  agreementPreamble: {
    fontSize: 9,
    lineHeight: 1.5,
    marginBottom: 15,
    textAlign: 'left',
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
    orphans: 2,
    widows: 2,
  },
  agreementSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'SourceHanSerifCN-Bold',
    marginBottom: 8,
  },
  sectionContent: {
    marginLeft: 8,
    marginRight: 8,
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  entrustmentPeriod: {
    marginBottom: 10,
  },
  entrustmentText: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'left',
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
    orphans: 2,
    widows: 2,
  },
  dateValue: {
    fontWeight: 'bold',
    fontFamily: 'SourceHanSerifCN-Bold',
    fontSize: 9,
  },
  taxServices: {
    marginBottom: 10,
  },
  serviceCheckboxes: {
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'column',
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginRight: 10,
    flexWrap: 'wrap',
  },
  checkboxChecked: {
    width: 10,
    height: 10,
    backgroundColor: '#fff',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  checkboxUnchecked: {
    width: 10,
    height: 10,
    backgroundColor: '#fff',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#000',
  },
  checkboxCheckmark: {
    fontSize: 8,
    color: '#000',
    fontWeight: 'bold',
    lineHeight: 1,
    textAlign: 'center',
  },
  serviceLabel: {
    fontSize: 9,
    flex: 1,
  },
  serviceItemEmpty: {
    fontSize: 9,
    color: '#666',
  },
  otherBusiness: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  otherBusinessLabel: {
    fontWeight: 'bold',
    fontFamily: 'SourceHanSerifCN-Bold',
    fontSize: 9,
    marginRight: 5,
  },
  otherBusinessValue: {
    fontSize: 9,
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
  },
  // 条款内容
  partyAObligations: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'left',
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
  },
  partyBObligations: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'left',
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
  },
  responsibilityDivision: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'left',
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
  },
  agreementTermination: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'left',
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
  },
  agencyFeeContent: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'left',
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
  },
  feeValue: {
    fontWeight: 'bold',
    fontFamily: 'SourceHanSerifCN-Bold',
    color: '#000',
    fontSize: 9,
  },
  breachResponsibility: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'left',
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
  },
  otherAgreements: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'left',
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
  },
  // 签署区域
  agreementSignatures: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 20,
  },
  signatureContainer: {
    marginTop: 10,
  },
  signatureTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  signatureTitleColumn: {
    width: '48%',
  },
  signatureTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'SourceHanSerifCN-Bold',
  },
  signatureStampRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    minHeight: 100,
  },
  signatureStampColumn: {
    width: '48%',
    alignItems: 'center',
  },
  signatureStampSpace: {
    width: '100%',
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampImage: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  partyBSign: {
    width: 80,
    height: 80,
    objectFit: 'contain',
  },
  signatureInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  signatureInfoColumn: {
    width: '48%',
  },
  signatureField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  signatureLabel: {
    fontWeight: 'bold',
    fontFamily: 'SourceHanSerifCN-Bold',
    fontSize: 9,
    minWidth: 70,
  },
  // 段落样式
  paragraph: {
    fontSize: 9,
    lineHeight: 1.5,
    marginBottom: 8,
    textAlign: 'left',
    width: '100%',
    maxWidth: '100%',
    flexShrink: 1,
    orphans: 2,
    widows: 2,
  },
  // 页脚
  footer: {
    position: 'absolute',
    bottom: '20mm',
    left: '20mm',
    right: '20mm',
    textAlign: 'center',
    fontSize: 8,
    color: '#000',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
  },
})

interface ContractPDFDocumentProps {
  contractData: Contract
}

const ContractPDFDocument: React.FC<ContractPDFDocumentProps> = ({ contractData }) => {
  const config = SIGNATORY_CONFIG[contractData.signatory as keyof typeof SIGNATORY_CONFIG]

  if (!config) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>不支持的签署方: {contractData.signatory}</Text>
        </Page>
      </Document>
    )
  }

  // 格式化日期
  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return '-'
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日`
  }

  // 金额格式化
  const formatCurrency = (amount?: number | string | null) => {
    if (amount === undefined || amount === null || amount === '') return '0.00'
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount) || !isFinite(numAmount)) return '0.00'
    return numAmount.toFixed(2)
  }

  // 获取乙方盖章图片
  const getPartyBStampImage = (signatory: string): string => {
    return STAMP_IMAGE_MAP[signatory as keyof typeof STAMP_IMAGE_MAP] || ''
  }

  // 检查是否是脉信公司的产品服务协议
  const isMaixinProductService =
    contractData.signatory === '保定脉信会计服务有限公司' &&
    contractData.contractType === '产品服务协议'

  // 渲染PDF服务项目（用于产品服务协议和单项服务合同）
  const renderPDFServiceItems = (items: Array<Record<string, any>> = [], category: string) => {
    // 定义所有可能的选项映射
    const allCategoryOptions: Record<string, Array<{ key: string; label: string }>> = {
      business_establish: [
        { key: 'business_establish_limited', label: '有限责任公司' },
        { key: 'business_establish_branch', label: '有限责任公司分支机构' },
        { key: 'business_establish_individual', label: '个人独资企业' },
        { key: 'business_establish_partnership', label: '合伙企业' },
        { key: 'business_establish_nonprofit', label: '民办非企业' },
        { key: 'business_establish_joint_stock', label: '股份有限公司' },
        { key: 'business_establish_self_employed', label: '个体工商户' },
      ],
      business_change: [
        { key: 'business_change_legal_person', label: '法定代表人' },
        { key: 'business_change_shareholder', label: '股东股权' },
        { key: 'business_change_capital', label: '注册资金' },
        { key: 'business_change_name', label: '公司名称' },
        { key: 'business_change_scope', label: '经营范围' },
        { key: 'business_change_address', label: '注册地址' },
        { key: 'business_change_manager', label: '分公司负责人' },
        { key: 'business_change_directors', label: '董事/监事人员' },
      ],
      business_cancel: [
        { key: 'business_cancel_limited', label: '有限责任公司' },
        { key: 'business_cancel_branch', label: '有限责任公司分支机构' },
        { key: 'business_cancel_individual', label: '个人独资企业' },
        { key: 'business_cancel_partnership', label: '合伙企业' },
        { key: 'business_cancel_foreign', label: '外商投资企业' },
        { key: 'business_cancel_joint_stock', label: '股份有限公司' },
        { key: 'business_cancel_self_employed', label: '个体工商户' },
      ],
      business_other: [
        { key: 'business_other_annual_report', label: '年报公示' },
        { key: 'business_other_remove_exception', label: '解除异常' },
        { key: 'business_other_info_repair', label: '信息修复' },
        { key: 'business_other_file_retrieval', label: '档案调取' },
        { key: 'business_other_license_annual', label: '许可证年检' },
        { key: 'business_address_small_scale', label: '地址托管-小规模' },
        { key: 'business_address_general', label: '地址托管-一般纳税人' },
      ],
      business_material: [
        { key: 'business_material_seal', label: '备案章' },
        { key: 'business_material_rubber', label: '胶皮章' },
        { key: 'business_material_crystal', label: '水晶章' },
        { key: 'business_material_kt_board', label: 'KT板牌子' },
        { key: 'business_material_copper', label: '铜牌' },
      ],
      tax: [
        { key: 'tax_assessment', label: '核定税种' },
        { key: 'tax_filing', label: '报税' },
        { key: 'tax_cancellation', label: '注销' },
        { key: 'tax_invoice_apply', label: '申请发票' },
        { key: 'tax_invoice_issue', label: '代开发票' },
        { key: 'tax_change', label: '税务变更' },
        { key: 'tax_remove_exception', label: '解除异常' },
        { key: 'tax_supplement', label: '补充申报' },
        { key: 'tax_software', label: '记账软件' },
        { key: 'tax_invoice_software', label: '开票软件' },
      ],
      bank: [
        { key: 'bank_general_account', label: '一般账户设立' },
        { key: 'bank_basic_account', label: '基本账户设立' },
        { key: 'bank_foreign_account', label: '外币账户设立' },
        { key: 'bank_info_change', label: '信息变更' },
        { key: 'bank_cancel', label: '银行账户注销' },
        { key: 'bank_financing', label: '融资业务（开通平台手续）' },
        { key: 'bank_loan', label: '贷款服务' },
      ],
      social: [
        { key: 'social_security_open', label: '社保开户' },
        { key: 'social_security_hosting', label: '社保托管' },
        { key: 'social_security_cancel', label: '社保账户注销' },
        { key: 'fund_open', label: '公积金开户' },
        { key: 'fund_hosting', label: '公积金托管' },
        { key: 'fund_change', label: '公积金变更' },
      ],
      license: [
        { key: 'license_food', label: '食品经营许可证' },
        { key: 'license_health', label: '卫生许可证' },
        { key: 'license_catering', label: '餐饮许可证' },
        { key: 'license_transport', label: '道路运输许可证' },
        { key: 'license_medical', label: '二类医疗器械备案' },
        { key: 'license_other', label: '其他许可证' },
        { key: 'license_prepackaged', label: '预包装食品备案' },
      ],
    }

    // 获取当前类别的所有可能选项
    const categoryOptions = allCategoryOptions[category] || []
    
    if (categoryOptions.length === 0) {
      return <Text style={{ fontSize: 9, color: '#666' }}>未选择</Text>
    }

    // 将现有项目转换为Map以便快速查找
    const selectedItemsMap = items.reduce(
      (acc, item) => {
        acc[item.itemKey] = item
        return acc
      },
      {} as Record<string, any>
    )

    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
        {categoryOptions.map((option, index) => {
          const isSelected = selectedItemsMap.hasOwnProperty(option.key)
          const item = selectedItemsMap[option.key]

          return (
            <View key={option.key} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8, marginBottom: 2 }}>
              <View style={isSelected ? styles.checkboxChecked : styles.checkboxUnchecked}>
                {isSelected && <Text style={styles.checkboxCheckmark}>✓</Text>}
              </View>
              <Text style={{ fontSize: 8, marginLeft: 3 }}>
                {option.label}
                {isSelected && item.amount ? `（${item.amount}元）` : ''}
              </Text>
            </View>
          )
        })}
      </View>
    )
  }

  // 渲染申报服务选项
  const renderDeclarationServices = () => {
    if (!contractData.declarationService || !Array.isArray(contractData.declarationService)) {
      return (
        <View style={styles.serviceCheckboxes}>
          <Text style={styles.serviceItemEmpty}>未选择</Text>
        </View>
      )
    }

    // 构建选中服务的映射，支持多种数据结构
    const selectedServiceMap = contractData.declarationService.reduce(
      (acc, service) => {
        // 处理不同的数据结构
        if (typeof service === 'string') {
          acc[service] = true
        } else if (service && typeof service === 'object' && service.value) {
          acc[service.value] = true
        }
        return acc
      },
      {} as Record<string, boolean>
    )

    return (
      <View style={styles.serviceCheckboxes}>
        {DECLARATION_SERVICE_OPTIONS.map((option, index) => {
          const isSelected = selectedServiceMap.hasOwnProperty(option.value)
          return (
            <View key={index} style={styles.serviceItem}>
              <View style={isSelected ? styles.checkboxChecked : styles.checkboxUnchecked}>
                {isSelected && <Text style={styles.checkboxCheckmark}>✓</Text>}
              </View>
              <Text style={styles.serviceLabel}>{option.label}</Text>
            </View>
          )
        })}
      </View>
    )
  }

  // 根据合同类型渲染不同内容
  const renderContractContent = () => {
    if (contractData.contractType === '代理记账合同') {
      return renderAgencyAccountingContract()
    } else if (contractData.contractType === '产品服务协议') {
      return renderProductServiceAgreement()
    } else if (contractData.contractType === '单项服务合同') {
      return renderSingleServiceAgreement()
    }
    return null
  }

  // 渲染代理记账合同
  const renderAgencyAccountingContract = () => (
    <Page size="A4" style={styles.page} wrap>
      {/* 合同头部 */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          <Image src="/images/contract-logo.png" style={styles.companyLogo} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{config.title}</Text>
            {config.englishTitle && <Text style={styles.companyNameEn}>{config.englishTitle}</Text>}
            <Text style={styles.contactInfo}>咨询电话：{config.phone}</Text>
            {config.englishTitle && (
              <Text style={styles.companyRegistration}>Company Registration</Text>
            )}
          </View>
        </View>
      </View>

      {/* 合同标题 */}
      <View style={styles.agreementHeader}>
        <Text style={styles.agreementTitle}>代理记账业务委托合同</Text>
      </View>

      {/* 合同双方信息 */}
              <View style={styles.agreementParties}>
        <View style={styles.partySection}>
          <Text style={styles.partyLabel}>甲方：</Text>
          <View style={styles.partyContent}>
            <Text style={styles.partyValue}>{contractData.partyACompany || '-'}</Text>
          </View>
        </View>

        <View style={styles.partyField}>
          <Text style={styles.partyLabel}>统一社会信用代码：</Text>
          <View style={styles.partyContent}>
            <Text style={styles.partyValue}>{contractData.partyACreditCode || '-'}</Text>
          </View>
        </View>

        <View style={styles.partyField}>
          <Text style={styles.partyLabel}>地址：</Text>
          <View style={styles.partyContent}>
            <Text style={styles.partyValue}>{contractData.partyAAddress || '-'}</Text>
          </View>
        </View>

        <View style={styles.partyField}>
          <Text style={styles.partyLabel}>电话：</Text>
          <View style={styles.partyContent}>
            <Text style={styles.partyValue}>{contractData.partyAPhone || '-'}</Text>
          </View>
        </View>

        <View style={styles.partyField}>
          <Text style={styles.partyLabel}>联系人：</Text>
          <View style={styles.partyContent}>
            <Text style={styles.partyValue}>{contractData.partyAContact || '-'}</Text>
          </View>
        </View>

        <View style={styles.partySection}>
          <Text style={styles.partyLabel}>乙方：</Text>
          <View style={styles.partyContent}>
            <Text style={styles.partyBName}>{config.title}</Text>
          </View>
        </View>

        <View style={styles.partyField}>
          <Text style={styles.partyLabel}>统一社会信用代码：</Text>
          <View style={styles.partyContent}>
            <Text style={styles.partyBCreditCode}>{config.creditCode}</Text>
          </View>
        </View>

        <View style={styles.partyField}>
          <Text style={styles.partyLabel}>地址：</Text>
          <View style={styles.partyContent}>
            <Text style={styles.partyValue}>{contractData.partyBAddress || config.address}</Text>
          </View>
        </View>

        <View style={styles.partyField}>
          <Text style={styles.partyLabel}>电话：</Text>
          <View style={styles.partyContent}>
            <Text style={styles.partyValue}>{contractData.partyBPhone || config.phone}</Text>
          </View>
        </View>

        <View style={styles.partyField}>
          <Text style={styles.partyLabel}>业务人：</Text>
          <View style={styles.partyContent}>
            <Text style={styles.partyValue}>{contractData.partyBContact || '-'}</Text>
          </View>
        </View>
      </View>

      {/* 合同前言 */}
      <Text style={styles.agreementPreamble}>
        甲方因经营管理需要委托乙方代理发票开具、记账纳税申报。为了维护双方合法权益根据《中华人民共和国民法典》及《代理记账管理办法》等法律、法规的规定经双方代表友好协商，达成以下协议：
      </Text>

      {/* 一、委托业务范围 */}
      <View style={styles.agreementSection} break={false}>
        <Text style={styles.sectionTitle}>一、委托业务范围</Text>
        <View style={styles.sectionContent}>
          <View style={styles.entrustmentPeriod}>
            <Text style={styles.entrustmentText}>
              乙方接受甲方委托，对甲方
              <Text style={styles.dateValue}>
                {contractData.entrustmentStartDate
                  ? formatDate(contractData.entrustmentStartDate)
                  : '___'}
              </Text>
              日至
              <Text style={styles.dateValue}>
                {contractData.entrustmentEndDate
                  ? formatDate(contractData.entrustmentEndDate)
                  : '___'}
              </Text>
              日期间内的经济业务进行代理记账。
            </Text>
          </View>

          <View style={styles.taxServices}>
            <Text>(同时为甲方提供代理纳税申报服务，包括：</Text>
            {renderDeclarationServices()}
            <View style={styles.otherBusiness}>
              <Text style={styles.otherBusinessLabel}>其他业务：</Text>
              <Text style={styles.otherBusinessValue}>{contractData.otherBusiness || '-'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 二、甲方的责任和义务 */}
      <View style={styles.agreementSection} break={false}>
        <Text style={styles.sectionTitle}>二、甲方的责任和义务</Text>
        <View style={[styles.sectionContent, styles.partyAObligations]}>
          <Text style={styles.paragraph}>
            (一)甲方的每项经济业务，必须填制或者取得符合国家统一会计制度规定的原始凭证。
          </Text>
          <Text style={styles.paragraph}>
            (二)甲方应归集和整理有关经济业务的原始凭证和其他资料，并于每月 15
            日前提供给乙方。甲方对所提供资料的完整性、真实性、合法性负责，不得虚报、瞒报收入和支出。
          </Text>
          <Text style={styles.paragraph}>
            (三)甲方应建立健全与本企业相适应的内部控制制度，保证资产的安全和完整。
          </Text>
          <Text style={styles.paragraph}>(四)甲方应当配备专人负责日常货币资金的收支和保管。</Text>
          <View style={{ width: '100%', maxWidth: '100%', flexShrink: 1 }}>
            <Text style={[styles.paragraph, { width: '100%', maxWidth: '100%', flexShrink: 1 }]}>
              (五)涉及存货核算的，甲方负责存货的管理与盘点，应建立存货的管理制度，定期清查盘点存货，编制存货的入库凭证、出库凭证、库存明细账及每月各类存货的收发存明细表，并及时提供给乙方。甲方对上述资料的真实性和完整性负责，并保证库存物资的安全和完整。
            </Text>
          </View>
          <Text style={styles.paragraph}>
            (六)甲方应在法律允许的范围内开展经济业务，遵守会计法、税法等法律法规的规定，不得授意和指使乙方违法办理会计事项。
          </Text>
          <Text style={styles.paragraph}>
            (七)对于乙方退回的、要求甲方按照国家统一的会计制度规定进行更正、补充的原始凭证，甲方应当及时予以更正、补充。
          </Text>
          <Text style={styles.paragraph}>
            (八)甲方应积极配合乙方开展代理记账业务，对乙方提出的合理建议应积极采纳
          </Text>
          <Text style={styles.paragraph}>
            (九)甲方应制定合理的会计资料传递程序，及时将原始凭证等会计资料交乙方，做好会计资料的签收工作。
          </Text>
          <Text style={styles.paragraph}>
            (十)会计年度终了后，乙方将会计档案移交甲方，由甲方负责保管会计档案，保证会计档案的安全和完整。
          </Text>
          <Text style={styles.paragraph}>
            (十一)甲方委托乙方开具销售发票的，应符合税收相关法律法规，不得要求乙方虚开发票。
          </Text>
          <Text style={styles.paragraph}>
            (十二)甲方应按本协议书规定及时足额支付代理记账服务费。
          </Text>
          <Text style={styles.paragraph}>
            (十三)甲方应保证在规定的纳税期，银行账户有足额的存款缴纳税款。
          </Text>
        </View>
      </View>

      {/* 三、乙方的责任和义务 */}
      <View style={styles.agreementSection} break={false}>
        <Text style={styles.sectionTitle}>三、乙方的责任和义务</Text>
        <View style={[styles.sectionContent, styles.partyBObligations]}>
          <Text style={styles.paragraph}>
            (一)乙方根据甲方所提供的原始凭证和其他资料，按照国家统一会计制度的规定进行会计核算，包括审核原始凭证、填制记账凭证、登记会计账簿、设计编制和提供财务会计报告。
          </Text>
          <Text style={styles.paragraph}>
            (二)乙方应严格按照税收相关法律法规，在规定的申报期内为甲方及时、准确地办理纳税申报业务。
          </Text>
          <Text style={styles.paragraph}>
            (三)涉及存货核算的，根据甲方提供的存货入库凭证、出库凭证、每月各类存货的收发存明细表，乙方进行成本结转。
          </Text>
          <Text style={styles.paragraph}>
            (四)乙方应协助甲方完善内部控制，加强内部管理，针对内部控制薄弱环节提出合理的建议。
          </Text>
          <Text style={styles.paragraph}>
            (五)乙方应协助甲方制定合理的会计资料传递程序，积极配合甲方做好会计资料的签收手续。在代理记账过程中，应妥善保管会计资料。
          </Text>
          <Text style={styles.paragraph}>
            (六)乙方应按时将当年应归档的会计资料整理、装订后形成会计档案，于会计年度终了后交甲方保管。本办理交接手续前，由乙方负责保管。
          </Text>
          <Text style={styles.paragraph}>
            (七)委托协议终止时，乙方应与甲方办理会计业务交接事宜。
          </Text>
          <Text style={styles.paragraph}>
            (八)乙方接受委托为甲方开具销售发票的，应按照税收法律法规要求为甲方提供代开发票服务，不得代为虚开发票。
          </Text>
          <Text style={styles.paragraph}>
            (九)乙方对开展业务过程中知悉的商业秘密、个人信息负有保密义务。
          </Text>
          <Text style={styles.paragraph}>
            (十)对甲方提出的有关会计处理的相关问题，乙方应当予以正确解释。
          </Text>
        </View>
      </View>

      {/* 四、责任划分 */}
      <View style={styles.agreementSection} break={false}>
        <Text style={styles.sectionTitle}>四、责任划分</Text>
        <View style={[styles.sectionContent, styles.responsibilityDivision]}>
          <Text style={styles.paragraph}>
            (一)乙方是在甲方提供相关资料的基础上进行会计核算，因甲方提供的记账依据不实、未按协议约定及时提供记账依据或其他过错导致委托事项出现差错或未能按时完成委托事项，由此造成的后果，由甲方承担。
          </Text>
          <Text style={styles.paragraph}>
            (二)因乙方的过错导致委托事项出现差错或未能按时完成委托事项，由此造成的后果，由乙方承担。
          </Text>
        </View>
      </View>

      {/* 五、协议的终止 */}
      <View style={styles.agreementSection} break={false}>
        <Text style={styles.sectionTitle}>五、协议的终止</Text>
        <View style={[styles.sectionContent, styles.agreementTermination]}>
          <Text style={styles.paragraph}>
            (一)协议期满，本协议自然终止，双方如需续约，须另定协议。
          </Text>
          <Text style={styles.paragraph}>(二)经双方协商一致后，可提前终止协议。</Text>
        </View>
      </View>

      {/* 六、代理记账服务费 */}
      <View style={styles.agreementSection} break={false}>
        <Text style={styles.sectionTitle}>六、代理记账服务费</Text>
        <View style={[styles.sectionContent, styles.agencyFeeContent]}>
          <Text style={styles.paragraph}>
            经协商，乙方代理记账收费标准为：人民币每年
            <Text style={styles.feeValue}>
              {formatCurrency(contractData.totalAgencyAccountingFee)}
            </Text>
            元（代理记账费
            <Text style={styles.feeValue}>{formatCurrency(contractData.agencyAccountingFee)}</Text>
            /年，记账软件服务费
            <Text style={styles.feeValue}>
              {formatCurrency(contractData.accountingSoftwareFee)}
            </Text>
            /年，开票软件服务费
            <Text style={styles.feeValue}>{formatCurrency(contractData.invoicingSoftwareFee)}</Text>
            /年），甲方按年度提前30日支付，不足一个月的按一个月计算。如甲方业务量增加，乙方根据甲方业务增量调整增加代理费用。
          </Text>

          <Text style={styles.paragraph}>
            全年凭证、账簿费用为
            <Text style={styles.feeValue}>{formatCurrency(contractData.accountBookFee)}</Text>
            元。其中包括凭证、账簿、差旅费报销单、费用粘贴单、工资表、财务报表、纳税申报表等。（以上费用以实际到账执行）
          </Text>

          <Text style={styles.paragraph}>
            人民币本次收费总金额
            <Text style={styles.feeValue}>{formatCurrency(contractData.currentChargeFee)}</Text>
            元。
          </Text>

          <Text style={styles.paragraph}>于合同生效日起 3 日内一次付清。</Text>
        </View>
      </View>

      {/* 七、违约责任 */}
      <View style={styles.agreementSection} break={false}>
        <Text style={styles.sectionTitle}>七、违约责任</Text>
        <View style={[styles.sectionContent, styles.breachResponsibility]}>
          <Text style={styles.paragraph}>
            (一)甲方未能履行其责任，未向乙方提供真实、合法、准确、完整的原始凭证，导致税收方面的责任由甲方承担；
          </Text>
          <Text style={styles.paragraph}>
            (二)由于甲方未能及时提供代理记账所需的核算资料，致使乙方不能按时履行合同的，乙方不承担任何责任；
          </Text>
          <Text style={styles.paragraph}>
            (三)由于乙方原因，未能按时完成会计核算或会计核算不真实，造成一定后果的，乙方必须及时纠正并承担相应的责任；
          </Text>
          <Text style={styles.paragraph}>
            (四)关于会计账务出现的问题，办理交接手续以前的由甲方负责，办理交接手续以后的由乙方负责；
          </Text>
          <Text style={styles.paragraph}>
            (五)如甲方中途终止合同（转走或注销），未到期服务费用乙方不予退还，并且代理期间遗留业务按照正常收费标准收费。
          </Text>
        </View>
      </View>

      {/* 八、其他约定 */}
      <View style={styles.agreementSection} break={false}>
        <Text style={styles.sectionTitle}>八、其他约定</Text>
        <View style={[styles.sectionContent, styles.otherAgreements]}>
          <Text style={styles.paragraph}>
            (一)本协议的补充条款、附件及补充协议均为本协议不可分割的部分。本协议补充条款、补充协议与本协议不一致的，以补充条款、补充协议为准。
          </Text>
          <Text style={styles.paragraph}>
            (二)本协议的未尽事宜及本协议在履行过程中需要变更的事宜，双方应通过订立变更协议进行约定。
          </Text>
          <Text style={styles.paragraph}>
            (三)甲乙双方在履行本协议过程中发生争议，应协商解决。协商不能解决的，向仲裁委员会申请仲裁/依法向人民法院起诉。
          </Text>
          <Text style={styles.paragraph}>
            本协议自双方签字之日起生效。本协议一式两份，双方各执一份。
          </Text>
        </View>
      </View>

      {/* 签署区域 */}
      <View style={styles.agreementSignatures} break={false}>
        <View style={styles.signatureContainer}>
          {/* 签名标题行 */}
          <View style={styles.signatureTitleRow}>
            <View style={styles.signatureTitleColumn}>
              <Text style={styles.signatureTitle}>委托方：{contractData.partyACompany || ''}</Text>
            </View>
            <View style={styles.signatureTitleColumn}>
              <Text style={styles.signatureTitle}>受托方：{config.title}</Text>
            </View>
          </View>

          {/* 盖章空间行 */}
          <View style={styles.signatureStampRow}>
            <View style={styles.signatureStampColumn}>
              <View style={styles.signatureStampSpace}>
                {(contractData.contractSignature || contractData.partyAStampImage) && (
                  <Image
                    src={contractData.contractSignature || contractData.partyAStampImage}
                    style={styles.stampImage}
                  />
                )}
              </View>
            </View>
            <View style={styles.signatureStampColumn}>
              <View style={styles.signatureStampSpace}>
                {getPartyBStampImage(contractData.signatory || '') && (
                  <Image
                    src={getPartyBStampImage(contractData.signatory || '')}
                    style={styles.partyBSign}
                  />
                )}
              </View>
            </View>
          </View>

          {/* 法定代表人信息行 */}
          <View style={styles.signatureInfoRow}>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>法定代表人：</Text>
                <Text>{contractData.partyALegalPerson || '-'}</Text>
              </View>
            </View>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>法定代表人：</Text>
                <Text>{contractData.partyBLegalPerson || '刘菲'}</Text>
              </View>
            </View>
          </View>

          {/* 联系人信息行 */}
          <View style={styles.signatureInfoRow}>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>联系人：</Text>
                <Text>{contractData.partyAContact || '-'}</Text>
              </View>
            </View>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>联系人：</Text>
                <Text>{contractData.partyBContact || '-'}</Text>
              </View>
            </View>
          </View>

          {/* 地址信息行 */}
          <View style={styles.signatureInfoRow}>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>地址：</Text>
                <Text>{contractData.partyAAddress || '-'}</Text>
              </View>
            </View>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>地址：</Text>
                <Text>{contractData.partyBAddress || config.address}</Text>
              </View>
            </View>
          </View>

          {/* 邮编信息行 */}
          <View style={styles.signatureInfoRow}>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>邮编：</Text>
                <Text>{contractData.partyAPostalCode || '-'}</Text>
              </View>
            </View>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>邮编：</Text>
                <Text>{contractData.partyBPostalCode || '-'}</Text>
              </View>
            </View>
          </View>

          {/* 电话信息行 */}
          <View style={styles.signatureInfoRow}>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>电话：</Text>
                <Text>{contractData.partyAPhone || '-'}</Text>
              </View>
            </View>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>电话：</Text>
                <Text>{contractData.partyBPhone || config.phone}</Text>
              </View>
            </View>
          </View>

          {/* 签约日期信息行 */}
          <View style={styles.signatureInfoRow}>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>签约日期：</Text>
                <Text>{formatDate(contractData.partyASignDate)}</Text>
              </View>
            </View>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>签约日期：</Text>
                <Text>{formatDate(contractData.partyBSignDate)}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 页脚 */}
      <Text style={styles.footer}>{config.footer}</Text>
    </Page>
  )

  // 渲染产品服务协议
  const renderProductServiceAgreement = () => (
    <Page size="A4" style={styles.page} wrap>
      {/* 合同头部 */}
      <View style={styles.header}>
        <View style={styles.logoSection}>
          {!isMaixinProductService && (
            <Image src="/images/contract-logo.png" style={styles.companyLogo} />
          )}
          <View style={isMaixinProductService ? styles.companyInfoNoLogo : styles.companyInfo}>
            <Text style={styles.companyName}>
              {contractData.signatory === '定兴县中岳会计服务有限公司河北雄安分公司' ||
              contractData.signatory === '定兴县中岳会计服务有限公司高碑店分公司' ? (
                `定兴县中岳会计服务有限公司\n${contractData.signatory === '定兴县中岳会计服务有限公司河北雄安分公司' ? '河北雄安分公司' : '高碑店分公司'}`
              ) : (
                config.title
              )}
            </Text>
            {config.englishTitle && <Text style={styles.companyNameEn}>{config.englishTitle}</Text>}
            <Text style={styles.contactInfo}>咨询电话：{config.phone}</Text>
            {config.englishTitle && <Text style={styles.companyRegistration}>Company Registration</Text>}
          </View>
        </View>
      </View>

      {/* 合同标题 */}
      <Text style={styles.contractTitle}>
        {isMaixinProductService ? '产品服务协议' : '中岳产品服务协议'}
      </Text>

      {/* 合同双方信息 */}
      <View style={styles.partiesSection}>
        {/* 委托方信息块 */}
        <View style={styles.partyBlock}>
          <View style={styles.partyHeader}>
            <Text style={styles.partyLabel}>【委托方】（甲方）：</Text>
            <Text style={styles.partyCompanyName}>{contractData.partyACompany || '-'}</Text>
          </View>

          <View style={styles.partyDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>通讯地址：</Text>
              <Text style={styles.detailValue}>{contractData.partyAAddress || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>联系人：</Text>
              <Text style={styles.detailValue}>{contractData.partyAContact || '-'}</Text>
              <Text style={styles.detailLabel}>联系电话：</Text>
              <Text style={styles.detailValue}>{contractData.partyAPhone || '-'}</Text>
            </View>
          </View>
        </View>

        {/* 受托方信息块 */}
        <View style={styles.partyBlock}>
          <View style={styles.partyHeader}>
            <Text style={styles.partyLabel}>【受托方】（乙方）：</Text>
            <Text style={styles.partyCompanyName}>{config.title}</Text>
          </View>

          <View style={styles.partyDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>通讯地址：</Text>
              <Text style={styles.detailValue}>{config.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>联系人：</Text>
              <Text style={styles.detailValue}>{contractData.partyBContact || '-'}</Text>
              <Text style={styles.detailLabel}>联系电话：</Text>
              <Text style={styles.detailValue}>{contractData.partyBPhone || '-'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 委托服务项目及费用 */}
      <View style={styles.agreementSection}>
        <Text style={styles.sectionTitle}>（一）委托服务项目及费用：</Text>
        
        {/* 工商服务 */}
        <View style={styles.sectionContent}>
          <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 5 }]}>1、工商：</Text>
          
          {/* 设立 */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>①设立：</Text>
            {renderPDFServiceItems(contractData.businessEstablishment || [], 'business_establish')}
            {contractData.businessEstablishmentAddress && (
              <Text style={[styles.paragraph, { marginTop: 4 }]}>
                在 {contractData.businessEstablishmentAddress} 为甲方代办工商营业执照。
              </Text>
            )}
          </View>

          {/* 变更 */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>②变更：</Text>
            {renderPDFServiceItems(contractData.businessChange || [], 'business_change')}
          </View>

          {/* 注销 */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>③注销：</Text>
            {renderPDFServiceItems(contractData.businessCancellation || [], 'business_cancel')}
          </View>

          {/* 其他 */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>④其他：</Text>
            {renderPDFServiceItems(contractData.businessOther || [], 'business_other')}
          </View>

          {/* 物料 */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>⑤物料：</Text>
            {renderPDFServiceItems(contractData.businessMaterials || [], 'business_material')}
          </View>

          <Text style={styles.paragraph}>
            备注：{contractData.businessRemark || '-'}，服务费用：{formatCurrency(contractData.businessServiceFee)}元。
          </Text>
        </View>

        {/* 税务服务 */}
        <View style={styles.sectionContent}>
          <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 5 }]}>2、税务：</Text>
          {renderPDFServiceItems(contractData.taxMatters || [], 'tax')}
          <Text style={styles.paragraph}>
            备注：{contractData.taxRemark || '-'}，服务费用：{formatCurrency(contractData.taxServiceFee)}元。
          </Text>
        </View>

        {/* 银行服务 */}
        <View style={styles.sectionContent}>
          <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 5 }]}>3、银行：</Text>
          {renderPDFServiceItems(contractData.bankMatters || [], 'bank')}
          <Text style={styles.paragraph}>
            备注：{contractData.bankRemark || '-'}，服务费用：{formatCurrency(contractData.bankServiceFee)}元。
          </Text>
        </View>

        {/* 社保服务 */}
        <View style={styles.sectionContent}>
          <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 5 }]}>4、社保：</Text>
          {renderPDFServiceItems(contractData.socialSecurity || [], 'social')}
          <Text style={styles.paragraph}>
            备注：{contractData.socialSecurityRemark || '-'}，服务费用：{formatCurrency(contractData.socialSecurityServiceFee)}元。
          </Text>
        </View>

        {/* 许可业务 */}
        <View style={styles.sectionContent}>
          <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 5 }]}>5、许可业务：</Text>
          {renderPDFServiceItems(contractData.licenseBusiness || [], 'license')}
          <Text style={styles.paragraph}>
            备注：{contractData.licenseRemark || '-'}，服务费用：{formatCurrency(contractData.licenseServiceFee)}元。
          </Text>
        </View>

        {/* 费用总计 */}
        <View style={{ marginTop: 15, marginBottom: 15 }}>
          <Text style={[styles.paragraph, { fontWeight: 'bold', fontFamily: 'SourceHanSerifCN-Bold' }]}>
            费用总计（人民币）：{formatCurrency(contractData.totalCost)}元
            大写金额（人民币）：{numberToChinese(contractData.totalCost || 0)}。
          </Text>
          <Text style={[styles.paragraph, { fontWeight: 'bold', fontFamily: 'SourceHanSerifCN-Bold' }]}>
            备注：{contractData.otherRemark || '-'}
          </Text>
        </View>
      </View>

      {/* 付款方式 */}
      <View style={styles.agreementSection}>
        <Text style={styles.sectionTitle}>（二）付款方式</Text>
        <Text style={styles.paragraph}>
          请务必及时将详细的付款信息及公司名称、服务协议编号提供于我司，以便我司及时查收款项。本合同签订后，超过3个工作日未支付本合同自动失效。
        </Text>
      </View>

      {/* 甲方权利义务 */}
      <View style={styles.agreementSection}>
        <Text style={styles.sectionTitle}>（三）甲方的权利与义务</Text>
        <View style={styles.sectionContent}>
          <Text style={styles.paragraph}>
            1、甲方应按照约定向乙方提供按现行法律、法规、规章报批项目所需资料、文件。甲方所提供资料文件必须真实、合法、完整、准确，否则造成的全部损失均由甲方承担。
          </Text>
          <Text style={styles.paragraph}>
            2、本协议签署后甲方应当在当日内向乙方一次性支付全部服务费用。若因实际情况甲方提出修改要求，则需另行支付费用：300元（人民币）/次。
          </Text>
          <Text style={styles.paragraph}>
            3、本协议的签署表示甲方同意委托乙方及关联服务机构或其他具有资质的合作服务商共同为其提供商事服务：如有必要，甲方应按照乙方安排与乙方关联服务机构或其他具有资质的合作服务商签署服务或咨询合同。
          </Text>
          <Text style={styles.paragraph}>
            4、甲方取得代办证照及材料应当用于合法经营，如利用代办证照及材料从事违法及非法经营活动，所产生的一切责任由甲方承担。
          </Text>
          <Text style={styles.paragraph}>
            5、本协议履行完毕后，甲方应依法开展民事活动，因甲方非法经营、失联、违约等所产生的法律后果与乙方无关。
          </Text>
        </View>
      </View>

      {/* 乙方权利义务 */}
      <View style={styles.agreementSection}>
        <Text style={styles.sectionTitle}>（四）乙方的权利与义务</Text>
        <View style={styles.sectionContent}>
          <Text style={styles.paragraph}>
            1、乙方通过书面或电子邮件等方式为甲方提供服务解决方案、所需条件、资料文件并及时向甲方报告委托事项的进展。
          </Text>
          <Text style={styles.paragraph}>
            2、乙方服务时限自甲方完整提供全部信息、资料、文件时起算，因甲方确认需求、提供资料、签署文件缺失或由于甲方原因导致服务与咨询时间延长不计入服务时限；甲方更改需求后，服务时限重新计算；若因不可抗力因素（包括但不限于自然灾害、社会变动、战争影响、行政机关或服务机构系统网络故障、法律修订、政策变动或被行政机关抽查检查等导致产品失效）导致服务或咨询时限暂停期间不计入服务时限，但乙方应及时将进度等情况告知甲方。
          </Text>
          <Text style={styles.paragraph}>
            3、乙方可委托关联服务机构共同为甲方委托事宜提供服务，关联服务机构的费用由乙方代收代付并全部包含于本合同的总费用中，但本合同另有约定的除外。
          </Text>
          <Text style={styles.paragraph}>
            4、为保障服务时限与质量，乙方确认甲方满足本协议服务或咨询条件时，可通知甲方推进该服务，甲方自收到乙方通知（包括但不限于邮件、微信及短信方式）的30日内无正当理由拒绝提供所需信息、资料、文件，视为放弃该项服务或咨询，乙方不再就该项服务或咨询负有相关义务，因此产生延误、行政处罚、失信公示等后果，乙方不承担相应责任。
          </Text>
          <Text style={styles.paragraph}>
            5、乙方对甲方提供的证件和资料负有妥善保管和保密责任，乙方不得将证件和资料提供给与新企业开业登记（包括工商、质监、税务等部门）无关的其他第三者。
          </Text>
          <Text style={styles.paragraph}>
            6、协议中涉及政府费或第三方服务费，由第三方为甲方开具有效发票。
          </Text>
        </View>
      </View>

      {/* 合同解除条款 */}
      <View style={styles.agreementSection}>
        <Text style={styles.sectionTitle}>（五）合同的解除、终止履行</Text>
        <View style={styles.sectionContent}>
          <Text style={styles.paragraph}>
            1、若甲方出现下列情形，且经乙方有效通知后30个自然日内无法达成合意，乙方有权单方终止本协议，不再承担相应义务：
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （1）甲方无正当理由要求解除本服务协议；甲方的资料、文件未完全披露或含有虚假内容；甲方无正当理由拒绝向行政机关或第三方服务机构缴纳相关费用。
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （2）乙方通知（包括但不限于邮件、短信、微信方式）甲方补充文件、资料，但甲方在合理时间（不少于2个工作日）内无回应或因甲方原因导致服务协议自签署之日起12个自然月内服务或咨询项目仍未正常推进或完结。
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （3）甲方无法按法律、行政法规、规章以及行政机关政策、程序向乙方提供所需资料、文件或无法提供有效联系人、相应经营条件以满足行政机关核查要求等影响服务或咨询推进；甲方的需求因法律、行政法规、规章以及行政机关政策、程序调整而无法实现。
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （4）甲方自有办公场所不符合商事服务条件，且无法更换有效办公场所；甲方投资人、法定代表人或高管人员因信用瑕疵无法投资或任职，且无法更换其他自然人或组织。
          </Text>
          <Text style={styles.paragraph}>
            2、若乙方出现下列情形，且经甲方有效通知后10个自然日内无法达成合意，甲方有权单方终止本协议，不再承担相应义务：
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （1）乙方及其关联方未按协议约定提供咨询与服务。
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （2）乙方提供第三方服务商产品无法完成本协议服务事项，且无其他可替代产品。
          </Text>
          <Text style={styles.paragraph}>
            3、甲方提出书面或邮件退款申请且乙方无异议，视为对本服务协议的解除，双方不再承担本协议项下权利与义务，乙方于本服务中出具的服务费用收据将自动失效且乙方将于十个工作日内按以下内容确定退款金额，完成退款：
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （1）已向行政机关/银行、会计师事务所、报社等服务机构缴纳的官费不予退还；
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （2）因甲方原因终止服务，已占用企业办公场所等产品资源导致第三方服务商扣除全部或部分产品使用费用，该费用不予退还；
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （3）协议解除前已发生服务或咨询项目所需必要的服务费用不予退还；
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （4）因本协议第（五）条第1款原因导致协议终止，乙方有权扣除甲方已缴费用中除上述三项外剩余服务费用的30%作为违约金。
          </Text>
        </View>
      </View>

      {/* 违约责任 */}
      <View style={styles.agreementSection}>
        <Text style={styles.sectionTitle}>（六）违约责任</Text>
        <View style={styles.sectionContent}>
          <Text style={styles.paragraph}>
            1、除由法律规定的连带责任以外，本协议任何一方均不对因协议内容履行不当而导致他方的间接损失承担责任，包括但不限于由本协议引起或与其相关的任何违约或导致一方利润、业务、收益、商誉损失，不论过错方是否已知晓该种损失的可能性。
          </Text>
          <Text style={styles.paragraph}>
            2、乙方在提供商事服务或法律咨询过程中，因不可抗力或各方原因导致服务或咨询无法继续履行，一方应立即将客观情形有效告知对方，并应在十五个工作日内，提供详情及协议内容不能履行、部分不能履行或者需要延期履行理由的有效证明文件；双方依客观情形对履行协议权力义务的程度，协商决定是否解除本协议，或部分免除履行协议责任，或延期履行本协议。
          </Text>
          <Text style={styles.paragraph}>
            3、因不可抗力因素（包括但不限于自然灾害、社会变动、战争影响、网络故障、法律修订、政策变动）导致服务或咨询无法继续，本协议确认解除的，乙方应根据第（五）条第3款内容退还甲方所付服务费用。
          </Text>
        </View>
      </View>

      {/* 其他条款 */}
      <View style={styles.agreementSection}>
        <Text style={styles.sectionTitle}>（七）其他</Text>
        <View style={styles.sectionContent}>
          <Text style={styles.paragraph}>
            1、协议生效后各方应认真自觉遵守，在协议履行过程中发生的争议，各方应协商解决，若协商不成，任何一方应向乙方所在地人民法院提起诉讼。
          </Text>
          <Text style={styles.paragraph}>
            2、本协议签订前各方所发生的委托事宜，甲乙双方在本协议商事服务与法律咨询范围内予以追认。
          </Text>
          <Text style={styles.paragraph}>
            3、本合同为中文版本，并适用中国大陆地区法律，本合同自双方盖章且甲方按约定完成付款之日起生效。
          </Text>
          <Text style={styles.paragraph}>
            4、本协议补充条款经甲乙双方确认后，属于对本协议的有效补充，具有法律效力，乙方员工口头承诺内容未经本协议记载，均不发生法律效力。
          </Text>
          <Text style={styles.paragraph}>
            5、本协议各方所提供的资料、文件均属商业机密，各方不得以任何理由在与本协议服务或咨询无关的场合或其他目的进行披露，政府行政机构依法获得及批准除外。
          </Text>
          <Text style={styles.paragraph}>
            6、本合同一式二份，协议各方各执一份。各份协议文本具有同等法律效力。
          </Text>
        </View>
      </View>

      {/* 签署区域 */}
      <View style={styles.agreementSignatures}>
        <View style={styles.signatureContainer}>
          {/* 签名标题行 */}
          <View style={styles.signatureTitleRow}>
            <View style={styles.signatureTitleColumn}>
              <Text style={styles.signatureTitle}>（甲方盖章）：</Text>
            </View>
            <View style={styles.signatureTitleColumn}>
              <Text style={styles.signatureTitle}>（乙方盖章）：</Text>
            </View>
          </View>

          {/* 盖章空间行 */}
          <View style={styles.signatureStampRow}>
            <View style={styles.signatureStampColumn}>
              <View style={styles.signatureStampSpace}>
                {(contractData.contractSignature || contractData.partyAStampImage) && (
                  <Image
                    src={contractData.contractSignature || contractData.partyAStampImage}
                    style={styles.stampImage}
                  />
                )}
              </View>
            </View>
            <View style={styles.signatureStampColumn}>
              <View style={styles.signatureStampSpace}>
                {getPartyBStampImage(contractData.signatory || '') && (
                  <Image
                    src={getPartyBStampImage(contractData.signatory || '')}
                    style={styles.partyBSign}
                  />
                )}
              </View>
            </View>
          </View>

          {/* 签约日期信息行 */}
          <View style={styles.signatureInfoRow}>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>日期：</Text>
                <Text>{formatDate(contractData.partyASignDate)}</Text>
              </View>
            </View>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>日期：</Text>
                <Text>{formatDate(contractData.partyBSignDate)}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 页脚 */}
      <Text style={styles.footer}>{config.footer}</Text>
      <Text style={styles.footer}>
        中岳服务平台专注于中小微企业服务，主要业务：企业注册、财务代理、人事代理、商标注册、办公租赁、税收筹划、法律服务等。
      </Text>
    </Page>
  )

  // 渲染单项服务合同
  const renderSingleServiceAgreement = () => (
    <Page size="A4" style={styles.page} wrap>
      {/* 合同头部 */}
      <View style={styles.header}>
        <View style={[styles.logoSection, { justifyContent: 'center' }]}>
          <View style={styles.companyInfoNoLogo}>
            <Text style={styles.companyName}>{config.title}</Text>
            {config.englishTitle && <Text style={styles.companyNameEn}>{config.englishTitle}</Text>}
            <Text style={styles.contactInfo}>咨询电话：{config.phone}</Text>
          </View>
        </View>
      </View>

      {/* 合同标题 */}
      <Text style={styles.contractTitle}>
        {contractData.signatory === '保定如你心意企业管理咨询有限公司'
          ? '如你心意产品服务协议'
          : '金盾产品服务协议'}
      </Text>

      {/* 合同双方信息 */}
      <View style={styles.partiesSection}>
        {/* 委托方信息块 */}
        <View style={styles.partyBlock}>
          <View style={styles.partyHeader}>
            <Text style={styles.partyLabel}>【委托方】（甲方）：</Text>
            <Text style={styles.partyCompanyName}>{contractData.partyACompany || '-'}</Text>
          </View>

          <View style={styles.partyDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>通讯地址：</Text>
              <Text style={styles.detailValue}>{contractData.partyAAddress || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>联系人：</Text>
              <Text style={styles.detailValue}>{contractData.partyAContact || '-'}</Text>
              <Text style={[styles.detailLabel, { marginLeft: 20 }]}>联系电话：</Text>
              <Text style={styles.detailValue}>{contractData.partyAPhone || '-'}</Text>
            </View>
          </View>
        </View>

        {/* 受托方信息块 */}
        <View style={styles.partyBlock}>
          <View style={styles.partyHeader}>
            <Text style={styles.partyLabel}>【受托方】（乙方）：</Text>
            <Text style={styles.partyCompanyName}>{config.title}</Text>
          </View>

          <View style={styles.partyDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>通讯地址：</Text>
              <Text style={styles.detailValue}>{config.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>联系人：</Text>
              <Text style={styles.detailValue}>{contractData.partyBContact || '-'}</Text>
              <Text style={[styles.detailLabel, { marginLeft: 20 }]}>联系电话：</Text>
              <Text style={styles.detailValue}>{contractData.partyBPhone || '-'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 委托服务项目及费用 */}
      <View style={styles.agreementSection}>
        <Text style={styles.sectionTitle}>（一）委托服务项目及费用：</Text>
        
        {/* 工商服务 */}
        <View style={styles.sectionContent}>
          <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 5 }]}>1、工商：</Text>
          
          {/* 设立 */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>①设立：</Text>
            {renderPDFServiceItems(contractData.businessEstablishment || [], 'business_establish')}
          </View>

          {contractData.businessEstablishmentAddress && (
            <Text style={[styles.paragraph, { marginTop: 4 }]}>
              在 {contractData.businessEstablishmentAddress} 为甲方代办工商营业执照。
            </Text>
          )}

          {/* 变更 */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>②变更：</Text>
            {renderPDFServiceItems(contractData.businessChange || [], 'business_change')}
          </View>

          {/* 注销 */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>③注销：</Text>
            {renderPDFServiceItems(contractData.businessCancellation || [], 'business_cancel')}
          </View>

          {/* 其他 */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>④其他：</Text>
            {renderPDFServiceItems(contractData.businessOther || [], 'business_other')}
          </View>

          {/* 物料 */}
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 9, marginBottom: 4 }}>⑤物料：</Text>
            {renderPDFServiceItems(contractData.businessMaterials || [], 'business_material')}
          </View>

          <Text style={styles.paragraph}>
            备注：{contractData.businessRemark || '-'}，服务费用：{contractData.businessServiceFee ? `${contractData.businessServiceFee}元` : '-'}
          </Text>
        </View>

        {/* 银行服务 */}
        <View style={styles.sectionContent}>
          <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 5 }]}>2、银行：</Text>
          {renderPDFServiceItems(contractData.bankMatters || [], 'bank')}
          <Text style={styles.paragraph}>
            备注：{contractData.bankRemark || '-'}，服务费用：{contractData.bankServiceFee ? `${contractData.bankServiceFee}元` : '-'}
          </Text>
        </View>

        {/* 许可业务 */}
        <View style={styles.sectionContent}>
          <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 5 }]}>3、许可业务：</Text>
          {renderPDFServiceItems(contractData.licenseBusiness || [], 'license')}
          <Text style={styles.paragraph}>
            备注：{contractData.licenseRemark || '-'}，服务费用：{contractData.licenseServiceFee ? `${contractData.licenseServiceFee}元` : '-'}
          </Text>
        </View>

        {/* 其他服务事项 */}
        <View style={styles.sectionContent}>
          <Text style={[styles.sectionTitle, { fontSize: 10, marginBottom: 5 }]}>4、其他服务事项：</Text>
          <Text style={styles.paragraph}>
            备注：{contractData.otherRemark || '-'}，服务费用：{contractData.otherServiceFee ? `${contractData.otherServiceFee}元` : '-'}
          </Text>
        </View>

        {/* 费用总计 */}
        <View style={{ marginTop: 15, marginBottom: 15 }}>
          <Text style={[styles.paragraph, { fontWeight: 'bold', fontFamily: 'SourceHanSerifCN-Bold' }]}>
            费用总计（人民币）：{contractData.totalCost ? `${contractData.totalCost}元` : '-'}
            大写金额（人民币）：{contractData.totalCost ? numberToChinese(contractData.totalCost) : '-'}
          </Text>
          <Text style={[styles.paragraph, { fontWeight: 'bold', fontFamily: 'SourceHanSerifCN-Bold' }]}>
            备注：{contractData.remarks || '-'}
          </Text>
        </View>
      </View>

      {/* 付款方式 */}
      <View style={styles.agreementSection}>
        <Text style={styles.sectionTitle}>（二）付款方式</Text>
        <Text style={styles.paragraph}>
          请务必及时将详细的付款信息及公司名称、服务协议编号提供于我司，以便我司及时查收款项。本合同签订后，超过 3 个工作日未支付本合同自动失效。
        </Text>
      </View>

      {/* 甲方权利与义务 */}
      <View style={styles.agreementSection}>
        <Text style={styles.sectionTitle}>（三）甲方的权利与义务</Text>
        <View style={styles.sectionContent}>
          <Text style={styles.paragraph}>
            1、甲方应按照约定向乙方提供按现行法律、法规、规章报批项目所需资料、文件。甲方所提供资料文件必须真实、合法、完整、准确，否则造成的全部损失均由甲方承担。
          </Text>
          <Text style={styles.paragraph}>
            2、本协议签署后甲方应当在当日内向乙方一次性支付全部服务费用。若因实际情况甲方提出修改要求，则需另行支付费用：300元（人民币）/次。
          </Text>
          <Text style={styles.paragraph}>
            3、本协议的签署表示甲方同意委托乙方及关联服务机构或其他具有资质的合作服务商共同为其提供商事服务：如有必要，甲方应按照乙方安排与乙方关联服务机构或其他具有资质的合作服务商签署服务或咨询合同。
          </Text>
          <Text style={styles.paragraph}>
            4、甲方取得代办证照及材料应当用于合法经营，如利用代办证照及材料从事违法及非法经营活动，所产生的一切责任由甲方承担。
          </Text>
          <Text style={styles.paragraph}>
            5、本协议履行完毕后，甲方应依法开展民事活动，因甲方非法经营、失联、违约等所产生的法律后果与乙方无关。
          </Text>
        </View>
      </View>

      {/* 乙方权利与义务 */}
      <View style={styles.agreementSection}>
        <Text style={styles.sectionTitle}>（四）乙方的权利与义务</Text>
        <View style={styles.sectionContent}>
          <Text style={styles.paragraph}>
            1、乙方通过书面或电子邮件等方式为甲方提供服务解决方案、所需条件、资料文件并及时向甲方报告委托事项的进展。
          </Text>
          <Text style={styles.paragraph}>
            2、乙方服务时限自甲方完整提供全部信息、资料、文件时起算，因甲方确认需求、提供资料、签署文件缺失或由于甲方原因导致服务与咨询时间延长不计入服务时限；甲方更改需求后，服务时限重新计算；若因不可抗力因素（包括但不限于自然灾害、社会变动、战争影响、行政机关或服务机构系统网络故障、法律修订、政策变动或被行政机关抽查检查等导致产品失效）导致服务或咨询时限暂停期间不计入服务时限，但乙方应及时将进度等情况告知甲方。
          </Text>
          <Text style={styles.paragraph}>
            3、乙方可委托关联服务机构共同为甲方委托事宜提供服务，关联服务机构的费用由乙方代收代付并全部包含于本合同的总费用中，但本合同另有约定的除外。
          </Text>
          <Text style={styles.paragraph}>
            4、为保障服务时限与质量，乙方确认甲方满足本协议服务或咨询条件时，可通知甲方推进该服务，甲方自收到乙方通知（包括但不限于邮件、微信及短信方式）的30日内无正当理由拒绝提供所需信息、资料、文件，视为放弃该项服务或咨询，乙方不再就该项服务或咨询负有相关义务，因此产生延误、行政处罚、失信公示等后果，乙方不承担相应责任。
          </Text>
          <Text style={styles.paragraph}>
            5、乙方对甲方提供的证件和资料负有妥善保管和保密责任，乙方不得将证件和资料提供给与新企业开业登记无关的其他第三者。
          </Text>
          <Text style={styles.paragraph}>
            6、协议中涉及正规费或第三方服务费，由第三方为甲方开具有效发票。
          </Text>
        </View>
      </View>

      {/* 合同解除条款 */}
      <View style={styles.agreementSection}>
        <Text style={styles.sectionTitle}>（五）合同的解除、终止履行</Text>
        <View style={styles.sectionContent}>
          <Text style={styles.paragraph}>
            1、若甲方出现下列情形，且经乙方有效通知后30个自然日内无法达成合意，乙方有权单方终止本协议，不再承担相应义务：
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （1）甲方无正当理由要求解除本服务协议；甲方的资料、文件未完全披露或含有虚假内容；甲方无正当理由拒绝向行政机关或第三方服务机构缴纳相关费用。
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （2）乙方通知（包括但不限于邮件、短信、微信方式）甲方补充文件、资料，但甲方在合理时间（不少于2个工作日）内无回应或因甲方原因导致服务协议自签署之日起12个自然月内服务或咨询项目仍未正常推进或完结。
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （3）甲方无法按法律、行政法规、规章以及行政机关政策、程序向乙方提供所需资料、文件或无法提供有效联系人、相应经营条件以满足行政机关核查要求等影响服务或咨询推进；甲方的需求因法律、行政法规、规章以及行政机关政策、程序调整而无法实现。
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （4）甲方自有办公场所不符合商事服务条件，且无法更换有效办公场所；甲方投资人、法定代表人或高管人员因信用瑕疵无法投资或任职，且无法更换其他自然人或组织。
          </Text>
          <Text style={styles.paragraph}>
            2、若乙方出现下列情形，且经甲方有效通知后10个自然日内无法达成合意，甲方有权单方终止本协议，不再承担相应义务：
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （1）乙方及其关联方未按协议约定提供咨询与服务。
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （2）乙方提供第三方服务商产品无法完成本协议服务事项，且无其他可替代产品。
          </Text>
          <Text style={styles.paragraph}>
            3、甲方提出书面或邮件退款申请且乙方无异议，视为对本服务协议的解除，双方不再承担本协议项下权利与义务，乙方于本服务中出具的服务费用收据将自动失效且乙方将于十个工作日内按以下内容确定退款金额，完成退款：
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （1）已向行政机关/银行、会计师事务所、报社等服务机构缴纳的官费不予退还；
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （2）因甲方原因终止服务，已占用企业办公场所等产品资源导致第三方服务商扣除全部或部分产品使用费用，该费用不予退还；
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （3）协议解除前已发生服务或咨询项目所需必要的服务费用不予退还；
          </Text>
          <Text style={[styles.paragraph, { marginLeft: 15 }]}>
            （4）因本协议第（五）条第1款原因导致协议终止，乙方有权扣除甲方已缴费用中除上述三项外剩余服务费用的30%作为违约金。
          </Text>
        </View>
      </View>

      {/* 违约责任 */}
      <View style={styles.agreementSection}>
        <Text style={styles.sectionTitle}>（六）违约责任</Text>
        <View style={styles.sectionContent}>
          <Text style={styles.paragraph}>
            1、除由法律规定的连带责任以外，本协议任何一方均不对因协议内容履行不当而导致他方的间接损失承担责任，包括但不限于由本协议引起或与其相关的任何违约或导致一方利润、业务、收益、商誉损失，不论过错方是否已知晓该种损失的可能性。
          </Text>
          <Text style={styles.paragraph}>
            2、乙方在提供商事服务或法律咨询过程中，因不可抗力或各方原因导致服务或咨询无法继续履行，一方应立即将客观情形有效告知对方，并应在十五个工作日内，提供详情及协议内容不能履行、部分不能履行或者需要延期履行理由的有效证明文件；双方依客观情形对履行协议权力义务的程度，协商决定是否解除本协议，或部分免除履行协议责任，或延期履行本协议。
          </Text>
          <Text style={styles.paragraph}>
            3、因不可抗力因素（包括但不限于自然灾害、社会变动、战争影响、网络故障、法律修订、政策变动）导致服务或咨询无法继续，本协议确认解除的，乙方应根据第（五）条第3款内容退还甲方所付服务费用。
          </Text>
        </View>
      </View>

      {/* 其他条款 */}
      <View style={styles.agreementSection}>
        <Text style={styles.sectionTitle}>（七）其他</Text>
        <View style={styles.sectionContent}>
          <Text style={styles.paragraph}>
            1、协议生效后各方应认真自觉遵守，在协议履行过程中发生的争议，各方应协商解决，若协商不成，任何一方应向乙方所在地人民法院提起诉讼。
          </Text>
          <Text style={styles.paragraph}>
            2、本协议签订的前各方所发生的委托事宜，甲乙双方在本协议商事服务与法律咨询范围内予以追认。
          </Text>
          <Text style={styles.paragraph}>
            3、本合同为中文版本，并适用中国大陆地区法律，本合同自双方盖章且甲方按约定完成付款之日起生效。
          </Text>
          <Text style={styles.paragraph}>
            4、本协议补充条款经甲乙双方确认后，属于对本协议的有效补充，具有法律效力，乙方员工口头承诺内容未经本协议记载，均不发生法律效力。
          </Text>
          <Text style={styles.paragraph}>
            5、本协议各方所提供的资料、文件均属商业机密，各方不得以任何理由在与本协议服务或咨询无关的场合或其他目的进行披露，政府行政机构依法获得及批准除外。
          </Text>
          <Text style={styles.paragraph}>
            6、本合同一式二份，协议各方各执一份。各份协议文本具有同等法律效力。
          </Text>
        </View>
      </View>

      {/* 签署区域 */}
      <View style={styles.agreementSignatures}>
        <View style={styles.signatureContainer}>
          {/* 签名标题行 */}
          <View style={styles.signatureTitleRow}>
            <View style={styles.signatureTitleColumn}>
              <Text style={styles.signatureTitle}>（甲方盖章）：</Text>
            </View>
            <View style={styles.signatureTitleColumn}>
              <Text style={styles.signatureTitle}>（乙方盖章）：</Text>
            </View>
          </View>

          {/* 盖章空间行 */}
          <View style={styles.signatureStampRow}>
            <View style={styles.signatureStampColumn}>
              <View style={styles.signatureStampSpace}>
                {(contractData.contractSignature || contractData.partyAStampImage) && (
                  <Image
                    src={contractData.contractSignature || contractData.partyAStampImage}
                    style={styles.stampImage}
                  />
                )}
              </View>
            </View>
            <View style={styles.signatureStampColumn}>
              <View style={styles.signatureStampSpace}>
                {getPartyBStampImage(contractData.signatory || '') && (
                  <Image
                    src={getPartyBStampImage(contractData.signatory || '')}
                    style={styles.partyBSign}
                  />
                )}
              </View>
            </View>
          </View>

          {/* 签约日期信息行 */}
          <View style={styles.signatureInfoRow}>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>日期：</Text>
                <Text>{formatDate(contractData.partyASignDate)}</Text>
              </View>
            </View>
            <View style={styles.signatureInfoColumn}>
              <View style={styles.signatureField}>
                <Text style={styles.signatureLabel}>日期：</Text>
                <Text>{formatDate(contractData.partyBSignDate)}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 页脚 */}
      <Text style={styles.footer}>{config.footer}</Text>
    </Page>
  )

  return <Document>{renderContractContent()}</Document>
}

export default ContractPDFDocument
 