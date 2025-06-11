import React from 'react'
import { Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { numberToChinese } from '../../utils/numberToChinese'
import type { Contract, ContractStatus } from '../../types/contract'
import styles from './AgencyAccountingAgreementView.module.css'

const { Title, Text } = Typography

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
    address: '河北省雄安新区容城县容城镇容善路39号',
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

interface AgencyAccountingAgreementViewProps {
  contractData: Contract
}

const AgencyAccountingAgreementView: React.FC<AgencyAccountingAgreementViewProps> = ({
  contractData,
}) => {
  const {
    signatory,
    partyACompany,
    partyACreditCode,
    partyALegalPerson,
    partyAAddress,
    partyAPhone,
    partyAContact,
    partyBContact,
    partyBAddress,
    partyBPhone,
    partyBLegalPerson,
    partyAPostalCode,
    partyBPostalCode,
    entrustmentStartDate,
    entrustmentEndDate,
    declarationService,
    otherBusiness,
    totalAgencyAccountingFee,
    agencyAccountingFee,
    accountingSoftwareFee,
    invoicingSoftwareFee,
    accountBookFee,
    paymentMethod,
    contractStatus,
    contractSignature,
    partyASignDate,
    partyBSignDate,
  } = contractData

  // 合同状态标签
  const getStatusTag = (status?: ContractStatus) => {
    switch (status) {
      case '0':
        return <Tag color="default">未签署</Tag>
      case '1':
        return <Tag color="success">已签署</Tag>
      case '2':
        return <Tag color="error">已终止</Tag>
      default:
        return <Tag color="default">未知</Tag>
    }
  }

  // 金额格式化 - 保留两位小数
  const formatCurrency = (amount?: number | string | null) => {
    // 处理空值情况
    if (amount === undefined || amount === null || amount === '') return '0.00'

    // 转换为数字类型
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

    // 检查是否为有效数字
    if (isNaN(numAmount) || !isFinite(numAmount)) return '0.00'

    return numAmount.toFixed(2)
  }

  // 计算大写金额
  const totalFeeInWords = React.useMemo(() => {
    if (!totalAgencyAccountingFee) return ''

    // 确保转换为数字类型
    const numAmount =
      typeof totalAgencyAccountingFee === 'string'
        ? parseFloat(totalAgencyAccountingFee)
        : totalAgencyAccountingFee

    // 检查是否为有效数字
    if (isNaN(numAmount) || !isFinite(numAmount) || numAmount <= 0) return ''

    return numberToChinese(numAmount)
  }, [totalAgencyAccountingFee])

  // 获取签署方配置
  const config = signatory ? SIGNATORY_CONFIG[signatory as keyof typeof SIGNATORY_CONFIG] : null

  if (!config) {
    return <div className={styles.errorMessage}>不支持的签署方: {signatory}</div>
  }

  // 获取申报服务选项
  const getSelectedServices = () => {
    if (!declarationService || !Array.isArray(declarationService)) {
      return <div className={styles.serviceItemEmpty}>未选择</div>
    }

    // 创建一个映射，用于快速查找选中的服务及其金额
    const selectedServiceMap = declarationService.reduce(
      (acc, service) => {
        acc[service.value] = service.fee || null
        return acc
      },
      {} as Record<string, number | null>
    )

    return (
      <div className={`${styles.serviceCheckboxes} ${styles.viewMode}`}>
        {DECLARATION_SERVICE_OPTIONS.map((option, index) => {
          const isSelected = selectedServiceMap.hasOwnProperty(option.value)
          const fee = selectedServiceMap[option.value]

          return (
            <div key={index} className={styles.serviceItem}>
              <span
                className={isSelected ? styles.checkboxChecked : styles.checkboxUnchecked}
              ></span>
              <span className={styles.serviceLabel}>
                {option.label}
                {isSelected && fee ? (
                  <span className={styles.serviceFeeValue}>{fee.toFixed(2)}元</span>
                ) : (
                  ''
                )}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={styles.agencyAccountingAgreementView}>
      <div className={styles.agreementHeader}>
        <h1 className={styles.agreementTitle}>代理记账业务委托合同</h1>
      </div>

      <div className={styles.agreementParties}>
        <div className={styles.partySection}>
          <div className={styles.partyLabel}>甲方：</div>
          <div className={styles.partyContent}>
            <div className={styles.partyValue}>{partyACompany || '-'}</div>
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>统一社会信用代码：</div>
          <div className={styles.partyContent}>
            <div className={styles.partyValue}>{partyACreditCode || '-'}</div>
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>地址：</div>
          <div className={styles.partyContent}>
            <div className={styles.partyValue}>{partyAAddress || '-'}</div>
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>电话：</div>
          <div className={styles.partyContent}>
            <div className={styles.partyValue}>{partyAPhone || '-'}</div>
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>联系人：</div>
          <div className={styles.partyContent}>
            <div className={styles.partyValue}>{partyAContact || '-'}</div>
          </div>
        </div>

        <div className={styles.partySection}>
          <div className={styles.partyLabel}>乙方：</div>
          <div className={styles.partyContent}>
            <div className={styles.partyBName}>{config.title}</div>
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>统一社会信用代码：</div>
          <div className={styles.partyContent}>
            <div className={styles.partyBCreditCode}>{config.creditCode}</div>
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>地址：</div>
          <div className={styles.partyContent}>
            <div className={styles.partyValue}>{partyBAddress || config.address}</div>
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>电话：</div>
          <div className={styles.partyContent}>
            <div className={styles.partyValue}>{partyBPhone || config.phone}</div>
          </div>
        </div>

        <div className={styles.partyField}>
          <div className={styles.partyLabel}>业务人：</div>
          <div className={styles.partyContent}>
            <div className={styles.partyValue}>{partyBContact || '-'}</div>
          </div>
        </div>
      </div>

      <div className={styles.agreementPreamble}>
        甲方因经营管理需要委托乙方代理发票开具、记账纳税申报。为了维护双方
        合法权益根据《中华人民共和国民法典》及《代理记账管理办法》等法律、法规
        的规定经双方代表友好协商，达成以下协议：
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>一、委托业务范围</div>
        <div className={styles.sectionContent}>
          <div className={styles.entrustmentPeriod}>
            <div className={styles.entrustmentText}>
              乙方接受甲方委托，对甲方
              <span className={styles.dateValue}>
                {entrustmentStartDate ? dayjs(entrustmentStartDate).format('YYYY-MM-DD') : '___'}
              </span>
              日至
              <span className={styles.dateValue}>
                {entrustmentEndDate ? dayjs(entrustmentEndDate).format('YYYY-MM-DD') : '___'}
              </span>
              日期间内的经济业务进行代理记账。
            </div>
          </div>

          <div className={styles.taxServices}>
            <div>(同时为甲方提供代理纳税申报服务，包括：</div>
            {getSelectedServices()}
            <div className={styles.otherBusiness}>
              <div className={styles.otherBusinessLabel}>其他业务：</div>
              <div className={styles.otherBusinessValue}>{otherBusiness || '-'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>二、甲方的责任和义务</div>
        <div className={styles.sectionContent + ' ' + styles.partyAObligations}>
          <p>(一)甲方的每项经济业务，必须填制或者取得符合国家统一会计制度规定的原始凭证。</p>
          <p>
            (二)甲方应归集和整理有关经济业务的原始凭证和其他资料，并于每月 15
            日前提供给乙方。甲方对所提供资料的完整性、真实性、合法性负责，不得虚报、瞒报收入和支出。
          </p>
          <p>(三)甲方应建立健全与本企业相适应的内部控制制度，保证资产的安全和完整。</p>
          <p>(四)甲方应当配备专人负责日常货币资金的收支和保管。</p>
          <p>
            (五)涉及存货核算的，甲方负责存货的管理与盘点，应建立存货的管理制度，定期清查盘点存货，编制存货的入库凭证、出库凭证、库存明细账及每月各类存货的收发存明细表，并及时
            提供给乙方。甲方对上述资料的真实性和完整性负责，并保证库 存物资的安全和完整。
          </p>
          <p>
            (六)甲方应在法律允许的范围内开展经济业务，遵守会计法、
            税法等法律法规的规定，不得授意和指使乙方违法办理会计事项。
          </p>
          <p>
            (七)对于乙方退回的、要求甲方按照国家统一的会计制度
            规定进行更正、补充的原始凭证，甲方应当及时予以更正、补充。
          </p>
          <p>(八)甲方应积极配合乙方开展代理记账业务，对乙方提出的合理建议应积极采纳</p>
          <p>
            (九)甲方应制定合理的会计资料传递程序，及时将原始凭证等会计资料交乙方，做好会计资料的签收工作。
          </p>
          <p>
            (十)会计年度终了后，乙方将会计档案移交甲方，由甲方负责保管会计档案，保证会计档案的安全和完整。
          </p>
          <p>(十一)甲方委托乙方开具销售发票的，应符合税收相关法律法规，不得要求乙方虚开发票。</p>
          <p>(十二)甲方应按本协议书规定及时足额支付代理记账服务费。</p>
          <p>(十三)甲方应保证在规定的纳税期，银行账户有足额的存款缴纳税款。</p>
        </div>
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>三、乙方的责任和义务</div>
        <div className={styles.sectionContent + ' ' + styles.partyBObligations}>
          <p>
            (一)乙方根据甲方所提供的原始凭证和其他资料，按照国家统一会计制度的规定进行会计核算，包括审核原始凭证、填制记账凭证、登记会计账簿、设计编制和提供财务会计报告。
          </p>
          <p>
            (二)乙方应严格按照税收相关法律法规，在规定的申报期内为甲方及时、准确地办理纳税申报业务。
          </p>
          <p>
            (三)涉及存货核算的，根据甲方提供的存货入库凭证、出库凭证、每月各类存货的收发存明细表，乙方进行成本结转。
          </p>
          <p>(四)乙方应协助甲方完善内部控制，加强内部管理，针对内部控制薄弱环节提出合理的建议。</p>
          <p>
            (五)乙方应协助甲方制定合理的会计资料传递程序，积极配合甲方做好会计资料的签收手续。在代理记账过程中，应妥善
            保管会计资料。
          </p>
          <p>
            (六)乙方应按时将当年应归档的会计资料整理、装订后形成会计档案，于会计年度终了后交甲方保管。本办理交接手续前，由乙方负责保管。
          </p>
          <p>(七)委托协议终止时，乙方应与甲方办理会计业务交接事宜。</p>
          <p>
            (八)乙方接受委托为甲方开具销售发票的，应按照税收法律法规要求为甲方提供代开发票服务，不得代为虚开发票。
          </p>
          <p>(九)乙方对开展业务过程中知悉的商业秘密、个人信息负有保密义务。</p>
          <p>(十)对甲方提出的有关会计处理的相关问题，乙方应当予以正确解释。</p>
        </div>
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>四、责任划分</div>
        <div className={styles.sectionContent + ' ' + styles.responsibilityDivision}>
          <p>
            (一)乙方是在甲方提供相关资料的基础上进行会计核算，因甲方提供的记账依据不实、未按协议约定及时提供记账依据或其他过错导致委托事项出现差错或未能按时完成委托事项，由此造成的后果，由甲方承担。
          </p>
          <p>
            (二)因乙方的过错导致委托事项出现差错或未能按时完成委托事项，由此造成的后果，由乙方承担。
          </p>
        </div>
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>五、协议的终止</div>
        <div className={styles.sectionContent + ' ' + styles.agreementTermination}>
          <p>(一)协议期满，本协议自然终止，双方如续续约，须另定协议。</p>
          <p>(二)经双方协商一致后，可提前终止协议。</p>
        </div>
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>六、代理记账服务费</div>
        <div className={styles.sectionContent + ' ' + styles.agencyFeeContent}>
          <p>
            经协商，乙方代理记账收费标准为：人民币每年
            <span className={styles.feeValue}>{formatCurrency(totalAgencyAccountingFee)}</span>
            元（代理记账费
            <span className={styles.feeValue}>{formatCurrency(agencyAccountingFee)}</span>
            /年，记账软件服务费
            <span className={styles.feeValue}>{formatCurrency(accountingSoftwareFee)}</span>
            /年，开票软件服务费
            <span className={styles.feeValue}>{formatCurrency(invoicingSoftwareFee)}</span>
            /年），甲方按年度提前30日支付，不足一个月的按一个月计算。如甲方业务量增加，乙方根据甲方业务增量调整增加代理费用。
          </p>

          <p>
            全年凭证、账簿费用为
            <span className={styles.feeValue}>{formatCurrency(accountBookFee)}</span>
            元。其中包括凭证、账簿、差旅费报销单、费用粘贴单、工资表、财务报表、纳税申报表等。（以上费用以实际到账执行）
          </p>

          <div>
            代理记账服务费支付方式：
            <span className={styles.paymentMethod}>{paymentMethod || '对公'}</span>
          </div>

          <p>于合同生效日起 3 日内一次付清。</p>
        </div>
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>七、违约责任</div>
        <div className={styles.sectionContent + ' ' + styles.breachResponsibility}>
          <p>
            (一)甲方未能履行其责任，未向乙方提供真实、合法、准确、完整的原始凭证，导致税收方面的责任由甲方承担；
          </p>
          <p>
            (二)由于甲方未能及时提供代理记账所需的核算资料，致使乙方不能按时履行合同的，乙方不承担任何责任；
          </p>
          <p>
            (三)由于乙方原因，未能按时完成会计核算或会计核算不真实，造成一定后果的，乙方必须及时纠正并承担相应的责任；
          </p>
          <p>
            (四)关于会计账务出现的问题，办理交接手续以前的由甲方负责，办理交接手续以后的由乙方负责；
          </p>
          <p>
            (五)如甲方中途终止合同（转走或注销），未到期服务费用乙方不予退还，并且代理期间遗留业务按照正常收费标准收费。
          </p>
        </div>
      </div>

      <div className={styles.agreementSection}>
        <div className={styles.sectionTitle}>八、其他约定</div>
        <div className={styles.sectionContent + ' ' + styles.otherAgreements}>
          <p>
            (一)本协议的补充条款、附件及补充协议均为本协议不可分割的部分。本协议补充条款、补充协议与本协议不一致的，以补充条款、补充协议为准。
          </p>
          <p>
            (二)本协议的未尽事宜及本协议在履行过程中需要变更的事宜，双方应通过订立变更协议进行约定。
          </p>
          <p>
            (三)甲乙双方在履行本协议过程中发生争议，应协商解决。协商不能解决的，向仲裁委员会申请仲裁/依法向人民法院起诉。
          </p>
          <p>本协议自双方签字之日起生效。本协议一式两份，双方各执一份。</p>
        </div>
      </div>

      <div className={styles.agreementSignatures}>
        <div className={styles.signatureContainer}>
          {/* 签名标题行 */}
          <div className={styles.signatureTitleRow}>
            <div className={styles.signatureTitleColumn}>
              <div className={styles.signatureTitle}>委托方：{partyACompany || ''}</div>
            </div>
            <div className={styles.signatureTitleColumn}>
              <div className={styles.signatureTitle}>受托方：{config.title}</div>
            </div>
          </div>

          {/* 盖章空间行 */}
          <div className={styles.signatureStampRow}>
            <div className={styles.signatureStampColumn}>
              <div className={styles.signatureStampSpace}>
                {/* 甲方签字区域 - 修改这里展示电子签名 */}
                {contractData.contractSignature ? (
                  <div className={styles.stampPreview}>
                    <img
                      src={contractData.contractSignature}
                      alt="甲方签字"
                      className={styles.stampImage}
                      style={{
                        maxWidth: '150px',
                        maxHeight: '80px',
                        display: 'block',
                        margin: '10px 0',
                      }}
                    />
                  </div>
                ) : contractData.partyAStampImage ? (
                  <div className={styles.stampPreview}>
                    <img
                      src={contractData.partyAStampImage}
                      alt="甲方签字"
                      className={styles.stampImage}
                      style={{
                        maxWidth: '150px',
                        maxHeight: '80px',
                        display: 'block',
                        margin: '10px 0',
                      }}
                    />
                  </div>
                ) : (
                  <div className={styles.stampPlaceholder}>
                    <span>暂无签字</span>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.signatureStampColumn}>
              <div className={styles.signatureStampSpace}>
                {/* 乙方盖章区域 */}
                {signatory && getPartyBStampImage(signatory) && (
                  <img
                    src={getPartyBStampImage(signatory)}
                    alt="乙方盖章"
                    className={styles.partyBSign}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 法定代表人信息行 */}
          <div className={styles.signatureInfoRow}>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>法定代表人：</div>
                <span>{partyALegalPerson || '-'}</span>
              </div>
            </div>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>法定代表人：</div>
                <span>{partyBLegalPerson || '刘菲'}</span>
              </div>
            </div>
          </div>

          {/* 联系人信息行 */}
          <div className={styles.signatureInfoRow}>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>联系人：</div>
                <span>{partyAContact || '-'}</span>
              </div>
            </div>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>联系人：</div>
                <span>{partyBContact || '-'}</span>
              </div>
            </div>
          </div>

          {/* 地址信息行 */}
          <div className={styles.signatureInfoRow}>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>地址：</div>
                <span>{partyAAddress || '-'}</span>
              </div>
            </div>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>地址：</div>
                <span>{partyBAddress || config.address}</span>
              </div>
            </div>
          </div>

          {/* 邮编信息行 */}
          <div className={styles.signatureInfoRow}>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>邮编：</div>
                <span>{partyAPostalCode || '-'}</span>
              </div>
            </div>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>邮编：</div>
                <span>{partyBPostalCode || '-'}</span>
              </div>
            </div>
          </div>

          {/* 电话信息行 */}
          <div className={styles.signatureInfoRow}>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>电话：</div>
                <span>{partyAPhone || '-'}</span>
              </div>
            </div>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>电话：</div>
                <span>{partyBPhone || config.phone}</span>
              </div>
            </div>
          </div>

          {/* 签约日期信息行 */}
          <div className={styles.signatureInfoRow}>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>签约日期：</div>
                <span>{partyASignDate ? dayjs(partyASignDate).format('YYYY年MM月DD日') : '-'}</span>
              </div>
            </div>
            <div className={styles.signatureInfoColumn}>
              <div className={styles.signatureField}>
                <div className={styles.signatureLabel}>签约日期：</div>
                <span>{partyBSignDate ? dayjs(partyBSignDate).format('YYYY年MM月DD日') : '-'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgencyAccountingAgreementView
