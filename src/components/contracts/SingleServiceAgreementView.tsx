import React from 'react'
import { Tag } from 'antd'
import dayjs from 'dayjs'
import type { Contract } from '../../types/contract'
import { numberToChinese } from '../../utils/numberToChinese'
import styles from './SingleServiceAgreementView.module.css'

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
  保定如你心意企业管理咨询有限公司: '/images/runixinyi-zhang.png',
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
    return <div className={styles.errorMessage}>不支持的签署方: {contractData.signatory}</div>
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
      <span className={styles.serviceItemsText}>
        {items.map((item, index) => (
          <span key={index}>
            {getItemName(item.itemKey) || item.itemName}
            {item.amount ? `(${item.amount}元)` : ''}
            {index < items.length - 1 ? '，' : ''}
          </span>
        ))}
      </span>
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
    <div className={styles.singleServiceAgreement}>
      {/* 合同头部 */}
      <div className={styles.contractHeader}>
        <div className={styles.companyInfo}>
          <h2 className={styles.companyName}>{config.title}</h2>
          {config.englishTitle && <p className={styles.companyNameEn}>{config.englishTitle}</p>}
          <p className={styles.contactInfo}>咨询电话：{config.phone}</p>
        </div>
      </div>

      {/* 合同标题 */}
      <div className={styles.contractTitle}>
        <h1>
          {contractData.signatory === '保定如你心意企业管理咨询有限公司'
            ? '如你心意产品服务协议'
            : '金盾产品服务协议'}
        </h1>
      </div>

      {/* 合同双方信息 */}
      <div className={styles.contractParties}>
        {/* 委托方信息块 */}
        <div className={styles.partyBlock}>
          <div className={styles.partyHeader}>
            <span className={styles.partyLabel}>【委托方】（甲方）：</span>
            <span className={styles.partyCompanyName}>{contractData.partyACompany || '-'}</span>
          </div>

          <div className={styles.partyDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>通讯地址：</span>
              <span className={styles.detailValue}>{contractData.partyAAddress || '-'}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>联系人：</span>
              <span className={styles.detailValue} style={{ width: '200px' }}>
                {contractData.partyAContact || '-'}
              </span>
              <span className={styles.detailLabel} style={{ marginLeft: '20px' }}>
                联系电话：
              </span>
              <span className={styles.detailValue}>{contractData.partyAPhone || '-'}</span>
            </div>
          </div>
        </div>

        {/* 受托方信息块 */}
        <div className={styles.partyBlock}>
          <div className={styles.partyHeader}>
            <span className={styles.partyLabel}>【受托方】（乙方）：</span>
            <span className={styles.partyCompanyName}>{config.title}</span>
          </div>

          <div className={styles.partyDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>通讯地址：</span>
              <span className={styles.detailValue}>{config.address}</span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>联系人：</span>
              <span className={styles.detailValue} style={{ width: '200px' }}>
                {contractData.partyBContact || '-'}
              </span>
              <span className={styles.detailLabel} style={{ marginLeft: '20px' }}>
                联系电话：
              </span>
              <span className={styles.detailValue}>{contractData.partyBPhone || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 委托服务项目及费用 */}
      <div className={styles.contractSection}>
        <div className={styles.sectionTitle}>（一）&nbsp;&nbsp;委托服务项目及费用：</div>
        <div className={styles.sectionContent}>
          {/* 工商服务 */}
          <div className={styles.serviceCategory}>
            <div className={styles.categoryTitle}>1、工商：</div>

            {/* 设立 */}
            <div className={styles.mb10}>
              <div className={styles.mb5}>①设立：</div>
              {renderServiceItems(contractData.businessEstablishment || [])}
            </div>

            {contractData.businessEstablishmentAddress && (
              <div className={styles.mb10}>
                <span>在 {contractData.businessEstablishmentAddress} 为甲方代办工商营业执照。</span>
              </div>
            )}

            {/* 变更 */}
            <div className={styles.mb10}>
              <div className={styles.mb5}>②变更：</div>
              {renderServiceItems(contractData.businessChange || [])}
            </div>

            {/* 注销 */}
            <div className={styles.mb10}>
              <div className={styles.mb5}>③注销：</div>
              {renderServiceItems(contractData.businessCancellation || [])}
            </div>

            {/* 其他 */}
            <div className={styles.mb10}>
              <div className={styles.mb5}>④其他：</div>
              {renderServiceItems(contractData.businessOther || [])}
            </div>

            {/* 物料 */}
            <div className={styles.mb10}>
              <div className={styles.mb5}>⑤物料:</div>
              {renderServiceItems(contractData.businessMaterials || [])}
            </div>

            <div className={styles.remarkRow}>
              <span className={styles.remarkLabel}>备注：</span>
              <span className={styles.remarkContent}>{contractData.businessRemark || '-'}</span>
              <span className={styles.remarkLabel}>服务费用：</span>
              <span className={styles.remarkContent}>
                {contractData.businessServiceFee ? `${contractData.businessServiceFee}元` : '-'}
              </span>
            </div>
          </div>

          {/* 银行服务 */}
          <div className={styles.serviceCategory}>
            <div className={styles.categoryTitle}>2、银行：</div>
            <div className={styles.mb10}>{renderServiceItems(contractData.bankMatters || [])}</div>

            <div className={styles.remarkRow}>
              <span className={styles.remarkLabel}>备注：</span>
              <span className={styles.remarkContent}>{contractData.bankRemark || '-'}</span>
              <span className={styles.remarkLabel}>服务费用：</span>
              <span className={styles.remarkContent}>
                {contractData.bankServiceFee ? `${contractData.bankServiceFee}元` : '-'}
              </span>
            </div>
          </div>

          {/* 许可业务 */}
          <div className={styles.serviceCategory}>
            <div className={styles.categoryTitle}>3、许可业务：</div>
            <div className={styles.mb10}>
              {renderServiceItems(contractData.licenseBusiness || [])}
            </div>

            <div className={styles.remarkRow}>
              <span className={styles.remarkLabel}>备注：</span>
              <span className={styles.remarkContent}>{contractData.licenseRemark || '-'}</span>
              <span className={styles.remarkLabel}>服务费用：</span>
              <span className={styles.remarkContent}>
                {contractData.licenseServiceFee ? `${contractData.licenseServiceFee}元` : '-'}
              </span>
            </div>
          </div>

          {/* 其他服务事项 */}
          <div className={styles.serviceCategory}>
            <div className={styles.categoryTitle}>其他服务事项</div>

            <div className={styles.remarkRow}>
              <span className={styles.remarkLabel}>备注：</span>
              <span className={styles.remarkContent}>{contractData.otherRemark || '-'}</span>
              <span className={styles.remarkLabel}>服务费用：</span>
              <span className={styles.remarkContent}>
                {contractData.otherServiceFee ? `${contractData.otherServiceFee}元` : '-'}
              </span>
            </div>
          </div>

          {/* 费用总计 */}
          <div className={styles.feeRow}>
            <span className={styles.feeLabel}>费用总计（人民币）：</span>
            <span className={styles.feeAmount}>
              <strong>{contractData.totalCost ? `${contractData.totalCost}元` : '-'}</strong>
            </span>
            <span className={styles.feeLabel}>大写金额（人民币）：</span>
            <span className={styles.feeWords}>
              <strong>{contractData.totalCost ? numberToChinese(contractData.totalCost) : '-'}</strong>
            </span>
          </div>

          {/* 备注 */}
          <div className={styles.remarkRow}>
            <span className={styles.remarkLabel} style={{ fontWeight: 'bold' }}>备注：</span>
            <span className={styles.remarkContent} style={{ fontWeight: 'bold' }}>{contractData.remarks || '-'}</span>
          </div>
        </div>
      </div>

      {/* 付款方式 */}
      <div className={styles.contractSection}>
        <div className={styles.sectionTitle}>（二）&nbsp;&nbsp;付款方式</div>
        <div className={styles.sectionContent}>
          <p>
            请务必及时将详细的付款信息及公司名称、服务协议编号提供于我司，以便我司及时查收款项。
            本合同签订后，超过 3 个工作日未支付本合同自动失效。
          </p>
        </div>
      </div>

      {/* 合同条款 */}
      <div className={styles.contractTerms}>
        {/* 甲方权利与义务 */}
        <div className={styles.termSection}>
          <div className={styles.termTitle}>（三）&nbsp;&nbsp;甲方的权利与义务</div>
          <div className={styles.termContent}>
            <p className={styles.termItem}>
              1、
              甲方应按照约定向乙方提供按现行法律、法规、规章报批项目所需资料、文件。甲方所提供资料文件必须真实、合法、完整、准确，否则造成的全部损失均由甲方承担。
            </p>
            <p className={styles.termItem}>
              2、
              本协议签署后甲方应当在当日内向乙方一次性支付全部服务费用。若因实际情况甲方提出修改要求，则需另行支付费用：300
              元（人民币）/次。
            </p>
            <p className={styles.termItem}>
              3、
              本协议的签署表示甲方同意委托乙方及关联服务机构或其他具有资质的合作服务商共同为其提供商事服务：如有必要，甲方应按照乙方安排与乙方关联服务机构或其他具有资质的合作服务商签署服务或咨询合同。
            </p>
            <p className={styles.termItem}>
              4、甲方取得代办证照及材料应当用于合法经营，如利用代办证照及材料从事违法及非法经营活动，所产生的一切责任由甲方承担。
            </p>
            <p className={styles.termItem}>
              5、
              本协议履行完毕后，甲方应依法开展民事活动，因甲方非法经营、失联、违约等所产生的法律后果与乙方无关。
            </p>
          </div>
        </div>

        {/* 乙方权利与义务 */}
        <div className={styles.termSection}>
          <div className={styles.termTitle}>（四）&nbsp;&nbsp;乙方的权利与义务</div>
          <div className={styles.termContent}>
            <p className={styles.termItem}>
              1、
              乙方通过书面或电子邮件等方式为甲方提供服务解决方案、所需条件、资料文件并及时向甲方报告委托事项的进展。
            </p>
            <p className={styles.termItem}>
              2、
              乙方服务时限自甲方完整提供全部信息、资料、文件时起算，因甲方确认需求、提供资料、签署文件缺失或由于甲方原因导致服务与咨询时间延长不计入服务时限；甲方更改需求后，服务时限重新计算；若因不可抗力因素（包括但不限于自然灾害、社会变动、战争影响、行政机关或服务机构系统网络故障、
              法律修订、政策变动或被行政机关抽査检査等导致产品失效）导致服务或咨询时限暂停期间不计入服务时限，但乙方应及时将进度等情况告知甲方。
            </p>
            <p className={styles.termItem}>
              3、
              乙方可委托关联服务机构共同为甲方委托事宜提供服务，关联服务机构的费用由乙方代收代付并全部包含于本合同的总费用中，但本合同另有约定的除外。
            </p>
            <p className={styles.termItem}>
              4、
              为保障服务时限与质量,乙方确认甲方满足本协议服务或咨询条件时，可通知甲方推进该服务，甲方自收到乙方通知（包括但不限于邮件、微信及短信方式）的
              30
              日内无正当理由拒绝提供所需信息、资料、文件，视为放弃该项服务或咨询，乙方不再就该项服务或咨询负有相关义务，因此产生延误、行政处罚、失信公示等后果，乙方不承担相应责任。
            </p>
            <p className={styles.termItem}>
              5、乙方对甲方提供的证件和资料负有妥善保管和保密责任，乙方不得将证件和资料提供给与新企业开业登记无关的其他第三者。
            </p>
            <p className={styles.termItem}>
              6、 协议中涉及正规费或第三方服务费，由第三方为甲方开具有效发票。
            </p>
          </div>
        </div>

        {/* 合同解除条款 */}
        <div className={styles.termSection}>
          <div className={styles.termTitle}>（五）&nbsp;&nbsp;合同的解除、终止履行</div>
          <div className={styles.termContent}>
            <p className={styles.termItem}>
              1、 若甲方出现下列情形，且经乙方有效通知后 30
              个自然日内无法达成合意，乙方有权单方终止本协议，不再承担相应义务：
            </p>
            <p className={styles.termItem} style={{ paddingLeft: '20px' }}>
              （1）
              甲方无正当理由要求解除本服务协议；甲方的资料、文件未完全披露或含有虚假内容；甲方无正当理由拒绝向行政机关或第三方服务机构缴纳相关费用。
            </p>
            <p className={styles.termItem} style={{ paddingLeft: '20px' }}>
              （2）
              乙方通知（包括但不限于邮件、短信、微信方式）甲方补充文件、资料，但甲方在合理时间（不少于
              2 个工作日）内无回应或因甲方原因导致服务协议自签署之日起 12
              个自然月内服务或咨询项目仍未正常推进或完结。
            </p>
            <p className={styles.termItem} style={{ paddingLeft: '20px' }}>
              （3）
              甲方无法按法律、行政法规、规章以及行政机关政策、程序向乙方提供所需资料、文件或无法提供有效联系人、相应经营条件以满足行政机关核査要求等影响服务或咨询推进：甲方的需求因法律、行政法规、规章以及行政机关政策、程序调整而无法实现。
            </p>
            <p className={styles.termItem} style={{ paddingLeft: '20px' }}>
              （4）
              甲方自有办公场所不符合商事服务条件，且无法更换有效办公场所；甲方投资人、法定代表人或高管人员因信用瑕疵无法投资或任职，且无法更换其他自然人或组织。
            </p>
            <p className={styles.termItem}>
              2、 若乙方出现下列情形，且经甲方有效通知后 10
              个自然日内无法达成合意，甲方有权单方终止本协议，不再承担相应义务：
            </p>
            <p className={styles.termItem} style={{ paddingLeft: '20px' }}>
              （1） 乙方及其关联方未按协议约定提供咨询与服务。
            </p>
            <p className={styles.termItem} style={{ paddingLeft: '20px' }}>
              （2） 乙方提供第三方服务商产品无法完成本协议服务事项，且无其他可替代产品。
            </p>
            <p className={styles.termItem}>
              3、
              甲方提出书面或邮件退款申请且乙方无异议，视为对本服务协议的解除，双方不再承担本协议项下权利与义务，乙方于本服务中出具的服务费用收据将自动失效且乙方将于十个工作日内按以下内容确定退款金额，完成退款：
            </p>
            <p className={styles.termItem} style={{ paddingLeft: '20px' }}>
              （1） 已向行政机关/银行、会计师事务所、报社等服务机构缴纳的官费不予退还；
            </p>
            <p className={styles.termItem} style={{ paddingLeft: '20px' }}>
              （2）
              因甲方原因终止服务，已占用企业办公场所等产品资源导致第三方服务商扣除全部或部分产品使用费用，该费用不予退还：
            </p>
            <p className={styles.termItem} style={{ paddingLeft: '20px' }}>
              （3） 协议解除前己发生服务或咨询项目所需必要的服务费用不予退还；
            </p>
            <p className={styles.termItem} style={{ paddingLeft: '20px' }}>
              （4） 因本协议第（五）条第 1
              款原因导致协议终止，乙方有权扣除甲方己缴费用中除上述三项外剩余服务费用的
              30%作为违约金。
            </p>
          </div>
        </div>

        {/* 违约责任 */}
        <div className={styles.termSection}>
          <div className={styles.termTitle}>（六）&nbsp;&nbsp;违约责任</div>
          <div className={styles.termContent}>
            <p className={styles.termItem}>
              1、
              除由法律规定的连带责任以外，本协议任何一方均不对因协议内容履行不当而导致他方的间接损失承担责任，包括但不限于由本协议引起或与其相关的任何违约或导致一方利润、业务、收益、商誉损失，不论过错方是否已知晓该种损失的可能性。
            </p>
            <p className={styles.termItem}>
              2、
              乙方在提供商事服务或法律咨询过程中，因不可抗力或各方原因导致服务或咨询无法继续履行，一方应立即将客观情形有效告知对方，并应在十五个工作日内，提供详情及协议内容不能履行、部分不能履行或者需要延期履行理由的有效证明文件；双方依客观情形对履行协议权力义务的程度，协商决定是否解除本协议，或部分免除履行协议责任，或延期履行本协议。
            </p>
            <p className={styles.termItem}>
              3、
              因不可抗力因素（包括但不限于自然灾害、社会变动、战争影响、网络故障、法律修订、政策变动）导致服务或咨询无法继续，本协议确认解除的，乙方应根据第（五）条第
              3 款内容退还甲方所付服务费用。
            </p>
          </div>
        </div>

        {/* 其他条款 */}
        <div className={styles.termSection}>
          <div className={styles.termTitle}>（七）&nbsp;&nbsp;其他</div>
          <div className={styles.termContent}>
            <p className={styles.termItem}>
              1、
              协议生效后各方应认真自觉遵守，在协议履行过程中发生的争议，各方应协商解决，若协商不成，任何一方应向乙方所在地人民法院提起诉讼。
            </p>
            <p className={styles.termItem}>
              2、
              本协议签订的前各方所发生的委托事宜，甲乙双方在本协议商事服务与法律咨询范围内予以追认。
            </p>
            <p className={styles.termItem}>
              3、
              本合同为中文版本，并适用中国大陆地区法律，本合同自双方盖章且甲方按约定完成付款之日起生效。
            </p>
            <p className={styles.termItem}>
              4、
              本协议补充条款经甲乙双方确认后，属于对本协议的有效补充，具有法律效力，乙方员工口头承诺内容未经本协议记载，均不发生法律效力。
            </p>
            <p className={styles.termItem}>
              5、
              本协议各方所提供的资料、文件均属商业机密，各方不得以任何理由在与本协议服务或咨询无关的场合或其他目的进行披露，政府行政机构依法获得及批准除外。
            </p>
            <p className={styles.termItem}>
              6、本合同一式二份，协议各方各执一份。各份协议文本具有同等法律效力。
            </p>
          </div>
        </div>

        {/* 合同签章 */}
        <div className={styles.contractSignatures}>
          <div className={styles.signatureRow}>
            <div className={styles.signatureColumn}>
              <div
                className={`${styles.signatureItem} ${
                  contractData.contractSignature || contractData.partyAStampImage ? styles.signed : styles.unsigned
                }`}
              >
                <span className={styles.signatureTitle}>（甲方盖章）：</span>
                <div className={styles.signatureArea}>
                  {contractData.contractSignature ? (
                    <img
                      src={contractData.contractSignature}
                      alt="甲方签名"
                      className={styles.stampImage}
                      style={{
                        maxWidth: '150px',
                        maxHeight: '80px',
                        display: 'block',
                        margin: '10px 0',
                      }}
                    />
                  ) : contractData.partyAStampImage ? (
                    <img
                      src={contractData.partyAStampImage}
                      alt="甲方盖章"
                      className={styles.stampImage}
                    />
                  ) : null}
                </div>
              </div>
              <div className={styles.signatureDateRow}>
                <span className={styles.dateLabel}>日期：</span>
                <span className={styles.dateValue}>
                  {contractData.partyASignDate
                    ? getFormattedDate(contractData.partyASignDate)
                    : '-'}
                </span>
              </div>
            </div>

            <div className={styles.signatureColumn}>
              <div className={styles.signatureItem}>
                <span className={styles.signatureTitle}>（乙方盖章）：</span>
                <div className={styles.signatureArea} style={{ border: 'none', background: 'transparent' }}>
                  <img
                    src={getPartyBStampImage(contractData.signatory || '')}
                    alt="乙方盖章"
                    className={styles.stampImage}
                    style={{
                      maxWidth: '130px',
                      maxHeight: '130px',
                    }}
                  />
                </div>
              </div>
              <div className={styles.signatureDateRow}>
                <span className={styles.dateLabel}>日期：</span>
                <span className={styles.dateValue}>
                  {contractData.partyBSignDate
                    ? getFormattedDate(contractData.partyBSignDate)
                    : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 合同页脚 */}
        <div className={styles.contractFooter}>
          <p>{config.footer}</p>
        </div>
      </div>
    </div>
  )
}

export default SingleServiceAgreementView
