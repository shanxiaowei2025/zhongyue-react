import React, { useState, useImperativeHandle, forwardRef } from 'react'
import { Checkbox, Input, DatePicker, message } from 'antd'
import type { CheckboxProps } from 'antd'
import { useContractDetail } from '../../hooks/useContract'
import type { CreateContractDto } from '../../types/contract'
import './ProductServiceAgreement.css'

// 签署方配置
const SIGNATORY_CONFIG = {
  '定兴县中岳会计服务有限公司': {
    title: '定兴县中岳会计服务有限公司',
    englishTitle: 'Dingxing County Zhongyue Accounting Service Co., Ltd.',
    address: '河北省保定市定兴县繁兴街佶地国际D-1-120',
    phone: '15030201110',
    footer: '定兴县中岳会计服务有限公司Tel: 15030201110'
  },
  '定兴县中岳会计服务有限公司河北雄安分公司': {
    title: '定兴县中岳会计服务有限公司河北雄安分公司',
    englishTitle: 'Dingxing County Zhongyue Accounting Service Co., Ltd.',
    address: '河北省雄安新区容城县容城镇容善路39号',
    phone: '15030201110',
    footer: '定兴县中岳会计服务有限公司河北雄安分公司Tel: 15030201110'
  },
  '定兴县中岳会计服务有限公司高碑店分公司': {
    title: '定兴县中岳会计服务有限公司高碑店分公司',
    englishTitle: 'Dingxing County Zhongyue Accounting Service Co., Ltd.',
    address: '高碑店市北城街道京广北大街188号A07',
    phone: '15030201110',
    footer: '定兴县中岳会计服务有限公司高碑店分公司Tel: 15030201110'
  },
  '保定脉信会计服务有限公司': {
    title: '保定脉信会计服务有限公司',
    englishTitle: '',
    address: '河北省保定市容城县容城镇容美路',
    phone: '15030201110',
    footer: '保定脉信会计服务有限公司Tel: 15030201110'
  }
}

interface ProductServiceAgreementProps {
  signatory: string
  contractData?: Record<string, any>
  onSubmit?: (data: CreateContractDto) => void
  isSubmitting?: boolean
}

// 暴露给父组件的方法接口
export interface ProductServiceAgreementRef {
  validateForm: () => boolean
  handleSubmit: () => Promise<void>
}

const ProductServiceAgreement = forwardRef<ProductServiceAgreementRef, ProductServiceAgreementProps>(({
  signatory,
  contractData = {},
  onSubmit,
  isSubmitting = false
}, ref) => {
  // 状态管理
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({})
  const [itemAmounts, setItemAmounts] = useState<Record<string, string>>({})
  const [formData, setFormData] = useState<Record<string, any>>({
    signatory,
    contractType: '产品服务协议',
    ...contractData
  })
  
  const { createContractData } = useContractDetail()
  
  const config = SIGNATORY_CONFIG[signatory as keyof typeof SIGNATORY_CONFIG]
  
  if (!config) {
    return <div className="error-message">不支持的签署方: {signatory}</div>
  }

  // 处理表单数据变化
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 处理勾选框状态变化
  const handleCheckboxChange = (itemKey: string, checked: boolean) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemKey]: checked
    }))
    
    // 如果取消勾选，清空对应金额
    if (!checked) {
      setItemAmounts(prev => ({
        ...prev,
        [itemKey]: ''
      }))
    }
  }

  // 处理金额输入变化
  const handleAmountChange = (itemKey: string, value: string) => {
    setItemAmounts(prev => ({
      ...prev,
      [itemKey]: value
    }))
  }

  // 收集服务项目数据
  const collectServiceData = () => {
    const serviceData: Record<string, any> = {}
    
    // 工商服务数据
    const businessItems = Object.keys(checkedItems).filter(key => 
      key.startsWith('business_') && checkedItems[key]
    ).map(key => ({
      itemKey: key,
      itemName: getItemName(key),
      amount: parseFloat(itemAmounts[key] || '0') || 0
    }))
    
    if (businessItems.length > 0) {
      serviceData.businessEstablishment = businessItems.filter(item => item.itemKey.includes('establish'))
      serviceData.businessChange = businessItems.filter(item => item.itemKey.includes('change'))
      serviceData.businessCancellation = businessItems.filter(item => item.itemKey.includes('cancel'))
      serviceData.businessOther = businessItems.filter(item => item.itemKey.includes('other') || item.itemKey.includes('address'))
      serviceData.businessMaterials = businessItems.filter(item => item.itemKey.includes('material'))
    }
    
    // 税务服务数据
    const taxItems = Object.keys(checkedItems).filter(key => 
      key.startsWith('tax_') && checkedItems[key]
    ).map(key => ({
      itemKey: key,
      itemName: getItemName(key),
      amount: parseFloat(itemAmounts[key] || '0') || 0
    }))
    
    if (taxItems.length > 0) {
      serviceData.taxMatters = taxItems
    }
    
    // 银行服务数据
    const bankItems = Object.keys(checkedItems).filter(key => 
      key.startsWith('bank_') && checkedItems[key]
    ).map(key => ({
      itemKey: key,
      itemName: getItemName(key),
      amount: parseFloat(itemAmounts[key] || '0') || 0
    }))
    
    if (bankItems.length > 0) {
      serviceData.bankMatters = bankItems
    }
    
    // 社保服务数据
    const socialItems = Object.keys(checkedItems).filter(key => 
      (key.startsWith('social_security_') || key.startsWith('fund_')) && checkedItems[key]
    ).map(key => ({
      itemKey: key,
      itemName: getItemName(key),
      amount: parseFloat(itemAmounts[key] || '0') || 0
    }))
    
    if (socialItems.length > 0) {
      serviceData.socialSecurity = socialItems
    }
    
    // 许可业务数据
    const licenseItems = Object.keys(checkedItems).filter(key => 
      key.startsWith('license_') && checkedItems[key]
    ).map(key => ({
      itemKey: key,
      itemName: getItemName(key),
      amount: parseFloat(itemAmounts[key] || '0') || 0
    }))
    
    if (licenseItems.length > 0) {
      serviceData.licenseBusiness = licenseItems
    }
    
    return serviceData
  }

  // 获取项目名称
  const getItemName = (itemKey: string): string => {
    const itemNameMap: Record<string, string> = {
      // 工商项目
      'business_establish_limited': '有限责任公司',
      'business_establish_branch': '有限责任公司分支机构',
      'business_establish_individual': '个人独资企业',
      'business_establish_partnership': '合伙企业',
      'business_establish_nonprofit': '民办非企业',
      'business_establish_joint_stock': '股份有限公司',
      'business_establish_self_employed': '个体工商户',
      'business_change_legal_person': '法定代表人',
      'business_change_shareholder': '股东股权',
      'business_change_capital': '注册资金',
      'business_change_name': '公司名称',
      'business_change_scope': '经营范围',
      'business_change_address': '注册地址',
      'business_change_manager': '分公司负责人',
      'business_change_directors': '董事/监事人员',
      'business_cancel_limited': '有限责任公司',
      'business_cancel_branch': '有限责任公司分支机构',
      'business_cancel_individual': '个人独资企业',
      'business_cancel_partnership': '合伙企业',
      'business_cancel_foreign': '外商投资企业',
      'business_cancel_joint_stock': '股份有限公司',
      'business_cancel_self_employed': '个体工商户',
      'business_other_annual_report': '年报公示',
      'business_other_remove_exception': '解除异常',
      'business_other_info_repair': '信息修复',
      'business_other_file_retrieval': '档案调取',
      'business_other_license_annual': '许可证年检',
      'business_address_small_scale': '地址托管-小规模',
      'business_address_general': '地址托管-一般纳税人',
      'business_material_seal': '备案章',
      'business_material_rubber': '胶皮章',
      'business_material_crystal': '水晶章',
      'business_material_kt_board': 'KT板牌子',
      'business_material_copper': '铜牌',
      // 税务项目
      'tax_assessment': '核定税种',
      'tax_filing': '报税',
      'tax_cancellation': '注销',
      'tax_invoice_apply': '申请发票',
      'tax_invoice_issue': '代开发票',
      'tax_change': '税务变更',
      'tax_remove_exception': '解除异常',
      'tax_supplement': '补充申报',
      'tax_software': '记账软件',
      'tax_invoice_software': '开票软件',
      // 银行项目
      'bank_general_account': '一般账户设立',
      'bank_basic_account': '基本账户设立',
      'bank_foreign_account': '外币账户设立',
      'bank_info_change': '信息变更',
      'bank_cancel': '银行账户注销',
      'bank_financing': '融资业务（开通平台手续）',
      'bank_loan': '贷款服务',
      // 社保项目
      'social_security_open': '社保开户',
      'social_security_hosting': '社保托管',
      'social_security_cancel': '社保账户注销',
      'fund_open': '公积金开户',
      'fund_hosting': '公积金托管',
      'fund_change': '公积金变更',
      // 许可业务项目
      'license_food': '食品经营许可证',
      'license_health': '卫生许可证',
      'license_catering': '餐饮许可证',
      'license_transport': '道路运输许可证',
      'license_medical': '二类医疗器械备案',
      'license_other': '其他许可证',
      'license_prepackaged': '预包装食品备案'
    }
    
    return itemNameMap[itemKey] || itemKey
  }

  // 验证表单数据
  const validateForm = (): boolean => {
    // 检查必填字段
    if (!formData.partyACompany?.trim()) {
      message.error('请填写甲方公司名称')
      return false
    }
    
    if (!formData.totalCost || formData.totalCost <= 0) {
      message.error('请填写费用总计')
      return false
    }
    
    // 检查勾选项目的服务费是否填写
    const hasBusinessItems = hasCheckedItems([
      'business_establish_limited', 'business_establish_branch', 'business_establish_individual',
      'business_establish_partnership', 'business_establish_nonprofit', 'business_establish_joint_stock',
      'business_establish_self_employed', 'business_change_legal_person', 'business_change_shareholder',
      'business_change_capital', 'business_change_name', 'business_change_scope', 'business_change_address',
      'business_change_manager', 'business_change_directors', 'business_cancel_limited', 'business_cancel_branch',
      'business_cancel_individual', 'business_cancel_partnership', 'business_cancel_foreign',
      'business_cancel_joint_stock', 'business_cancel_self_employed', 'business_other_annual_report',
      'business_other_remove_exception', 'business_other_info_repair', 'business_other_file_retrieval',
      'business_other_license_annual', 'business_address_small_scale', 'business_address_general',
      'business_material_seal', 'business_material_rubber', 'business_material_crystal',
      'business_material_kt_board', 'business_material_copper'
    ])
    
    if (hasBusinessItems && (!formData.businessServiceFee || formData.businessServiceFee <= 0)) {
      message.error('已勾选工商服务项目，请填写工商服务费')
      return false
    }
    
    return true
  }

  // 处理提交
  const handleSubmit = async () => {
    if (!validateForm()) {
      throw new Error('表单验证失败')
    }
    
    try {
      const serviceData = collectServiceData()
      
      const submitData: CreateContractDto = {
        signatory: formData.signatory,
        contractType: formData.contractType,
        partyACompany: formData.partyACompany,
        partyAAddress: formData.partyAAddress,
        partyAContact: formData.partyAContact,
        partyAPhone: formData.partyAPhone,
        partyBContact: formData.partyBContact,
        partyBPhone: formData.partyBPhone,
        businessEstablishmentAddress: formData.businessEstablishmentAddress,
        businessRemark: formData.businessRemark,
        businessServiceFee: formData.businessServiceFee,
        taxRemark: formData.taxRemark,
        taxServiceFee: formData.taxServiceFee,
        bankRemark: formData.bankRemark,
        bankServiceFee: formData.bankServiceFee,
        socialSecurityRemark: formData.socialSecurityRemark,
        socialSecurityServiceFee: formData.socialSecurityServiceFee,
        licenseRemark: formData.licenseRemark,
        licenseServiceFee: formData.licenseServiceFee,
        otherRemark: formData.otherRemark,
        totalCost: formData.totalCost,
        partyASignDate: formData.partyASignDate,
        partyBSignDate: formData.partyBSignDate,
        ...serviceData
      }
      
      if (onSubmit) {
        await onSubmit(submitData)
      } else {
        await createContractData(submitData)
        message.success('合同创建成功')
      }
    } catch (error) {
      console.error('提交合同失败:', error)
      // 重新抛出错误，让父组件处理
      throw error
    }
  }

  // 渲染带金额输入框的复选框
  const renderCheckboxWithAmount = (itemKey: string, label: string) => {
    const isChecked = checkedItems[itemKey] || false
    const amount = itemAmounts[itemKey] || ''
    
    return (
      <div className="checkbox-with-amount">
        <Checkbox 
          checked={isChecked}
          onChange={(e) => handleCheckboxChange(itemKey, e.target.checked)}
        >
          {label}
        </Checkbox>
        {isChecked && (
          <div className="amount-input-group">
            <Input
              className="amount-inline-input"
              value={amount}
              onChange={(e) => handleAmountChange(itemKey, e.target.value)}
              placeholder="金额"
              size="small"
            />
            <span className="amount-unit">元</span>
          </div>
        )}
      </div>
    )
  }

  // 检查某个类别是否有勾选项
  const hasCheckedItems = (categoryKeys: string[]) => {
    return categoryKeys.some(key => checkedItems[key])
  }

  useImperativeHandle(ref, () => ({
    validateForm,
    handleSubmit
  }))

  return (
    <div className="product-service-agreement">
      {/* 合同头部 */}
      <div className="contract-header">
        <div className="logo-section">
          <img src="/images/contract-logo.png" alt="公司logo" className="company-logo" />
          <div className="company-info">
            <h2 className="company-name">{config.title}</h2>
            {config.englishTitle && (
              <p className="company-name-en">{config.englishTitle}</p>
            )}
            <p className="contact-info">咨询电话：{config.phone}</p>
            {config.englishTitle && (
              <p className="company-registration">Company Registration</p>
            )}
          </div>
        </div>
      </div>

      {/* 合同标题 */}
      <div className="contract-title">
        <h1>中岳产品服务协议</h1>
      </div>

      {/* 合同双方信息 */}
      <div className="contract-parties">
        {/* 委托方信息块 */}
        <div className="party-block">
          <div className="party-header">
            <span className="party-label">【委托方】（甲方）：</span>
            <Input 
              className="party-company-input"
              value={formData.partyACompany || ''}
              onChange={(e) => handleFormChange('partyACompany', e.target.value)}
              placeholder="请输入甲方公司名称"
            />
          </div>
          
          <div className="party-details">
            <div className="detail-row">
              <span className="detail-label">通讯地址：</span>
              <Input 
                className="detail-input"
                value={formData.partyAAddress || ''}
                onChange={(e) => handleFormChange('partyAAddress', e.target.value)}
                placeholder="请输入甲方通讯地址"
              />
            </div>
            
            <div className="contact-row">
              <div className="contact-item">
                <span className="contact-label">联系人：</span>
                <Input 
                  className="contact-input"
                  value={formData.partyAContact || ''}
                  onChange={(e) => handleFormChange('partyAContact', e.target.value)}
                  placeholder="联系人"
                />
              </div>
              <div className="contact-item">
                <span className="contact-label">联系电话：</span>
                <Input 
                  className="phone-input"
                  value={formData.partyAPhone || ''}
                  onChange={(e) => handleFormChange('partyAPhone', e.target.value)}
                  placeholder="联系电话"
                />
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
                <Input 
                  className="contact-input"
                  value={formData.partyBContact || ''}
                  onChange={(e) => handleFormChange('partyBContact', e.target.value)}
                  placeholder="联系人"
                />
              </div>
              <div className="contact-item">
                <span className="contact-label">联系电话：</span>
                <Input 
                  className="phone-input"
                  value={formData.partyBPhone || ''}
                  onChange={(e) => handleFormChange('partyBPhone', e.target.value)}
                  placeholder="联系电话"
                />
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
            <div className="checkbox-group">
              {renderCheckboxWithAmount('business_establish_limited', '有限责任公司')}
              {renderCheckboxWithAmount('business_establish_branch', '有限责任公司分支机构')}
              {renderCheckboxWithAmount('business_establish_individual', '个人独资企业')}
              {renderCheckboxWithAmount('business_establish_partnership', '合伙企业')}
              {renderCheckboxWithAmount('business_establish_nonprofit', '民办非企业')}
              <br />
              {renderCheckboxWithAmount('business_establish_joint_stock', '股份有限公司')}
              {renderCheckboxWithAmount('business_establish_self_employed', '个体工商户')}
            </div>
            <div className="service-description">
              <span>在</span>
              <Input 
                className="location-input" 
                placeholder="请输入地点"
                value={formData.businessEstablishmentAddress || ''}
                onChange={(e) => handleFormChange('businessEstablishmentAddress', e.target.value)}
              />
              <span>为甲方代办工商营业执照。</span>
            </div>
          </div>

          <div className="service-item">
            <span>②变更：</span>
            <div className="checkbox-group">
              {renderCheckboxWithAmount('business_change_legal_person', '法定代表人')}
              {renderCheckboxWithAmount('business_change_shareholder', '股东股权')}
              {renderCheckboxWithAmount('business_change_capital', '注册资金')}
              {renderCheckboxWithAmount('business_change_name', '公司名称')}
              {renderCheckboxWithAmount('business_change_scope', '经营范围')}
              {renderCheckboxWithAmount('business_change_address', '注册地址')}
              {renderCheckboxWithAmount('business_change_manager', '分公司负责人')}
              <br />
              {renderCheckboxWithAmount('business_change_directors', '董事/监事人员')}
            </div>
          </div>

          <div className="service-item">
            <span>③注销：</span>
            <div className="checkbox-group">
              {renderCheckboxWithAmount('business_cancel_limited', '有限责任公司')}
              {renderCheckboxWithAmount('business_cancel_branch', '有限责任公司分支机构')}
              {renderCheckboxWithAmount('business_cancel_individual', '个人独资企业')}
              {renderCheckboxWithAmount('business_cancel_partnership', '合伙企业')}
              {renderCheckboxWithAmount('business_cancel_foreign', '外商投资企业')}
              <br />
              {renderCheckboxWithAmount('business_cancel_joint_stock', '股份有限公司')}
              {renderCheckboxWithAmount('business_cancel_self_employed', '个体工商户')}
            </div>
          </div>

          <div className="service-item">
            <span>④其他：</span>
            <div className="checkbox-group">
              {renderCheckboxWithAmount('business_other_annual_report', '年报公示')}
              {renderCheckboxWithAmount('business_other_remove_exception', '解除异常')}
              {renderCheckboxWithAmount('business_other_info_repair', '信息修复')}
              {renderCheckboxWithAmount('business_other_file_retrieval', '档案调取')}
              {renderCheckboxWithAmount('business_other_license_annual', '许可证年检')}
            </div>
            <div className="address-hosting">
              <span>地址托管（</span>
              {renderCheckboxWithAmount('business_address_small_scale', '小规模')}
              {renderCheckboxWithAmount('business_address_general', '一般纳税人')}
              <span>）</span>
            </div>
          </div>

          <div className="service-item">
            <span>⑤物料：</span>
            <div className="checkbox-group">
              {renderCheckboxWithAmount('business_material_seal', '备案章')}
              {renderCheckboxWithAmount('business_material_rubber', '胶皮章')}
              {renderCheckboxWithAmount('business_material_crystal', '水晶章')}
              {renderCheckboxWithAmount('business_material_kt_board', 'KT板牌子')}
              {renderCheckboxWithAmount('business_material_copper', '铜牌')}
            </div>
          </div>

          <div className="service-remark">
            <span>备注：</span>
            <Input 
              className="remark-input"
              value={formData.businessRemark || ''}
              onChange={(e) => handleFormChange('businessRemark', e.target.value)}
            />
            <span>，服务费用：</span>
            <Input 
              className={`fee-input ${hasCheckedItems([
                'business_establish_limited', 'business_establish_branch', 'business_establish_individual',
                'business_establish_partnership', 'business_establish_nonprofit', 'business_establish_joint_stock',
                'business_establish_self_employed', 'business_change_legal_person', 'business_change_shareholder',
                'business_change_capital', 'business_change_name', 'business_change_scope', 'business_change_address',
                'business_change_manager', 'business_change_directors', 'business_cancel_limited', 'business_cancel_branch',
                'business_cancel_individual', 'business_cancel_partnership', 'business_cancel_foreign',
                'business_cancel_joint_stock', 'business_cancel_self_employed', 'business_other_annual_report',
                'business_other_remove_exception', 'business_other_info_repair', 'business_other_file_retrieval',
                'business_other_license_annual', 'business_address_small_scale', 'business_address_general',
                'business_material_seal', 'business_material_rubber', 'business_material_crystal',
                'business_material_kt_board', 'business_material_copper'
              ]) ? 'required' : ''}`}
              placeholder={hasCheckedItems([
                'business_establish_limited', 'business_establish_branch', 'business_establish_individual',
                'business_establish_partnership', 'business_establish_nonprofit', 'business_establish_joint_stock',
                'business_establish_self_employed', 'business_change_legal_person', 'business_change_shareholder',
                'business_change_capital', 'business_change_name', 'business_change_scope', 'business_change_address',
                'business_change_manager', 'business_change_directors', 'business_cancel_limited', 'business_cancel_branch',
                'business_cancel_individual', 'business_cancel_partnership', 'business_cancel_foreign',
                'business_cancel_joint_stock', 'business_cancel_self_employed', 'business_other_annual_report',
                'business_other_remove_exception', 'business_other_info_repair', 'business_other_file_retrieval',
                'business_other_license_annual', 'business_address_small_scale', 'business_address_general',
                'business_material_seal', 'business_material_rubber', 'business_material_crystal',
                'business_material_kt_board', 'business_material_copper'
              ]) ? '必填' : '费用'}
              value={formData.businessServiceFee || ''}
              onChange={(e) => handleFormChange('businessServiceFee', parseFloat(e.target.value) || 0)}
            />
            <span>。</span>
          </div>
        </div>

        {/* 税务服务 */}
        <div className="service-category">
          <h4>2、税务：</h4>
          <div className="checkbox-group">
            {renderCheckboxWithAmount('tax_assessment', '核定税种')}
            {renderCheckboxWithAmount('tax_filing', '报税')}
            {renderCheckboxWithAmount('tax_cancellation', '注销')}
            {renderCheckboxWithAmount('tax_invoice_apply', '申请发票')}
            {renderCheckboxWithAmount('tax_invoice_issue', '代开发票')}
            {renderCheckboxWithAmount('tax_change', '税务变更')}
            <br />
            {renderCheckboxWithAmount('tax_remove_exception', '解除异常')}
            {renderCheckboxWithAmount('tax_supplement', '补充申报')}
            {renderCheckboxWithAmount('tax_software', '记账软件')}
            {renderCheckboxWithAmount('tax_invoice_software', '开票软件')}
          </div>
          <div className="service-remark">
            <span>备注：</span>
            <Input 
              className="remark-input"
              value={formData.taxRemark || ''}
              onChange={(e) => handleFormChange('taxRemark', e.target.value)}
            />
            <span>，服务费用：</span>
            <Input 
              className={`fee-input ${hasCheckedItems([
                'tax_assessment', 'tax_filing', 'tax_cancellation', 'tax_invoice_apply',
                'tax_invoice_issue', 'tax_change', 'tax_remove_exception', 'tax_supplement',
                'tax_software', 'tax_invoice_software'
              ]) ? 'required' : ''}`}
              placeholder={hasCheckedItems([
                'tax_assessment', 'tax_filing', 'tax_cancellation', 'tax_invoice_apply',
                'tax_invoice_issue', 'tax_change', 'tax_remove_exception', 'tax_supplement',
                'tax_software', 'tax_invoice_software'
              ]) ? '必填' : '费用'}
              value={formData.taxServiceFee || ''}
              onChange={(e) => handleFormChange('taxServiceFee', parseFloat(e.target.value) || 0)}
            />
            <span>。</span>
          </div>
        </div>

        {/* 银行服务 */}
        <div className="service-category">
          <h4>3、银行：</h4>
          <div className="checkbox-group">
            {renderCheckboxWithAmount('bank_general_account', '一般账户设立')}
            {renderCheckboxWithAmount('bank_basic_account', '基本账户设立')}
            {renderCheckboxWithAmount('bank_foreign_account', '外币账户设立')}
            {renderCheckboxWithAmount('bank_info_change', '信息变更')}
            {renderCheckboxWithAmount('bank_cancel', '银行账户注销')}
            <br />
            {renderCheckboxWithAmount('bank_financing', '融资业务（开通平台手续）')}
            {renderCheckboxWithAmount('bank_loan', '贷款服务')}
          </div>
          <div className="service-remark">
            <span>备注：</span>
            <Input 
              className="remark-input"
              value={formData.bankRemark || ''}
              onChange={(e) => handleFormChange('bankRemark', e.target.value)}
            />
            <span>，服务费用：</span>
            <Input 
              className={`fee-input ${hasCheckedItems([
                'bank_general_account', 'bank_basic_account', 'bank_foreign_account',
                'bank_info_change', 'bank_cancel', 'bank_financing', 'bank_loan'
              ]) ? 'required' : ''}`}
              placeholder={hasCheckedItems([
                'bank_general_account', 'bank_basic_account', 'bank_foreign_account',
                'bank_info_change', 'bank_cancel', 'bank_financing', 'bank_loan'
              ]) ? '必填' : '费用'}
              value={formData.bankServiceFee || ''}
              onChange={(e) => handleFormChange('bankServiceFee', parseFloat(e.target.value) || 0)}
            />
            <span>。</span>
          </div>
        </div>

        {/* 社保服务 */}
        <div className="service-category">
          <h4>4、社保：</h4>
          <div className="checkbox-group">
            {renderCheckboxWithAmount('social_security_open', '社保开户')}
            {renderCheckboxWithAmount('social_security_hosting', '社保托管')}
            {renderCheckboxWithAmount('social_security_cancel', '社保账户注销')}
            {renderCheckboxWithAmount('fund_open', '公积金开户')}
            {renderCheckboxWithAmount('fund_hosting', '公积金托管')}
            {renderCheckboxWithAmount('fund_change', '公积金变更')}
          </div>
          <div className="service-remark">
            <span>备注：</span>
            <Input 
              className="remark-input"
              value={formData.socialSecurityRemark || ''}
              onChange={(e) => handleFormChange('socialSecurityRemark', e.target.value)}
            />
            <span>，服务费用：</span>
            <Input 
              className={`fee-input ${hasCheckedItems([
                'social_security_open', 'social_security_hosting', 'social_security_cancel',
                'fund_open', 'fund_hosting', 'fund_change'
              ]) ? 'required' : ''}`}
              placeholder={hasCheckedItems([
                'social_security_open', 'social_security_hosting', 'social_security_cancel',
                'fund_open', 'fund_hosting', 'fund_change'
              ]) ? '必填' : '费用'}
              value={formData.socialSecurityServiceFee || ''}
              onChange={(e) => handleFormChange('socialSecurityServiceFee', parseFloat(e.target.value) || 0)}
            />
            <span>。</span>
          </div>
        </div>

        {/* 许可业务 */}
        <div className="service-category">
          <h4>5、许可业务：</h4>
          <div className="checkbox-group">
            {renderCheckboxWithAmount('license_food', '食品经营许可证')}
            {renderCheckboxWithAmount('license_health', '卫生许可证')}
            {renderCheckboxWithAmount('license_catering', '餐饮许可证')}
            {renderCheckboxWithAmount('license_transport', '道路运输许可证')}
            {renderCheckboxWithAmount('license_medical', '二类医疗器械备案')}
            <br />
            {renderCheckboxWithAmount('license_other', '其他许可证')}
            {renderCheckboxWithAmount('license_prepackaged', '预包装食品备案')}
          </div>
          <div className="service-remark">
            <span>备注：</span>
            <Input 
              className="remark-input"
              value={formData.licenseRemark || ''}
              onChange={(e) => handleFormChange('licenseRemark', e.target.value)}
            />
            <span>，服务费用：</span>
            <Input 
              className={`fee-input ${hasCheckedItems([
                'license_food', 'license_health', 'license_catering', 'license_transport',
                'license_medical', 'license_other', 'license_prepackaged'
              ]) ? 'required' : ''}`}
              placeholder={hasCheckedItems([
                'license_food', 'license_health', 'license_catering', 'license_transport',
                'license_medical', 'license_other', 'license_prepackaged'
              ]) ? '必填' : '费用'}
              value={formData.licenseServiceFee || ''}
              onChange={(e) => handleFormChange('licenseServiceFee', parseFloat(e.target.value) || 0)}
            />
            <span>。</span>
          </div>
        </div>

        {/* 费用总计 */}
        <div className="total-cost">
          <div className="cost-row">
            <span>费用总计（人民币）：</span>
            <Input 
              className="amount-input required" 
              placeholder="必填"
              value={formData.totalCost || ''}
              onChange={(e) => handleFormChange('totalCost', parseFloat(e.target.value) || 0)}
            />
            <span>元</span>
            <span className="amount-label">大写金额（人民币）：</span>
            <Input 
              className="amount-text-input required" 
              placeholder="必填"
              value={formData.totalCostInWords || ''}
              onChange={(e) => handleFormChange('totalCostInWords', e.target.value)}
            />
            <span>。</span>
          </div>
          <div className="cost-remark">
            <span>备注：</span>
            <Input 
              className="remark-long-input"
              value={formData.otherRemark || ''}
              onChange={(e) => handleFormChange('otherRemark', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 付款方式 */}
      <div className="payment-section">
        <h3>（二）付款方式</h3>
        <p>请务必及时将详细的付款信息及公司名称、服务协议编号提供于我司，以便我司及时查收款项。本合同签订后，超过3个工作日未支付本合同自动失效。</p>
      </div>

      {/* 甲方权利义务 */}
      <div className="rights-obligations-section">
        <h3>（三）甲方的权利与义务</h3>
        
        <div className="obligation-item">
          <p>1、甲方应按照约定向乙方提供按现行法律、法规、规章报批项目所需资料、文件。甲方所提供资料文件必须真实、合法、完整、准确，否则造成的全部损失均由甲方承担。</p>
        </div>

        <div className="obligation-item">
          <p>2、本协议签署后甲方应当在当日内向乙方一次性支付全部服务费用。若因实际情况甲方提出修改要求，则需另行支付费用：300元（人民币）/次。</p>
        </div>

        <div className="obligation-item">
          <p>3、本协议的签署表示甲方同意委托乙方及关联服务机构或其他具有资质的合作服务商共同为其提供商事服务：如有必要，甲方应按照乙方安排与乙方关联服务机构或其他具有资质的合作服务商签署服务或咨询合同。</p>
        </div>

        <div className="obligation-item">
          <p>4、甲方取得代办证照及材料应当用于合法经营，如利用代办证照及材料从事违法及非法经营活动，所产生的一切责任由甲方承担。</p>
        </div>

        <div className="obligation-item">
          <p>5、本协议履行完毕后，甲方应依法开展民事活动，因甲方非法经营、失联、违约等所产生的法律后果与乙方无关。</p>
        </div>
      </div>

      {/* 乙方权利义务 */}
      <div className="rights-obligations-section">
        <h3>（四）乙方的权利与义务</h3>
        
        <div className="obligation-item">
          <p>1、乙方通过书面或电子邮件等方式为甲方提供服务解决方案、所需条件、资料文件并及时向甲方报告委托事项的进展。</p>
        </div>

        <div className="obligation-item">
          <p>2、乙方服务时限自甲方完整提供全部信息、资料、文件时起算，因甲方确认需求、提供资料、签署文件缺失或由于甲方原因导致服务与咨询时间延长不计入服务时限；甲方更改需求后，服务时限重新计算；若因不可抗力因素（包括但不限于自然灾害、社会变动、战争影响、行政机关或服务机构系统网络故障、法律修订、政策变动或被行政机关抽查检查等导致产品失效）导致服务或咨询时限暂停期间不计入服务时限，但乙方应及时将进度等情况告知甲方。</p>
        </div>

        <div className="obligation-item">
          <p>3、乙方可委托关联服务机构共同为甲方委托事宜提供服务，关联服务机构的费用由乙方代收代付并全部包含于本合同的总费用中，但本合同另有约定的除外。</p>
        </div>

        <div className="obligation-item">
          <p>4、为保障服务时限与质量，乙方确认甲方满足本协议服务或咨询条件时，可通知甲方推进该服务，甲方自收到乙方通知（包括但不限于邮件、微信及短信方式）的30日内无正当理由拒绝提供所需信息、资料、文件，视为放弃该项服务或咨询，乙方不再就该项服务或咨询负有相关义务，因此产生延误、行政处罚、失信公示等后果，乙方不承担相应责任。</p>
        </div>

        <div className="obligation-item">
          <p>5、乙方对甲方提供的证件和资料负有妥善保管和保密责任，乙方不得将证件和资料提供给与新企业开业登记（包括工商、质监、税务等部门）无关的其他第三者。</p>
        </div>

        <div className="obligation-item">
          <p>6、协议中涉及政府费或第三方服务费，由第三方为甲方开具有效发票。</p>
        </div>
      </div>

      {/* 合同的解除、终止履行 */}
      <div className="termination-section">
        <h3>（五）合同的解除、终止履行</h3>
        
        <div className="termination-item">
          <p>1、若甲方出现下列情形，且经乙方有效通知后30个自然日内无法达成合意，乙方有权单方终止本协议，不再承担相应义务：</p>
          <div className="sub-item">
            <p>（1）甲方无正当理由要求解除本服务协议；甲方的资料、文件未完全披露或含有虚假内容；甲方无正当理由拒绝向行政机关或第三方服务机构缴纳相关费用。</p>
          </div>
          <div className="sub-item">
            <p>（2）乙方通知（包括但不限于邮件、短信、微信方式）甲方补充文件、资料，但甲方在合理时间（不少于2个工作日）内无回应或因甲方原因导致服务协议自签署之日起12个自然月内服务或咨询项目仍未正常推进或完结。</p>
          </div>
          <div className="sub-item">
            <p>（3）甲方无法按法律、行政法规、规章以及行政机关政策、程序向乙方提供所需资料、文件或无法提供有效联系人、相应经营条件以满足行政机关核查要求等影响服务或咨询推进；甲方的需求因法律、行政法规、规章以及行政机关政策、程序调整而无法实现。</p>
          </div>
          <div className="sub-item">
            <p>（4）甲方自有办公场所不符合商事服务条件，且无法更换有效办公场所；甲方投资人、法定代表人或高管人员因信用瑕疵无法投资或任职，且无法更换其他自然人或组织。</p>
          </div>
        </div>

        <div className="termination-item">
          <p>2、若乙方出现下列情形，且经甲方有效通知后10个自然日内无法达成合意，甲方有权单方终止本协议，不再承担相应义务：</p>
          <div className="sub-item">
            <p>（1）乙方及其关联方未按协议约定提供咨询与服务。</p>
          </div>
          <div className="sub-item">
            <p>（2）乙方提供第三方服务商产品无法完成本协议服务事项，且无其他可替代产品。</p>
          </div>
        </div>

        <div className="termination-item">
          <p>3、甲方提出书面或邮件退款申请且乙方无异议，视为对本服务协议的解除，双方不再承担本协议项下权利与义务，乙方于本服务中出具的服务费用收据将自动失效且乙方将于十个工作日内按以下内容确定退款金额，完成退款：</p>
          <div className="sub-item">
            <p>（1）已向行政机关/银行、会计师事务所、报社等服务机构缴纳的官费不予退还；</p>
          </div>
          <div className="sub-item">
            <p>（2）因甲方原因终止服务，已占用企业办公场所等产品资源导致第三方服务商扣除全部或部分产品使用费用，该费用不予退还；</p>
          </div>
          <div className="sub-item">
            <p>（3）协议解除前已发生服务或咨询项目所需必要的服务费用不予退还；</p>
          </div>
          <div className="sub-item">
            <p>（4）因本协议第（五）条第1款原因导致协议终止，乙方有权扣除甲方已缴费用中除上述三项外剩余服务费用的30%作为违约金。</p>
          </div>
        </div>
      </div>

      {/* 违约责任 */}
      <div className="liability-section">
        <h3>（六）违约责任</h3>
        
        <div className="liability-item">
          <p>1、除由法律规定的连带责任以外，本协议任何一方均不对因协议内容履行不当而导致他方的间接损失承担责任，包括但不限于由本协议引起或与其相关的任何违约或导致一方利润、业务、收益、商誉损失，不论过错方是否已知晓该种损失的可能性。</p>
        </div>

        <div className="liability-item">
          <p>2、乙方在提供商事服务或法律咨询过程中，因不可抗力或各方原因导致服务或咨询无法继续履行，一方应立即将客观情形有效告知对方，并应在十五个工作日内，提供详情及协议内容不能履行、部分不能履行或者需要延期履行理由的有效证明文件；双方依客观情形对履行协议权力义务的程度，协商决定是否解除本协议，或部分免除履行协议责任，或延期履行本协议。</p>
        </div>

        <div className="liability-item">
          <p>3、因不可抗力因素（包括但不限于自然灾害、社会变动、战争影响、网络故障、法律修订、政策变动）导致服务或咨询无法继续，本协议确认解除的，乙方应根据第（五）条第3款内容退还甲方所付服务费用。</p>
        </div>
      </div>

      {/* 其他条款 */}
      <div className="other-section">
        <h3>（七）其他</h3>
        
        <div className="other-item">
          <p>1、协议生效后各方应认真自觉遵守，在协议履行过程中发生的争议，各方应协商解决，若协商不成，任何一方应向乙方所在地人民法院提起诉讼。</p>
        </div>

        <div className="other-item">
          <p>2、本协议签订前各方所发生的委托事宜，甲乙双方在本协议商事服务与法律咨询范围内予以追认。</p>
        </div>

        <div className="other-item">
          <p>3、本合同为中文版本，并适用中国大陆地区法律，本合同自双方盖章且甲方按约定完成付款之日起生效。</p>
        </div>

        <div className="other-item">
          <p>4、本协议补充条款经甲乙双方确认后，属于对本协议的有效补充，具有法律效力，乙方员工口头承诺内容未经本协议记载，均不发生法律效力。</p>
        </div>

        <div className="other-item">
          <p>5、本协议各方所提供的资料、文件均属商业机密，各方不得以任何理由在与本协议服务或咨询无关的场合或其他目的进行披露，政府行政机构依法获得及批准除外。</p>
        </div>

        <div className="other-item">
          <p>6、本合同一式二份，协议各方各执一份。各份协议文本具有同等法律效力。</p>
        </div>
      </div>

      {/* 签署区域 */}
      <div className="signature-section">
        <div className="signature-row">
          <div className="signature-item">
            <span>（甲方盖章）：</span>
            <div className="signature-area"></div>
          </div>
          <div className="signature-item">
            <span>（乙方盖章）：</span>
            <div className="signature-area"></div>
          </div>
        </div>
        
        <div className="date-row">
          <div className="date-item">
            <span>日期：</span>
            <DatePicker 
              placeholder="选择日期" 
              format="YYYY年MM月DD日"
              onChange={(date) => handleFormChange('partyASignDate', date?.format('YYYY-MM-DD'))}
            />
          </div>
          <div className="date-item">
            <span>日期：</span>
            <DatePicker 
              placeholder="选择日期" 
              format="YYYY年MM月DD日"
              onChange={(date) => handleFormChange('partyBSignDate', date?.format('YYYY-MM-DD'))}
            />
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <div className="contract-footer">
        <div className="footer-info">
          <p>{config.footer}</p>
          <p>中岳服务平台专注于中小微企业服务，主要业务：企业注册、财务代理、人事代理、商标注册、办公租赁、税收筹划、法律服务等。</p>
        </div>
      </div>
    </div>
  )
})

export default ProductServiceAgreement 