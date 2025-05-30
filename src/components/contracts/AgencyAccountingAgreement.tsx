import React, { useState, useImperativeHandle, forwardRef, useEffect } from 'react'
import { Form, Input, DatePicker, Checkbox, Radio, Select, message } from 'antd'
import type { RadioChangeEvent } from 'antd'
import dayjs from 'dayjs'
import { useContractDetail } from '../../hooks/useContract'
import type { CreateContractDto } from '../../types/contract'
import { numberToChinese, formatAmount, parseAmount } from '../../utils/numberToChinese'
import './AgencyAccountingAgreement.css'

const { TextArea } = Input
const { Option } = Select

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
  定兴县中岳会计服务有限公司: '/images/dingxing-zhang.png',
  定兴县中岳会计服务有限公司河北雄安分公司: '/images/xiongan-zhang.png',
  定兴县中岳会计服务有限公司高碑店分公司: '/images/gaobeidian-zhang.png',
  保定脉信会计服务有限公司: '/images/maixin-zhang.png',
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

interface AgencyAccountingAgreementProps {
  signatory: string
  contractData?: Record<string, any>
  onSubmit?: (data: CreateContractDto) => void
  onUpdate?: (data: CreateContractDto) => void
  isSubmitting?: boolean
  mode?: 'create' | 'edit'
}

// 暴露给父组件的方法接口
export interface AgencyAccountingAgreementRef {
  validateForm: () => boolean
  handleSubmit: () => Promise<void>
}

const AgencyAccountingAgreement = forwardRef<
  AgencyAccountingAgreementRef,
  AgencyAccountingAgreementProps
>(
  (
    { signatory, contractData = {}, onSubmit, onUpdate, isSubmitting = false, mode = 'create' },
    ref
  ) => {
    // 状态管理
    const [formData, setFormData] = useState<Record<string, any>>({
      signatory,
      contractType: '代理记账合同',
      ...contractData,
    })

    // 申报服务选择状态
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [otherBusiness, setOtherBusiness] = useState('')

    // 金额字段的字符串状态（用于输入显示）
    const [amountDisplayValues, setAmountDisplayValues] = useState<Record<string, string>>({
      totalAgencyAccountingFee: '',
      agencyAccountingFee: '',
      accountingSoftwareFee: '',
      invoicingSoftwareFee: '',
      accountBookFee: '',
    })

    const { createContractData } = useContractDetail()

    // 当contractData变化时，更新表单数据
    useEffect(() => {
      if (contractData && Object.keys(contractData).length > 0) {
        setFormData(prev => ({
          ...prev,
          signatory,
          contractType: '代理记账合同',
          ...contractData,
        }))

        // 初始化金额显示值
        const newAmountDisplayValues: Record<string, string> = {
          totalAgencyAccountingFee: contractData.totalAgencyAccountingFee
            ? String(contractData.totalAgencyAccountingFee)
            : '',
          agencyAccountingFee: contractData.agencyAccountingFee
            ? String(contractData.agencyAccountingFee)
            : '',
          accountingSoftwareFee: contractData.accountingSoftwareFee
            ? String(contractData.accountingSoftwareFee)
            : '',
          invoicingSoftwareFee: contractData.invoicingSoftwareFee
            ? String(contractData.invoicingSoftwareFee)
            : '',
          accountBookFee: contractData.accountBookFee ? String(contractData.accountBookFee) : '',
        }
        setAmountDisplayValues(newAmountDisplayValues)

        // 设置申报服务选项
        if (Array.isArray(contractData.declarationService)) {
          setSelectedServices(contractData.declarationService.map((item: any) => item.value))
        }

        // 设置其他业务
        if (contractData.otherBusiness) {
          setOtherBusiness(contractData.otherBusiness)
        }
      }
    }, [contractData, signatory])

    // 计算大写金额
    const totalFeeInWords = React.useMemo(() => {
      if (formData.totalAgencyAccountingFee && formData.totalAgencyAccountingFee > 0) {
        return numberToChinese(formData.totalAgencyAccountingFee)
      }
      return ''
    }, [formData.totalAgencyAccountingFee])

    const config = SIGNATORY_CONFIG[signatory as keyof typeof SIGNATORY_CONFIG]

    if (!config) {
      return <div className="error-message">不支持的签署方: {signatory}</div>
    }

    // 处理表单数据变化
    const handleFormChange = (field: string, value: any) => {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }))
    }

    // 处理金额输入变化
    const handleFormAmountChange = (field: string, value: string) => {
      // 更新显示的金额字符串
      setAmountDisplayValues(prev => ({
        ...prev,
        [field]: formatAmount(value),
      }))

      // 解析为数字并更新表单数据
      const numValue = parseAmount(value)
      handleFormChange(field, numValue)
    }

    // 处理金额输入框失焦事件
    const handleFormAmountBlur = (field: string, value: string) => {
      // 当用户完成输入，确保格式化为两位小数
      const numValue = parseAmount(value)
      const formattedValue = numValue === 0 ? '' : numValue.toFixed(2)

      setAmountDisplayValues(prev => ({
        ...prev,
        [field]: formattedValue,
      }))
    }

    // 处理申报服务选择变化
    const handleServiceChange = (checkedValues: string[]) => {
      setSelectedServices(checkedValues)

      // 构建declarationService数据结构
      const declarationService = checkedValues.map(value => {
        const option = DECLARATION_SERVICE_OPTIONS.find(opt => opt.value === value)
        return {
          value,
          label: option ? option.label : '',
        }
      })

      handleFormChange('declarationService', declarationService)
    }

    // 处理其他业务变化
    const handleOtherBusinessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setOtherBusiness(value)
      handleFormChange('otherBusiness', value)
    }

    // 表单验证
    const validateForm = (): boolean => {
      // 必填字段验证
      if (!formData.partyACompany) {
        message.error('请填写甲方公司名称')
        return false
      }

      if (!formData.entrustmentStartDate || !formData.entrustmentEndDate) {
        message.error('请选择委托开始和结束日期')
        return false
      }

      // 费用相关验证
      if (!formData.totalAgencyAccountingFee) {
        message.error('请填写代理记账总费用')
        return false
      }

      // 基本验证通过
      return true
    }

    // 提交表单
    const handleSubmit = async () => {
      if (!validateForm()) {
        throw new Error('表单验证失败')
      }

      try {
        // 构建最终提交的合同数据
        const contractSubmitData: CreateContractDto = {
          ...formData,
          contractType: '代理记账合同',
          signatory,
          remarks: formData.remarks,
        }

        if (mode === 'create' && onSubmit) {
          await onSubmit(contractSubmitData)
        } else if (mode === 'edit' && onUpdate) {
          await onUpdate(contractSubmitData)
        } else {
          await createContractData(contractSubmitData)
        }

        message.success(`合同${mode === 'create' ? '创建' : '更新'}成功`)
      } catch (error) {
        console.error('提交合同失败:', error)
        message.error(`合同${mode === 'create' ? '创建' : '更新'}失败，请重试`)
        throw error // 重新抛出错误，让父组件知道提交失败
      }
    }

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      validateForm,
      handleSubmit,
    }))

    return (
      <div className="agency-accounting-agreement">
        <div className="agreement-header">
          <h1 className="agreement-title">代理记账业务委托合同</h1>
        </div>

        <div className="agreement-parties">
          <div className="party-section">
            <div className="party-label">甲方：</div>
            <div className="party-content">
              <Input
                placeholder="请填写甲方公司名称"
                value={formData.partyACompany || ''}
                onChange={e => handleFormChange('partyACompany', e.target.value)}
                className="company-input"
              />
            </div>
          </div>

          <div className="party-field">
            <div className="party-label">统一社会信用代码：</div>
            <div className="party-content">
              <Input
                placeholder="请填写甲方统一社会信用代码"
                value={formData.partyACreditCode || ''}
                onChange={e => handleFormChange('partyACreditCode', e.target.value)}
                className="credit-code-input"
              />
            </div>
          </div>

          <div className="party-field">
            <div className="party-label">地址：</div>
            <div className="party-content">
              <Input
                placeholder="请填写甲方地址"
                value={formData.partyAAddress || ''}
                onChange={e => handleFormChange('partyAAddress', e.target.value)}
                className="address-input"
              />
            </div>
          </div>

          <div className="party-field">
            <div className="party-label">电话：</div>
            <div className="party-content">
              <Input
                placeholder="请填写甲方电话"
                value={formData.partyAPhone || ''}
                onChange={e => handleFormChange('partyAPhone', e.target.value)}
                className="phone-input"
              />
            </div>
          </div>

          <div className="party-field">
            <div className="party-label">联系人：</div>
            <div className="party-content">
              <Input
                placeholder="请填写甲方联系人"
                value={formData.partyAContact || ''}
                onChange={e => handleFormChange('partyAContact', e.target.value)}
                className="contact-input"
              />
            </div>
          </div>

          <div className="party-section">
            <div className="party-label">乙方：</div>
            <div className="party-content">
              <div className="party-b-name">{config.title}</div>
            </div>
          </div>

          <div className="party-field">
            <div className="party-label">统一社会信用代码：</div>
            <div className="party-content">
              <div className="party-b-credit-code">{config.creditCode}</div>
            </div>
          </div>

          <div className="party-field">
            <div className="party-label">地址：</div>
            <div className="party-content">
              <Input
                placeholder="请填写乙方地址"
                value={formData.partyBAddress || config.address}
                onChange={e => handleFormChange('partyBAddress', e.target.value)}
                className="address-input"
              />
            </div>
          </div>

          <div className="party-field">
            <div className="party-label">电话：</div>
            <div className="party-content">
              <Input
                placeholder="请填写乙方电话"
                value={formData.partyBPhone || config.phone}
                onChange={e => handleFormChange('partyBPhone', e.target.value)}
                className="phone-input"
              />
            </div>
          </div>

          <div className="party-field">
            <div className="party-label">业务人：</div>
            <div className="party-content">
              <Input
                placeholder="请填写乙方业务人"
                value={formData.partyBContact || ''}
                onChange={e => handleFormChange('partyBContact', e.target.value)}
                className="business-person-input"
              />
            </div>
          </div>
        </div>

        <div className="agreement-preamble">
          甲方因经营管理需要委托乙方代理发票开具、记账纳税申报。为了维护双方
          合法权益根据《中华人民共和国民法典》及《代理记账管理办法》等法律、法规
          的规定经双方代表友好协商，达成以下协议：
        </div>

        <div className="agreement-section">
          <div className="section-title">一、委托业务范围</div>
          <div className="section-content">
            <div className="entrustment-period">
              <div className="entrustment-text">
                乙方接受甲方委托，对甲方
                <DatePicker
                  placeholder="开始日期"
                  value={
                    formData.entrustmentStartDate ? dayjs(formData.entrustmentStartDate) : null
                  }
                  onChange={date =>
                    handleFormChange(
                      'entrustmentStartDate',
                      date ? date.format('YYYY-MM-DD') : null
                    )
                  }
                  className="date-picker"
                />
                日至
                <DatePicker
                  placeholder="结束日期"
                  value={formData.entrustmentEndDate ? dayjs(formData.entrustmentEndDate) : null}
                  onChange={date =>
                    handleFormChange('entrustmentEndDate', date ? date.format('YYYY-MM-DD') : null)
                  }
                  className="date-picker"
                />
                日期间内的经济业务进行代理记账。
              </div>
            </div>

            <div className="tax-services">
              <div>(同时为甲方提供代理纳税申报服务，包括：</div>
              <div className="service-checkboxes">
                {DECLARATION_SERVICE_OPTIONS.map(option => (
                  <Checkbox
                    key={option.value}
                    value={option.value}
                    checked={selectedServices.includes(option.value)}
                    onChange={e => {
                      const { value, checked } = e.target
                      let newServices: string[]
                      if (checked) {
                        newServices = [...selectedServices, value]
                      } else {
                        newServices = selectedServices.filter(service => service !== value)
                      }
                      handleServiceChange(newServices)
                    }}
                  >
                    {option.label}
                  </Checkbox>
                ))}
              </div>
              <div className="other-business">
                <div className="other-business-label">其他业务：</div>
                <Input
                  placeholder="请填写其他业务"
                  value={otherBusiness}
                  onChange={handleOtherBusinessChange}
                  className="other-business-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="agreement-section">
          <div className="section-title">二、甲方的责任和义务</div>
          <div className="section-content party-a-obligations">
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

        <div className="agreement-section">
          <div className="section-title">三、乙方的责任和义务</div>
          <div className="section-content party-b-obligations">
            <p>
              (一)乙方根据甲方所提供的原始凭证和其他资料，按照国家统一会计制度的规定进行会计核算，包括审核原始凭证、填制记账凭证、登记会计账簿、设计编制和提供财务会计报告。
            </p>
            <p>
              (二)乙方应严格按照税收相关法律法规，在规定的申报期内为甲方及时、准确地办理纳税申报业务。
            </p>
            <p>
              (三)涉及存货核算的，根据甲方提供的存货入库凭证、出库凭证、每月各类存货的收发存明细表，乙方进行成本结转。
            </p>
            <p>
              (四)乙方应协助甲方完善内部控制，加强内部管理，针对内部控制薄弱环节提出合理的建议。
            </p>
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

        <div className="agreement-section">
          <div className="section-title">四、责任划分</div>
          <div className="section-content responsibility-division">
            <p>
              (一)乙方是在甲方提供相关资料的基础上进行会计核算，因甲方提供的记账依据不实、未按协议约定及时提供记账依据或其他过错导致委托事项出现差错或未能按时完成委托事项，由此造成的后果，由甲方承担。
            </p>
            <p>
              (二)因乙方的过错导致委托事项出现差错或未能按时完成委托事项，由此造成的后果，由乙方承担。
            </p>
          </div>
        </div>

        <div className="agreement-section">
          <div className="section-title">五、协议的终止</div>
          <div className="section-content agreement-termination">
            <p>(一)协议期满，本协议自然终止，双方如续续约，须另定协议。</p>
            <p>(二)经双方协商一致后，可提前终止协议。</p>
          </div>
        </div>

        <div className="agreement-section">
          <div className="section-title">六、代理记账服务费</div>
          <div className="section-content agency-fee-content">
            <p>
              经协商，乙方代理记账收费标准为：人民币每年
              <Input
                placeholder="代理记账总费用"
                value={amountDisplayValues.totalAgencyAccountingFee}
                onChange={e => handleFormAmountChange('totalAgencyAccountingFee', e.target.value)}
                onBlur={e => handleFormAmountBlur('totalAgencyAccountingFee', e.target.value)}
                className="inline-fee-input"
              />
              元（代理记账费
              <Input
                placeholder="代理记账费"
                value={amountDisplayValues.agencyAccountingFee}
                onChange={e => handleFormAmountChange('agencyAccountingFee', e.target.value)}
                onBlur={e => handleFormAmountBlur('agencyAccountingFee', e.target.value)}
                className="inline-fee-input"
              />
              /年，记账软件服务费
              <Input
                placeholder="记账软件费"
                value={amountDisplayValues.accountingSoftwareFee}
                onChange={e => handleFormAmountChange('accountingSoftwareFee', e.target.value)}
                onBlur={e => handleFormAmountBlur('accountingSoftwareFee', e.target.value)}
                className="inline-fee-input"
              />
              /年，开票软件服务费
              <Input
                placeholder="开票软件费"
                value={amountDisplayValues.invoicingSoftwareFee}
                onChange={e => handleFormAmountChange('invoicingSoftwareFee', e.target.value)}
                onBlur={e => handleFormAmountBlur('invoicingSoftwareFee', e.target.value)}
                className="inline-fee-input"
              />
              /年），甲方按年度提前30日支付，不足一个月的按一个月计算。如甲方业务量增加，乙方根据甲方业务增量调整增加代理费用。
            </p>

            <p>
              全年凭证、账簿费用为
              <Input
                placeholder="账簿费"
                value={amountDisplayValues.accountBookFee}
                onChange={e => handleFormAmountChange('accountBookFee', e.target.value)}
                onBlur={e => handleFormAmountBlur('accountBookFee', e.target.value)}
                className="inline-fee-input"
              />
              元。其中包括凭证、账簿、差旅费报销单、费用粘贴单、工资表、财务报表、纳税申报表等。（以上费用以实际到账执行）
            </p>

            <div>
              代理记账服务费支付方式：
              <Radio.Group
                value={formData.paymentMethod || '对公'}
                onChange={e => handleFormChange('paymentMethod', e.target.value)}
                className="inline-payment-method"
              >
                <Radio value="对公">对公</Radio>
                <Radio value="现金">现金</Radio>
              </Radio.Group>
            </div>

            <p>于合同生效日起 3 日内一次付清。</p>
          </div>
        </div>

        <div className="agreement-section">
          <div className="section-title">七、违约责任</div>
          <div className="section-content breach-responsibility">
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

        <div className="agreement-section">
          <div className="section-title">八、其他约定</div>
          <div className="section-content other-agreements">
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

        <div className="agreement-signatures">
          <div className="signature-container">
            <div className="signature-row">
              <div className="signature-column">
                <div className="signature-title">委托方：{formData.partyACompany || ''}</div>
                <div className="signature-stamp-space">
                  {/* 甲方签字区域 - 参考产品服务协议的实现 */}
                  {formData.partyAStampImage ? (
                    <div className="stamp-preview">
                      <img
                        src={formData.partyAStampImage}
                        alt="甲方签字"
                        className="stamp-image"
                        style={{
                          maxWidth: '150px',
                          maxHeight: '80px',
                          display: 'block',
                          margin: '10px 0',
                        }}
                      />
                      <p className="signed-note">签名图片已通过签署功能自动生成</p>
                    </div>
                  ) : (
                    <div className="stamp-placeholder">
                      <p className="text-sm text-gray-400">请通过"签署合同"功能生成甲方签字</p>
                    </div>
                  )}
                </div>
                <div className="signature-field">
                  <div className="signature-label">法定代表人：</div>
                  <Input
                    placeholder="请输入法定代表人"
                    value={formData.partyALegalPerson || ''}
                    onChange={e => handleFormChange('partyALegalPerson', e.target.value)}
                    style={{ width: '150px', fontSize: '12px' }}
                  />
                </div>
                <div className="signature-field">
                  <div className="signature-label">联系人：</div>
                  <Input
                    placeholder="请输入联系人"
                    value={formData.partyAContact || ''}
                    onChange={e => handleFormChange('partyAContact', e.target.value)}
                    style={{ width: '150px', fontSize: '12px' }}
                  />
                </div>
                <div className="signature-field">
                  <div className="signature-label">地址：</div>
                  <Input
                    placeholder="请输入地址"
                    value={formData.partyAAddress || ''}
                    onChange={e => handleFormChange('partyAAddress', e.target.value)}
                    style={{ width: '200px', fontSize: '12px' }}
                  />
                </div>
                <div className="signature-field">
                  <div className="signature-label">邮编：</div>
                  <Input
                    placeholder="请输入邮编"
                    value={formData.partyAPostalCode || ''}
                    onChange={e => handleFormChange('partyAPostalCode', e.target.value)}
                    style={{ width: '120px', fontSize: '12px' }}
                  />
                </div>
                <div className="signature-field">
                  <div className="signature-label">电话：</div>
                  <Input
                    placeholder="请输入电话"
                    value={formData.partyAPhone || ''}
                    onChange={e => handleFormChange('partyAPhone', e.target.value)}
                    style={{ width: '150px', fontSize: '12px' }}
                  />
                </div>
                <div className="signature-field">
                  <div className="signature-label">签约日期：</div>
                  <DatePicker
                    placeholder="请选择日期"
                    format="YYYY年MM月DD日"
                    value={formData.partyASignDate ? dayjs(formData.partyASignDate) : undefined}
                    onChange={date =>
                      handleFormChange('partyASignDate', date?.format('YYYY-MM-DD'))
                    }
                    style={{ width: '150px', fontSize: '12px' }}
                  />
                </div>
              </div>
              <div className="signature-column">
                <div className="signature-title">受托方：{config.title}</div>
                <div className="signature-stamp-space">
                  {/* 乙方盖章区域 - 显示公章图片 */}
                  {getPartyBStampImage(signatory) && (
                    <img
                      src={getPartyBStampImage(signatory)}
                      alt="乙方盖章"
                      className="party-b-stamp"
                    />
                  )}
                </div>
                <div className="signature-field">
                  <div className="signature-label">法定代表人：</div>
                  <Input
                    placeholder="请输入法定代表人"
                    value={formData.partyBLegalPerson || '刘菲'}
                    onChange={e => handleFormChange('partyBLegalPerson', e.target.value)}
                    style={{ width: '150px', fontSize: '12px' }}
                  />
                </div>
                <div className="signature-field">
                  <div className="signature-label">联系人：</div>
                  <Input
                    placeholder="请输入联系人"
                    value={formData.partyBContact || ''}
                    onChange={e => handleFormChange('partyBContact', e.target.value)}
                    style={{ width: '150px', fontSize: '12px' }}
                  />
                </div>
                <div className="signature-field">
                  <div className="signature-label">地址：</div>
                  <Input
                    placeholder="请输入地址"
                    value={formData.partyBAddress || config.address}
                    onChange={e => handleFormChange('partyBAddress', e.target.value)}
                    style={{ width: '200px', fontSize: '12px' }}
                  />
                </div>
                <div className="signature-field">
                  <div className="signature-label">邮编：</div>
                  <Input
                    placeholder="请输入邮编"
                    value={formData.partyBPostalCode || ''}
                    onChange={e => handleFormChange('partyBPostalCode', e.target.value)}
                    style={{ width: '120px', fontSize: '12px' }}
                  />
                </div>
                <div className="signature-field">
                  <div className="signature-label">电话：</div>
                  <Input
                    placeholder="请输入电话"
                    value={formData.partyBPhone || config.phone}
                    onChange={e => handleFormChange('partyBPhone', e.target.value)}
                    style={{ width: '150px', fontSize: '12px' }}
                  />
                </div>
                <div className="signature-field">
                  <div className="signature-label">签约日期：</div>
                  <DatePicker
                    placeholder="请选择日期"
                    format="YYYY年MM月DD日"
                    value={formData.partyBSignDate ? dayjs(formData.partyBSignDate) : undefined}
                    onChange={date =>
                      handleFormChange('partyBSignDate', date?.format('YYYY-MM-DD'))
                    }
                    style={{ width: '150px', fontSize: '12px' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

export default AgencyAccountingAgreement
