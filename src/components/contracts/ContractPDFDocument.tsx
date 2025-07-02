import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer'
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
} as const

// 章图片映射配置
const STAMP_IMAGE_MAP = {
  定兴县中岳会计服务有限公司: '/images/contract-seals/dingxing-seal.jpg',
  定兴县中岳会计服务有限公司河北雄安分公司: '/images/contract-seals/xiongan-seal.jpg',
  定兴县中岳会计服务有限公司高碑店分公司: '/images/contract-seals/gaobeidian-seal.jpg',
  保定脉信会计服务有限公司: '/images/contract-seals/maixin-seal.jpg',
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
    paddingTop: 30,
    paddingBottom: 30,
    paddingLeft: 30,
    paddingRight: 30,
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
    borderLeftWidth: 2,
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
  },
  partyField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    marginLeft: 15,
  },
  partyContent: {
    flex: 1,
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
    marginLeft: 10,
    marginRight: 10,
  },
  entrustmentPeriod: {
    marginBottom: 10,
  },
  entrustmentText: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'left',
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
    maxWidth: '100%',
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
  },
  checkboxUnchecked: {
    width: 10,
    height: 10,
    backgroundColor: '#fff',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#000',
  },
  serviceLabel: {
    fontSize: 9,
  },
  serviceItemEmpty: {
    fontSize: 9,
    color: '#666',
  },
  otherBusiness: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  otherBusinessLabel: {
    fontWeight: 'bold',
    fontFamily: 'SourceHanSerifCN-Bold',
    fontSize: 9,
    marginRight: 5,
  },
  otherBusinessValue: {
    fontSize: 9,
  },
  // 条款内容
  partyAObligations: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'left',
  },
  partyBObligations: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'left',
  },
  responsibilityDivision: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'left',
  },
  agreementTermination: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'left',
  },
  agencyFeeContent: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'left',
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
  },
  otherAgreements: {
    fontSize: 9,
    lineHeight: 1.4,
    textAlign: 'left',
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
    lineHeight: 1.4,
    marginBottom: 8,
    textAlign: 'left',
  },
  // 页脚
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
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

  // 渲染申报服务选项
  const renderDeclarationServices = () => {
    if (!contractData.declarationService || !Array.isArray(contractData.declarationService)) {
      return (
        <View style={styles.serviceCheckboxes}>
          <Text style={styles.serviceItemEmpty}>未选择</Text>
        </View>
      )
    }

    const selectedServiceMap = contractData.declarationService.reduce(
      (acc, service) => {
        acc[service.value] = true
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
                {isSelected && <Text style={{ fontSize: 8, color: '#000', fontWeight: 'bold' }}>✓</Text>}
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
            {config.englishTitle && (
              <Text style={styles.companyNameEn}>{config.englishTitle}</Text>
            )}
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
        甲方因经营管理需要委托乙方代理发票开具、记账纳税申报。为了维护双方
        合法权益根据《中华人民共和国民法典》及《代理记账管理办法》等法律、法规
        的规定经双方代表友好协商，达成以下协议：
      </Text>

      {/* 一、委托业务范围 */}
      <View style={styles.agreementSection} break={false}>
        <Text style={styles.sectionTitle}>一、委托业务范围</Text>
        <View style={styles.sectionContent}>
          <View style={styles.entrustmentPeriod}>
            <Text style={styles.entrustmentText}>
              乙方接受甲方委托，对甲方
              <Text style={styles.dateValue}>
                {contractData.entrustmentStartDate ? formatDate(contractData.entrustmentStartDate) : '___'}
              </Text>
              日至
              <Text style={styles.dateValue}>
                {contractData.entrustmentEndDate ? formatDate(contractData.entrustmentEndDate) : '___'}
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
          <Text style={styles.paragraph}>(一)甲方的每项经济业务，必须填制或者取得符合国家统一会计制度规定的原始凭证。</Text>
          <Text style={styles.paragraph}>
            (二)甲方应归集和整理有关经济业务的原始凭证和其他资料，并于每月 15
            日前提供给乙方。甲方对所提供资料的完整性、真实性、合法性负责，不得虚报、瞒报收入和支出。
          </Text>
          <Text style={styles.paragraph}>(三)甲方应建立健全与本企业相适应的内部控制制度，保证资产的安全和完整。</Text>
          <Text style={styles.paragraph}>(四)甲方应当配备专人负责日常货币资金的收支和保管。</Text>
          <Text style={styles.paragraph}>
            (五)涉及存货核算的，甲方负责存货的管理与盘点，应建立存货的管理制度，定期清查盘点存货，编制存货的入库凭证、出库凭证、库存明细账及每月各类存货的收发存明细表，并及时
            提供给乙方。甲方对上述资料的真实性和完整性负责，并保证库 存物资的安全和完整。
          </Text>
          <Text style={styles.paragraph}>
            (六)甲方应在法律允许的范围内开展经济业务，遵守会计法、
            税法等法律法规的规定，不得授意和指使乙方违法办理会计事项。
          </Text>
          <Text style={styles.paragraph}>
            (七)对于乙方退回的、要求甲方按照国家统一的会计制度
            规定进行更正、补充的原始凭证，甲方应当及时予以更正、补充。
          </Text>
          <Text style={styles.paragraph}>(八)甲方应积极配合乙方开展代理记账业务，对乙方提出的合理建议应积极采纳</Text>
          <Text style={styles.paragraph}>
            (九)甲方应制定合理的会计资料传递程序，及时将原始凭证等会计资料交乙方，做好会计资料的签收工作。
          </Text>
          <Text style={styles.paragraph}>
            (十)会计年度终了后，乙方将会计档案移交甲方，由甲方负责保管会计档案，保证会计档案的安全和完整。
          </Text>
          <Text style={styles.paragraph}>(十一)甲方委托乙方开具销售发票的，应符合税收相关法律法规，不得要求乙方虚开发票。</Text>
          <Text style={styles.paragraph}>(十二)甲方应按本协议书规定及时足额支付代理记账服务费。</Text>
          <Text style={styles.paragraph}>(十三)甲方应保证在规定的纳税期，银行账户有足额的存款缴纳税款。</Text>
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
          <Text style={styles.paragraph}>(四)乙方应协助甲方完善内部控制，加强内部管理，针对内部控制薄弱环节提出合理的建议。</Text>
          <Text style={styles.paragraph}>
            (五)乙方应协助甲方制定合理的会计资料传递程序，积极配合甲方做好会计资料的签收手续。在代理记账过程中，应妥善
            保管会计资料。
          </Text>
          <Text style={styles.paragraph}>
            (六)乙方应按时将当年应归档的会计资料整理、装订后形成会计档案，于会计年度终了后交甲方保管。本办理交接手续前，由乙方负责保管。
          </Text>
          <Text style={styles.paragraph}>(七)委托协议终止时，乙方应与甲方办理会计业务交接事宜。</Text>
          <Text style={styles.paragraph}>
            (八)乙方接受委托为甲方开具销售发票的，应按照税收法律法规要求为甲方提供代开发票服务，不得代为虚开发票。
          </Text>
          <Text style={styles.paragraph}>(九)乙方对开展业务过程中知悉的商业秘密、个人信息负有保密义务。</Text>
          <Text style={styles.paragraph}>(十)对甲方提出的有关会计处理的相关问题，乙方应当予以正确解释。</Text>
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
          <Text style={styles.paragraph}>(一)协议期满，本协议自然终止，双方如需续约，须另定协议。</Text>
          <Text style={styles.paragraph}>(二)经双方协商一致后，可提前终止协议。</Text>
        </View>
      </View>

      {/* 六、代理记账服务费 */}
      <View style={styles.agreementSection} break={false}>
        <Text style={styles.sectionTitle}>六、代理记账服务费</Text>
        <View style={[styles.sectionContent, styles.agencyFeeContent]}>
          <Text style={styles.paragraph}>
            经协商，乙方代理记账收费标准为：人民币每年
            <Text style={styles.feeValue}>{formatCurrency(contractData.totalAgencyAccountingFee)}</Text>
            元（代理记账费
            <Text style={styles.feeValue}>{formatCurrency(contractData.agencyAccountingFee)}</Text>
            /年，记账软件服务费
            <Text style={styles.feeValue}>{formatCurrency(contractData.accountingSoftwareFee)}</Text>
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
          <Text style={styles.paragraph}>本协议自双方签字之日起生效。本协议一式两份，双方各执一份。</Text>
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

  // 渲染产品服务协议（简化版，可以后续完善）
  const renderProductServiceAgreement = () => (
    <Page size="A4" style={styles.page} wrap>
      <Text style={styles.contractTitle}>
        {isMaixinProductService ? '产品服务协议' : '中岳产品服务协议'}
      </Text>
      <Text>产品服务协议详细内容待完善...</Text>
    </Page>
  )

  // 渲染单项服务合同（简化版，可以后续完善）
  const renderSingleServiceAgreement = () => (
    <Page size="A4" style={styles.page} wrap>
      <Text style={styles.contractTitle}>单项服务合同</Text>
      <Text>单项服务合同详细内容待完善...</Text>
    </Page>
  )

  return (
    <Document>
      {renderContractContent()}
    </Document>
  )
}

export default ContractPDFDocument 