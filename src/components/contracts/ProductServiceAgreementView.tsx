import React from 'react'
import { Tag } from 'antd'
import dayjs from 'dayjs'
import type { Contract } from '../../types/contract'
import { numberToChinese } from '../../utils/numberToChinese'
import './ProductServiceAgreement.css'

// 签署方配置
const SIGNATORY_CONFIG = {
  定兴县中岳会计服务有限公司: {
    title: '定兴县中岳会计服务有限公司',
    englishTitle: 'Dingxing County Zhongyue Accounting Service Co., Ltd.',
    address: '河北省保定市定兴县繁兴街佶地国际D-1-120',
    phone: '15030201110',
    footer: '定兴县中岳会计服务有限公司Tel: 15030201110',
  },
  定兴县中岳会计服务有限公司河北雄安分公司: {
    title: '定兴县中岳会计服务有限公司河北雄安分公司',
    englishTitle: 'Dingxing County Zhongyue Accounting Service Co., Ltd.',
    address: '河北省雄安新区容城县容城镇容善路39号',
    phone: '15030201110',
    footer: '定兴县中岳会计服务有限公司河北雄安分公司Tel: 15030201110',
  },
  定兴县中岳会计服务有限公司高碑店分公司: {
    title: '定兴县中岳会计服务有限公司高碑店分公司',
    englishTitle: 'Dingxing County Zhongyue Accounting Service Co., Ltd.',
    address: '高碑店市北城街道京广北大街188号A07',
    phone: '15030201110',
    footer: '定兴县中岳会计服务有限公司高碑店分公司Tel: 15030201110',
  },
  保定脉信会计服务有限公司: {
    title: '保定脉信会计服务有限公司',
    englishTitle: '',
    address: '河北省保定市容城县容城镇容美路',
    phone: '15030201110',
    footer: '保定脉信会计服务有限公司Tel: 15030201110',
  },
}

// 章图片映射配置
const STAMP_IMAGE_MAP = {
  定兴县中岳会计服务有限公司: '/images/contract-seals/dingxing-seal.jpg',
  定兴县中岳会计服务有限公司河北雄安分公司: '/images/contract-seals/xiongan-seal.jpg',
  定兴县中岳会计服务有限公司高碑店分公司: '/images/contract-seals/gaobeidian-seal.jpg',
  保定脉信会计服务有限公司: '/images/contract-seals/maixin-seal.jpg',
}

// 获取乙方盖章图片
const getPartyBStampImage = (signatory: string): string => {
  return STAMP_IMAGE_MAP[signatory as keyof typeof STAMP_IMAGE_MAP] || ''
}

interface ProductServiceAgreementViewProps {
  contractData: Contract
}

const ProductServiceAgreementView: React.FC<ProductServiceAgreementViewProps> = ({
  contractData,
}) => {
  const config = SIGNATORY_CONFIG[contractData.signatory as keyof typeof SIGNATORY_CONFIG]

  if (!config) {
    return <div className="error-message">不支持的签署方: {contractData.signatory}</div>
  }

  // 检查是否是脉信公司的产品服务协议
  const isMaixinProductService =
    contractData.signatory === '保定脉信会计服务有限公司' &&
    contractData.contractType === '产品服务协议'

  // 获取项目名称
  const getItemName = (itemKey: string): string => {
    const itemNameMap: Record<string, string> = {
      // 工商项目
      business_establish_limited: '有限责任公司',
      business_establish_branch: '有限责任公司分支机构',
      business_establish_individual: '个人独资企业',
      business_establish_partnership: '合伙企业',
      business_establish_nonprofit: '民办非企业',
      business_establish_joint_stock: '股份有限公司',
      business_establish_self_employed: '个体工商户',
      business_change_legal_person: '法定代表人',
      business_change_shareholder: '股东股权',
      business_change_capital: '注册资金',
      business_change_name: '公司名称',
      business_change_scope: '经营范围',
      business_change_address: '注册地址',
      business_change_manager: '分公司负责人',
      business_change_directors: '董事/监事人员',
      business_cancel_limited: '有限责任公司',
      business_cancel_branch: '有限责任公司分支机构',
      business_cancel_individual: '个人独资企业',
      business_cancel_partnership: '合伙企业',
      business_cancel_foreign: '外商投资企业',
      business_cancel_joint_stock: '股份有限公司',
      business_cancel_self_employed: '个体工商户',
      business_other_annual_report: '年报公示',
      business_other_remove_exception: '解除异常',
      business_other_info_repair: '信息修复',
      business_other_file_retrieval: '档案调取',
      business_other_license_annual: '许可证年检',
      business_address_small_scale: '地址托管-小规模',
      business_address_general: '地址托管-一般纳税人',
      business_material_seal: '备案章',
      business_material_rubber: '胶皮章',
      business_material_crystal: '水晶章',
      business_material_kt_board: 'KT板牌子',
      business_material_copper: '铜牌',
      // 税务项目
      tax_assessment: '核定税种',
      tax_filing: '报税',
      tax_cancellation: '注销',
      tax_invoice_apply: '申请发票',
      tax_invoice_issue: '代开发票',
      tax_change: '税务变更',
      tax_remove_exception: '解除异常',
      tax_supplement: '补充申报',
      tax_software: '记账软件',
      tax_invoice_software: '开票软件',
      // 银行项目
      bank_general_account: '一般账户设立',
      bank_basic_account: '基本账户设立',
      bank_foreign_account: '外币账户设立',
      bank_info_change: '信息变更',
      bank_cancel: '银行账户注销',
      bank_financing: '融资业务（开通平台手续）',
      bank_loan: '贷款服务',
      // 社保项目
      social_security_open: '社保开户',
      social_security_hosting: '社保托管',
      social_security_cancel: '社保账户注销',
      fund_open: '公积金开户',
      fund_hosting: '公积金托管',
      fund_change: '公积金变更',
      // 许可业务项目
      license_food: '食品经营许可证',
      license_health: '卫生许可证',
      license_catering: '餐饮许可证',
      license_transport: '道路运输许可证',
      license_medical: '二类医疗器械备案',
      license_other: '其他许可证',
      license_prepackaged: '预包装食品备案',
    }

    return itemNameMap[itemKey] || itemKey
  }

  // 获取所有可能的选项，根据不同类别
  const getAllPossibleItems = (category: string): Array<{ itemKey: string; itemName: string }> => {
    const allItems: Record<string, string[]> = {
      business_establish: [
        'business_establish_limited',
        'business_establish_branch',
        'business_establish_individual',
        'business_establish_partnership',
        'business_establish_nonprofit',
        'business_establish_joint_stock',
        'business_establish_self_employed',
      ],
      business_change: [
        'business_change_legal_person',
        'business_change_shareholder',
        'business_change_capital',
        'business_change_name',
        'business_change_scope',
        'business_change_address',
        'business_change_manager',
        'business_change_directors',
      ],
      business_cancel: [
        'business_cancel_limited',
        'business_cancel_branch',
        'business_cancel_individual',
        'business_cancel_partnership',
        'business_cancel_foreign',
        'business_cancel_joint_stock',
        'business_cancel_self_employed',
      ],
      business_other: [
        'business_other_annual_report',
        'business_other_remove_exception',
        'business_other_info_repair',
        'business_other_file_retrieval',
        'business_other_license_annual',
        'business_address_small_scale',
        'business_address_general',
      ],
      business_material: [
        'business_material_seal',
        'business_material_rubber',
        'business_material_crystal',
        'business_material_kt_board',
        'business_material_copper',
      ],
      tax: [
        'tax_assessment',
        'tax_filing',
        'tax_cancellation',
        'tax_invoice_apply',
        'tax_invoice_issue',
        'tax_change',
        'tax_remove_exception',
        'tax_supplement',
        'tax_software',
        'tax_invoice_software',
      ],
      bank: [
        'bank_general_account',
        'bank_basic_account',
        'bank_foreign_account',
        'bank_info_change',
        'bank_cancel',
        'bank_financing',
        'bank_loan',
      ],
      social: [
        'social_security_open',
        'social_security_hosting',
        'social_security_cancel',
        'fund_open',
        'fund_hosting',
        'fund_change',
      ],
      license: [
        'license_food',
        'license_health',
        'license_catering',
        'license_transport',
        'license_medical',
        'license_other',
        'license_prepackaged',
      ],
    }

    return (allItems[category] || []).map(itemKey => ({
      itemKey,
      itemName: getItemName(itemKey),
    }))
  }

  // 检查项目是否被选中
  const isItemSelected = (items: Array<Record<string, any>> = [], itemKey: string): boolean => {
    return items.some(item => item.itemKey === itemKey)
  }

  // 获取项目的金额
  const getItemAmount = (
    items: Array<Record<string, any>> = [],
    itemKey: string
  ): string | null => {
    const item = items.find(item => item.itemKey === itemKey)
    return item && item.amount ? `${item.amount}` : null
  }

  // 渲染服务项目标签
  const renderServiceItems = (items: Array<Record<string, any>> = [], category: string) => {
    // 获取所有可能的选项
    const allPossibleItems = getAllPossibleItems(category)

    if (allPossibleItems.length === 0) {
      return <span className="text-gray-400">未选择</span>
    }

    return (
      <div className="service-items-container">
        {allPossibleItems.map((possibleItem, index) => {
          const isSelected = isItemSelected(items, possibleItem.itemKey)
          const amount = getItemAmount(items, possibleItem.itemKey)

          return (
            <span
              key={possibleItem.itemKey}
              className={isSelected ? 'service-item-checked' : 'service-item-unchecked'}
            >
              <span className="checkbox-view">
                <span
                  className={isSelected ? 'checkbox-view-checked' : 'checkbox-view-unchecked'}
                />
              </span>
              {possibleItem.itemName}
              {amount && <span className="service-item-amount">（{amount}元）</span>}
            </span>
          )
        })}
      </div>
    )
  }

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return dayjs(dateString).format('YYYY年MM月DD日')
  }

  return (
    <div className="product-service-agreement">
      {/* 合同头部 */}
      <div className="contract-header">
        <div className="logo-section">
          {!isMaixinProductService && (
            <img src="/images/contract-logo.png" alt="公司logo" className="company-logo" />
          )}
          <div
            className="company-info"
            style={isMaixinProductService ? { paddingLeft: 0, borderLeft: 'none' } : {}}
          >
            <h2 className="company-name">
              {contractData.signatory === '定兴县中岳会计服务有限公司河北雄安分公司' ||
              contractData.signatory === '定兴县中岳会计服务有限公司高碑店分公司' ? (
                <>
                  定兴县中岳会计服务有限公司
                  <br />
                  {contractData.signatory === '定兴县中岳会计服务有限公司河北雄安分公司'
                    ? '河北雄安分公司'
                    : '高碑店分公司'}
                </>
              ) : (
                config.title
              )}
            </h2>
            {config.englishTitle && <p className="company-name-en">{config.englishTitle}</p>}
            <p className="contact-info">咨询电话：{config.phone}</p>
            {config.englishTitle && <p className="company-registration">Company Registration</p>}
          </div>
        </div>
      </div>

      {/* 合同标题 */}
      <div className="contract-title">
        <h1>{isMaixinProductService ? '产品服务协议' : '中岳产品服务协议'}</h1>
      </div>

      {/* 合同双方信息 */}
      <div className="contract-parties">
        {/* 委托方信息块 */}
        <div className="party-block">
          <div className="party-header">
            <span className="party-label">【委托方】（甲方）：</span>
            <span className="party-company-name">{contractData.partyACompany || '-'}</span>
          </div>

          <div className="party-details">
            <div className="detail-row">
              <span className="detail-label">通讯地址：</span>
              <span className="detail-value">{contractData.partyAAddress || '-'}</span>
            </div>

            <div className="contact-row">
              <div className="contact-item">
                <span className="contact-label">联系人：</span>
                <span className="contact-value">{contractData.partyAContact || '-'}</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">联系电话：</span>
                <span className="contact-value">{contractData.partyAPhone || '-'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 受托方信息块 */}
        <div className="party-block">
          <div className="party-header">
            <span className="party-label">【受托方】（乙方）：</span>
            <span className="party-company-name">{config.title}</span>
          </div>

          <div className="party-details">
            <div className="detail-row">
              <span className="detail-label">通讯地址：</span>
              <span className="detail-value">{config.address}</span>
            </div>

            <div className="contact-row">
              <div className="contact-item">
                <span className="contact-label">联系人：</span>
                <span className="contact-value">{contractData.partyBContact || '-'}</span>
              </div>
              <div className="contact-item">
                <span className="contact-label">联系电话：</span>
                <span className="contact-value">{contractData.partyBPhone || '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 委托服务项目及费用 */}
      <div className="service-section">
        <h3>（一）委托服务项目及费用：</h3>

        {/* 工商服务 */}
        <div className="service-category">
          <h4>1、工商：</h4>

          <div className="service-item">
            <span>①设立：</span>
            <div className="service-content">
              {renderServiceItems(contractData.businessEstablishment || [], 'business_establish')}
            </div>
            {contractData.businessEstablishmentAddress && (
              <div className="service-description">
                <span>在 </span>
                <span className="location-value">{contractData.businessEstablishmentAddress}</span>
                <span> 为甲方代办工商营业执照。</span>
              </div>
            )}
          </div>

          <div className="service-item">
            <span>②变更：</span>
            <div className="service-content">
              {renderServiceItems(contractData.businessChange || [], 'business_change')}
            </div>
          </div>

          <div className="service-item">
            <span>③注销：</span>
            <div className="service-content">
              {renderServiceItems(contractData.businessCancellation || [], 'business_cancel')}
            </div>
          </div>

          <div className="service-item">
            <span>④其他：</span>
            <div className="service-content">
              {renderServiceItems(contractData.businessOther || [], 'business_other')}
            </div>
          </div>

          <div className="service-item">
            <span>⑤物料：</span>
            <div className="service-content">
              {renderServiceItems(contractData.businessMaterials || [], 'business_material')}
            </div>
          </div>

          <div className="service-remark">
            <span>备注：</span>
            <span className="remark-value">{contractData.businessRemark || '-'}</span>
            <span>，服务费用：</span>
            <span className="fee-value">{contractData.businessServiceFee || '-'}</span>
            <span>元。</span>
          </div>
        </div>

        {/* 税务服务 */}
        <div className="service-category">
          <h4>2、税务：</h4>
          <div className="service-content">
            {renderServiceItems(contractData.taxMatters || [], 'tax')}
          </div>
          <div className="service-remark">
            <span>备注：</span>
            <span className="remark-value">{contractData.taxRemark || '-'}</span>
            <span>，服务费用：</span>
            <span className="fee-value">{contractData.taxServiceFee || '-'}</span>
            <span>元。</span>
          </div>
        </div>

        {/* 银行服务 */}
        <div className="service-category">
          <h4>3、银行：</h4>
          <div className="service-content">
            {renderServiceItems(contractData.bankMatters || [], 'bank')}
          </div>
          <div className="service-remark">
            <span>备注：</span>
            <span className="remark-value">{contractData.bankRemark || '-'}</span>
            <span>，服务费用：</span>
            <span className="fee-value">{contractData.bankServiceFee || '-'}</span>
            <span>元。</span>
          </div>
        </div>

        {/* 社保服务 */}
        <div className="service-category">
          <h4>4、社保：</h4>
          <div className="service-content">
            {renderServiceItems(contractData.socialSecurity || [], 'social')}
          </div>
          <div className="service-remark">
            <span>备注：</span>
            <span className="remark-value">{contractData.socialSecurityRemark || '-'}</span>
            <span>，服务费用：</span>
            <span className="fee-value">{contractData.socialSecurityServiceFee || '-'}</span>
            <span>元。</span>
          </div>
        </div>

        {/* 许可业务 */}
        <div className="service-category">
          <h4>5、许可业务：</h4>
          <div className="service-content">
            {renderServiceItems(contractData.licenseBusiness || [], 'license')}
          </div>
          <div className="service-remark">
            <span>备注：</span>
            <span className="remark-value">{contractData.licenseRemark || '-'}</span>
            <span>，服务费用：</span>
            <span className="fee-value">{contractData.licenseServiceFee || '-'}</span>
            <span>元。</span>
          </div>
        </div>

        {/* 费用总计 */}
        <div className="total-cost">
          <div className="cost-row">
            <div className="cost-amount-row">
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>费用总计（人民币）：</span>
              <span className="amount-value" style={{ fontSize: '13px', fontWeight: 'bold' }}>
                {contractData.totalCost || '-'}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>元</span>
              <span className="amount-label" style={{ fontSize: '13px', fontWeight: 'bold' }}>
                大写金额（人民币）：
              </span>
              <span className="amount-text-value" style={{ fontSize: '13px', fontWeight: 'bold' }}>
                {numberToChinese(contractData.totalCost || 0)}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>。</span>
            </div>
          </div>
          <div className="cost-remark">
            <span style={{ fontSize: '13px', fontWeight: 'bold' }}>备注：</span>
            <span className="remark-value" style={{ fontSize: '13px', fontWeight: 'bold' }}>
              {contractData.otherRemark || '-'}
            </span>
          </div>
        </div>
      </div>

      {/* 付款方式 */}
      <div className="payment-section">
        <h3>（二）付款方式</h3>
        <p>
          请务必及时将详细的付款信息及公司名称、服务协议编号提供于我司，以便我司及时查收款项。本合同签订后，超过3个工作日未支付本合同自动失效。
        </p>
      </div>

      {/* 甲方权利义务 */}
      <div className="rights-obligations-section">
        <h3>（三）甲方的权利与义务</h3>

        <div className="obligation-item">
          <p>
            1、甲方应按照约定向乙方提供按现行法律、法规、规章报批项目所需资料、文件。甲方所提供资料文件必须真实、合法、完整、准确，否则造成的全部损失均由甲方承担。
          </p>
        </div>

        <div className="obligation-item">
          <p>
            2、本协议签署后甲方应当在当日内向乙方一次性支付全部服务费用。若因实际情况甲方提出修改要求，则需另行支付费用：300元（人民币）/次。
          </p>
        </div>

        <div className="obligation-item">
          <p>
            3、本协议的签署表示甲方同意委托乙方及关联服务机构或其他具有资质的合作服务商共同为其提供商事服务：如有必要，甲方应按照乙方安排与乙方关联服务机构或其他具有资质的合作服务商签署服务或咨询合同。
          </p>
        </div>

        <div className="obligation-item">
          <p>
            4、甲方取得代办证照及材料应当用于合法经营，如利用代办证照及材料从事违法及非法经营活动，所产生的一切责任由甲方承担。
          </p>
        </div>

        <div className="obligation-item">
          <p>
            5、本协议履行完毕后，甲方应依法开展民事活动，因甲方非法经营、失联、违约等所产生的法律后果与乙方无关。
          </p>
        </div>
      </div>

      {/* 乙方权利义务 */}
      <div className="rights-obligations-section">
        <h3>（四）乙方的权利与义务</h3>

        <div className="obligation-item">
          <p>
            1、乙方通过书面或电子邮件等方式为甲方提供服务解决方案、所需条件、资料文件并及时向甲方报告委托事项的进展。
          </p>
        </div>

        <div className="obligation-item">
          <p>
            2、乙方服务时限自甲方完整提供全部信息、资料、文件时起算，因甲方确认需求、提供资料、签署文件缺失或由于甲方原因导致服务与咨询时间延长不计入服务时限；甲方更改需求后，服务时限重新计算；若因不可抗力因素（包括但不限于自然灾害、社会变动、战争影响、行政机关或服务机构系统网络故障、法律修订、政策变动或被行政机关抽查检查等导致产品失效）导致服务或咨询时限暂停期间不计入服务时限，但乙方应及时将进度等情况告知甲方。
          </p>
        </div>

        <div className="obligation-item">
          <p>
            3、乙方可委托关联服务机构共同为甲方委托事宜提供服务，关联服务机构的费用由乙方代收代付并全部包含于本合同的总费用中，但本合同另有约定的除外。
          </p>
        </div>

        <div className="obligation-item">
          <p>
            4、为保障服务时限与质量，乙方确认甲方满足本协议服务或咨询条件时，可通知甲方推进该服务，甲方自收到乙方通知（包括但不限于邮件、微信及短信方式）的30日内无正当理由拒绝提供所需信息、资料、文件，视为放弃该项服务或咨询，乙方不再就该项服务或咨询负有相关义务，因此产生延误、行政处罚、失信公示等后果，乙方不承担相应责任。
          </p>
        </div>

        <div className="obligation-item">
          <p>
            5、乙方对甲方提供的证件和资料负有妥善保管和保密责任，乙方不得将证件和资料提供给与新企业开业登记（包括工商、质监、税务等部门）无关的其他第三者。
          </p>
        </div>

        <div className="obligation-item">
          <p>6、协议中涉及政府费或第三方服务费，由第三方为甲方开具有效发票。</p>
        </div>
      </div>

      {/* 合同的解除、终止履行 */}
      <div className="termination-section">
        <h3>（五）合同的解除、终止履行</h3>

        <div className="termination-item">
          <p>
            1、若甲方出现下列情形，且经乙方有效通知后30个自然日内无法达成合意，乙方有权单方终止本协议，不再承担相应义务：
          </p>
          <div className="sub-item">
            <p>
              （1）甲方无正当理由要求解除本服务协议；甲方的资料、文件未完全披露或含有虚假内容；甲方无正当理由拒绝向行政机关或第三方服务机构缴纳相关费用。
            </p>
          </div>
          <div className="sub-item">
            <p>
              （2）乙方通知（包括但不限于邮件、短信、微信方式）甲方补充文件、资料，但甲方在合理时间（不少于2个工作日）内无回应或因甲方原因导致服务协议自签署之日起12个自然月内服务或咨询项目仍未正常推进或完结。
            </p>
          </div>
          <div className="sub-item">
            <p>
              （3）甲方无法按法律、行政法规、规章以及行政机关政策、程序向乙方提供所需资料、文件或无法提供有效联系人、相应经营条件以满足行政机关核查要求等影响服务或咨询推进；甲方的需求因法律、行政法规、规章以及行政机关政策、程序调整而无法实现。
            </p>
          </div>
          <div className="sub-item">
            <p>
              （4）甲方自有办公场所不符合商事服务条件，且无法更换有效办公场所；甲方投资人、法定代表人或高管人员因信用瑕疵无法投资或任职，且无法更换其他自然人或组织。
            </p>
          </div>
        </div>

        <div className="termination-item">
          <p>
            2、若乙方出现下列情形，且经甲方有效通知后10个自然日内无法达成合意，甲方有权单方终止本协议，不再承担相应义务：
          </p>
          <div className="sub-item">
            <p>（1）乙方及其关联方未按协议约定提供咨询与服务。</p>
          </div>
          <div className="sub-item">
            <p>（2）乙方提供第三方服务商产品无法完成本协议服务事项，且无其他可替代产品。</p>
          </div>
        </div>

        <div className="termination-item">
          <p>
            3、甲方提出书面或邮件退款申请且乙方无异议，视为对本服务协议的解除，双方不再承担本协议项下权利与义务，乙方于本服务中出具的服务费用收据将自动失效且乙方将于十个工作日内按以下内容确定退款金额，完成退款：
          </p>
          <div className="sub-item">
            <p>（1）已向行政机关/银行、会计师事务所、报社等服务机构缴纳的官费不予退还；</p>
          </div>
          <div className="sub-item">
            <p>
              （2）因甲方原因终止服务，已占用企业办公场所等产品资源导致第三方服务商扣除全部或部分产品使用费用，该费用不予退还；
            </p>
          </div>
          <div className="sub-item">
            <p>（3）协议解除前已发生服务或咨询项目所需必要的服务费用不予退还；</p>
          </div>
          <div className="sub-item">
            <p>
              （4）因本协议第（五）条第1款原因导致协议终止，乙方有权扣除甲方已缴费用中除上述三项外剩余服务费用的30%作为违约金。
            </p>
          </div>
        </div>
      </div>

      {/* 违约责任 */}
      <div className="liability-section">
        <h3>（六）违约责任</h3>

        <div className="liability-item">
          <p>
            1、除由法律规定的连带责任以外，本协议任何一方均不对因协议内容履行不当而导致他方的间接损失承担责任，包括但不限于由本协议引起或与其相关的任何违约或导致一方利润、业务、收益、商誉损失，不论过错方是否已知晓该种损失的可能性。
          </p>
        </div>

        <div className="liability-item">
          <p>
            2、乙方在提供商事服务或法律咨询过程中，因不可抗力或各方原因导致服务或咨询无法继续履行，一方应立即将客观情形有效告知对方，并应在十五个工作日内，提供详情及协议内容不能履行、部分不能履行或者需要延期履行理由的有效证明文件；双方依客观情形对履行协议权力义务的程度，协商决定是否解除本协议，或部分免除履行协议责任，或延期履行本协议。
          </p>
        </div>

        <div className="liability-item">
          <p>
            3、因不可抗力因素（包括但不限于自然灾害、社会变动、战争影响、网络故障、法律修订、政策变动）导致服务或咨询无法继续，本协议确认解除的，乙方应根据第（五）条第3款内容退还甲方所付服务费用。
          </p>
        </div>
      </div>

      {/* 其他条款 */}
      <div className="other-section">
        <h3>（七）其他</h3>

        <div className="other-item">
          <p>
            1、协议生效后各方应认真自觉遵守，在协议履行过程中发生的争议，各方应协商解决，若协商不成，任何一方应向乙方所在地人民法院提起诉讼。
          </p>
        </div>

        <div className="other-item">
          <p>
            2、本协议签订前各方所发生的委托事宜，甲乙双方在本协议商事服务与法律咨询范围内予以追认。
          </p>
        </div>

        <div className="other-item">
          <p>
            3、本合同为中文版本，并适用中国大陆地区法律，本合同自双方盖章且甲方按约定完成付款之日起生效。
          </p>
        </div>

        <div className="other-item">
          <p>
            4、本协议补充条款经甲乙双方确认后，属于对本协议的有效补充，具有法律效力，乙方员工口头承诺内容未经本协议记载，均不发生法律效力。
          </p>
        </div>

        <div className="other-item">
          <p>
            5、本协议各方所提供的资料、文件均属商业机密，各方不得以任何理由在与本协议服务或咨询无关的场合或其他目的进行披露，政府行政机构依法获得及批准除外。
          </p>
        </div>

        <div className="other-item">
          <p>6、本合同一式二份，协议各方各执一份。各份协议文本具有同等法律效力。</p>
        </div>
      </div>

      {/* 签署区域 */}
      <div className="signature-section">
        <div className="signature-row">
          {/* 甲方签署列 */}
          <div className="signature-column">
            <div className="signature-block">
              <div className="signature-item">
                <span>（甲方盖章）：</span>
                <div
                  className={`signature-area ${contractData.contractSignature || contractData.partyAStampImage ? 'signed' : 'unsigned'}`}
                >
                  {contractData.contractSignature ? (
                    <div className="stamp-preview">
                      <img
                        src={contractData.contractSignature}
                        alt="甲方签名"
                        className="stamp-image"
                        style={{
                          maxWidth: '150px',
                          maxHeight: '80px',
                          display: 'block',
                          margin: '10px 0',
                        }}
                      />
                    </div>
                  ) : contractData.partyAStampImage ? (
                    <div className="stamp-preview">
                      <img
                        src={contractData.partyAStampImage}
                        alt="甲方盖章"
                        className="stamp-image"
                        style={{
                          maxWidth: '150px',
                          maxHeight: '80px',
                          display: 'block',
                          margin: '10px 0',
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="date-item">
                <span>日期：</span>
                <span className="date-value">{formatDate(contractData.partyASignDate)}</span>
              </div>
            </div>
          </div>

          {/* 乙方签署列 */}
          <div className="signature-column">
            <div className="signature-block">
              <div className="signature-item">
                <span>（乙方盖章）：</span>
                <div className="signature-area signed">
                  <div className="stamp-preview">
                    <img
                      src={getPartyBStampImage(contractData.signatory || '')}
                      alt="乙方盖章"
                      className="stamp-image"
                      style={{
                        maxWidth: '130px',
                        maxHeight: '130px',
                        display: 'block',
                        margin: '-25px 0 -10px 0',
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="date-item">
                <span>日期：</span>
                <span className="date-value">{formatDate(contractData.partyBSignDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <div className="contract-footer">
        <div className="footer-info">
          <p>{config.footer}</p>
          <p>
            中岳服务平台专注于中小微企业服务，主要业务：企业注册、财务代理、人事代理、商标注册、办公租赁、税收筹划、法律服务等。
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProductServiceAgreementView
