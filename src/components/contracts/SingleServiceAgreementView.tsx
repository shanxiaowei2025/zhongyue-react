import React from 'react'
import { Tag } from 'antd'
import dayjs from 'dayjs'
import type { Contract } from '../../types/contract'
import { numberToChinese } from '../../utils/numberToChinese'
import './SingleServiceAgreement.css'

// 签署方配置
const SIGNATORY_CONFIG = {
  保定如你心意企业管理咨询有限公司: {
    title: '保定如你心意企业管理咨询有限公司',
    englishTitle: 'Baoding Ru Ni Xin Yi Enterprise Management Consulting Co., Ltd.',
    address: '河北省保定市定兴县东落堡镇东落堡村264号',
    phone: '13831247565',
    footer: '保定如你心意企业管理咨询有限公司Tel: 13831247565',
  },
  定兴县金盾企业管理咨询有限公司: {
    title: '定兴县金盾企业管理咨询有限公司',
    englishTitle: 'Dingxing County Golden Shield Enterprise Management Consulting Co., Ltd.',
    address: '河北省保定市定兴县定兴镇北肖庄村',
    phone: '13582229111',
    footer: '定兴县金盾企业管理咨询有限公司Tel: 13582229111',
  },
}

// 章图片映射配置
const STAMP_IMAGE_MAP = {
  保定如你心意企业管理咨询有限公司: '/images/runixy-zhang.png',
  定兴县金盾企业管理咨询有限公司: '/images/jindun-zhang.png',
}

// 获取乙方盖章图片
const getPartyBStampImage = (signatory: string): string => {
  return STAMP_IMAGE_MAP[signatory as keyof typeof STAMP_IMAGE_MAP] || ''
}

interface SingleServiceAgreementViewProps {
  contractData: Contract
}

const SingleServiceAgreementView: React.FC<SingleServiceAgreementViewProps> = ({
  contractData,
}) => {
  const config = SIGNATORY_CONFIG[contractData.signatory as keyof typeof SIGNATORY_CONFIG]

  if (!config) {
    return <div className="error-message">不支持的签署方: {contractData.signatory}</div>
  }

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

  // 渲染服务项目标签
  const renderServiceItems = (items: Array<Record<string, any>>) => {
    if (!items || items.length === 0) {
      return <span className="text-gray-400">未选择</span>
    }

    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <Tag key={index} color="default">
            {getItemName(item.itemKey) || item.itemName}
            {item.amount ? ` (${item.amount}元)` : ''}
          </Tag>
        ))}
      </div>
    )
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('YYYY年MM月DD日')
  }

  // 处理日期显示
  const getFormattedDate = (date: any) => {
    if (!date) return '-'
    if (typeof date === 'string') return formatDate(date)
    if (date instanceof Date) return formatDate(date.toISOString())
    return '-'
  }

  return (
    <div className="single-service-agreement">
      {/* 合同头部 */}
      <div className="contract-header">
        <div className="company-info">
          <h2 className="company-name">{config.title}</h2>
          {config.englishTitle && <p className="company-name-en">{config.englishTitle}</p>}
          <p className="contact-info">咨询电话：{config.phone}</p>
        </div>
      </div>

      {/* 合同标题 */}
      <div className="contract-title">
        <h1>{contractData.signatory === '保定如你心意企业管理咨询有限公司' ? '如你心意产品服务协议' : '金盾产品服务协议'}</h1>
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
            <div className="detail-row">
              <span className="detail-label">联系人：</span>
              <span className="detail-value" style={{ width: '200px' }}>{contractData.partyAContact || '-'}</span>
              <span className="detail-label" style={{ marginLeft: '20px' }}>联系电话：</span>
              <span className="detail-value">{contractData.partyAPhone || '-'}</span>
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
            <div className="detail-row">
              <span className="detail-label">联系人：</span>
              <span className="detail-value" style={{ width: '200px' }}>{contractData.partyBContact || '-'}</span>
              <span className="detail-label" style={{ marginLeft: '20px' }}>联系电话：</span>
              <span className="detail-value">{contractData.partyBPhone || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 委托服务项目及费用 */}
      <div className="contract-section">
        <div className="section-title">（一）&nbsp;&nbsp;委托服务项目及费用：</div>
        <div className="section-content">
          {/* 工商服务 */}
          <div className="service-category">
            <div className="category-title">1、工商：</div>
            
            {/* 设立 */}
            <div className="mb-10">
              <div className="mb-5">①设立：</div>
              {renderServiceItems(contractData.businessEstablishment || [])}
            </div>
            
            {contractData.businessEstablishmentAddress && (
              <div className="mb-10">
                <span>在 {contractData.businessEstablishmentAddress} 为甲方代办工商营业执照。</span>
              </div>
            )}

            {/* 变更 */}
            <div className="mb-10">
              <div className="mb-5">②变更：</div>
              {renderServiceItems(contractData.businessChange || [])}
            </div>

            {/* 注销 */}
            <div className="mb-10">
              <div className="mb-5">③注销：</div>
              {renderServiceItems(contractData.businessCancellation || [])}
            </div>

            {/* 其他 */}
            <div className="mb-10">
              <div className="mb-5">④其他：</div>
              {renderServiceItems(contractData.businessOther || [])}
            </div>

            {/* 物料 */}
            <div className="mb-10">
              <div className="mb-5">⑤物料:</div>
              {renderServiceItems(contractData.businessMaterials || [])}
            </div>

            <div className="remark-row">
              <span className="remark-label">备注：</span>
              <span className="remark-content">{contractData.businessRemark || '-'}</span>
              <span className="remark-label">服务费用：</span>
              <span className="remark-content" style={{ width: '150px' }}>
                {contractData.businessServiceFee ? `${contractData.businessServiceFee}元` : '-'}
              </span>
            </div>
          </div>

          {/* 银行服务 */}
          <div className="service-category">
            <div className="category-title">2、银行：</div>
            <div className="mb-10">
              {renderServiceItems(contractData.bankMatters || [])}
            </div>

            <div className="remark-row">
              <span className="remark-label">备注：</span>
              <span className="remark-content">{contractData.bankRemark || '-'}</span>
              <span className="remark-label">服务费用：</span>
              <span className="remark-content" style={{ width: '150px' }}>
                {contractData.bankServiceFee ? `${contractData.bankServiceFee}元` : '-'}
              </span>
            </div>
          </div>

          {/* 许可业务 */}
          <div className="service-category">
            <div className="category-title">3、许可业务：</div>
            <div className="mb-10">
              {renderServiceItems(contractData.licenseBusiness || [])}
            </div>

            <div className="remark-row">
              <span className="remark-label">备注：</span>
              <span className="remark-content">{contractData.licenseRemark || '-'}</span>
              <span className="remark-label">服务费用：</span>
              <span className="remark-content" style={{ width: '150px' }}>
                {contractData.licenseServiceFee ? `${contractData.licenseServiceFee}元` : '-'}
              </span>
            </div>
          </div>

          {/* 其他服务事项 */}
          <div className="service-category">
            <div className="category-title">其他服务事项</div>

            <div className="remark-row">
              <span className="remark-label">备注：</span>
              <span className="remark-content">{contractData.otherRemark || '-'}</span>
              <span className="remark-label">服务费用：</span>
              <span className="remark-content" style={{ width: '150px' }}>
                {contractData.otherServiceFee ? `${contractData.otherServiceFee}元` : '-'}
              </span>
            </div>
          </div>

          {/* 费用总计 */}
          <div className="fee-row">
            <span className="fee-label">费用总计（人民币）：</span>
            <span className="fee-amount">{contractData.totalCost ? `${contractData.totalCost}元` : '-'}</span>
            <span>大写金额（人民币）：</span>
            <span className="fee-words">
              {contractData.totalCost ? numberToChinese(contractData.totalCost) : '-'}
            </span>
          </div>

          {/* 备注 */}
          {contractData.remarks && (
            <div className="remark-row">
              <span className="remark-label">备注：</span>
              <span className="remark-content">{contractData.remarks}</span>
            </div>
          )}
        </div>
      </div>

      {/* 付款方式 */}
      <div className="contract-section">
        <div className="section-title">（二）&nbsp;&nbsp;付款方式</div>
        <div className="section-content">
          <p>请务必及时将详细的付款信息及公司名称、服务协议编号提供于我司，以便我司及时查收款项。 本合同签订后，超过 3 个工作日未支付本合同自动失效。</p>
        </div>
      </div>

      {/* 合同条款 */}
      <div className="contract-terms">
        {/* 甲方权利与义务 */}
        <div className="term-section">
          <div className="term-title">（三）&nbsp;&nbsp;甲方的权利与义务</div>
          <div className="term-content">
            <p className="term-item">1、 甲方应按照约定向乙方提供按现行法律、法规、规章报批项目所需资料、文件。甲方所提供资料文件必须真实、合法、完整、准确，否则造成的全部损失均由甲方承担。</p>
            <p className="term-item">2、 本协议签署后甲方应当在当日内向乙方一次性支付全部服务费用。若因实际情况甲方提出修改要求，则需另行支付费用：300 元（人民币）/次。</p>
            <p className="term-item">3、 本协议的签署表示甲方同意委托乙方及关联服务机构或其他具有资质的合作服务商共同为其提供商事服务：如有必要，甲方应按照乙方安排与乙方关联服务机构或其他具有资质的合作服务商签署服务或咨询合同。</p>
            <p className="term-item">4、甲方取得代办证照及材料应当用于合法经营，如利用代办证照及材料从事违法及非法经营活动，所产生的一切责任由甲方承担。</p>
            <p className="term-item">5、 本协议履行完毕后，甲方应依法开展民事活动，因甲方非法经营、失联、违约等所产生的法律后果与乙方无关。</p>
          </div>
        </div>

        {/* 合同签章 */}
        <div className="contract-signatures">
          <div className="signature-block">
            <div className="signature-title">（甲方盖章）：</div>
            <div className="signature-content">
              {contractData.partyAStampImage && (
                <img src={contractData.partyAStampImage} alt="甲方盖章" className="stamp-image" />
              )}
            </div>
            <div className="signature-date">
              <div className="date-label">日期：</div>
              <div className="date-field">
                {contractData.partyASignDate ? getFormattedDate(contractData.partyASignDate) : '-'}
              </div>
            </div>
          </div>

          <div className="signature-block">
            <div className="signature-title">（乙方盖章）：</div>
            <div className="signature-content">
              <img src={getPartyBStampImage(contractData.signatory || '')} alt="乙方盖章" className="stamp-image" />
            </div>
            <div className="signature-date">
              <div className="date-label">日期：</div>
              <div className="date-field">
                {contractData.partyBSignDate ? getFormattedDate(contractData.partyBSignDate) : '-'}
              </div>
            </div>
          </div>
        </div>

        {/* 合同页脚 */}
        <div className="contract-footer">
          {config.footer}
        </div>
      </div>
    </div>
  )
}

export default SingleServiceAgreementView 