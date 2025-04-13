import React, { useEffect, useState } from 'react'
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  InputNumber,
  Tabs,
  Upload,
  message,
  Space,
  Image,
  Switch,
} from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import type { Customer } from '../../types'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import { useCustomerDetail } from '../../hooks/useCustomer'
import type { TabsProps } from 'antd'
import ImageUpload from '../../components/ImageUpload'
import MultiImageUpload from '../../components/MultiImageUpload'
import { processCustomerImages } from '../../utils/customer'
import { safeGetFieldValue, safeSetFieldValue } from '../../utils/formUtils'

// 业务状态映射
export const BUSINESS_STATUS_MAP = {
  normal: '正常',
  terminated: '终止',
  suspended: '暂停',
} as const

interface CustomerFormProps {
  customer?: Customer | null
  mode: 'add' | 'edit' | 'view'
  onSuccess?: (isAutoSave: boolean) => void
  onCancel?: () => void
}

// 为表单值创建类型，允许日期字段为Dayjs类型
type FormCustomer = Omit<
  Customer,
  'establishmentDate' | 'licenseExpiryDate' | 'capitalContributionDeadline'
> & {
  establishmentDate?: Dayjs | null
  licenseExpiryDate?: Dayjs | null
  capitalContributionDeadline?: Dayjs | null
  [key: string]: any // 添加索引签名
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, mode, onSuccess, onCancel }) => {
  const [form] = Form.useForm<FormCustomer>()
  const [activeTab, setActiveTab] = useState<string>('basic')
  const [isSaving, setIsSaving] = useState(false)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const customerId = customer?.id ?? 0
  const { createCustomer, updateCustomer } = useCustomerDetail(customerId)

  useEffect(() => {
    if (customer && mode !== 'add') {
      form.setFieldsValue({
        ...customer,
        establishmentDate: customer.establishmentDate
          ? dayjs(customer.establishmentDate)
          : undefined,
        licenseExpiryDate: customer.licenseExpiryDate
          ? dayjs(customer.licenseExpiryDate)
          : undefined,
        capitalContributionDeadline: customer.capitalContributionDeadline
          ? dayjs(customer.capitalContributionDeadline)
          : undefined,
      })
    }
  }, [customer, form])

  const handleSubmit = async (values: any, isAutoSave = false) => {
    if (isSaving) return

    try {
      setIsSaving(true)
      // 处理日期字段和图片字段
      const processedValues = {
        ...values,
        establishmentDate: values.establishmentDate?.format('YYYY-MM-DD'),
        licenseExpiryDate: values.licenseExpiryDate?.format('YYYY-MM-DD'),
        capitalContributionDeadline: values.capitalContributionDeadline?.format('YYYY-MM-DD'),
        // 确保图片字段是对象类型
        legalPersonIdImages: values.legalPersonIdImages || {},
        otherIdImages: values.otherIdImages || {},
        businessLicenseImages: values.businessLicenseImages || {},
        bankAccountLicenseImages: values.bankAccountLicenseImages || {},
        supplementaryImages: values.supplementaryImages || {},
      }

      console.log('提交处理后的客户数据:', processedValues)

      if (mode === 'add') {
        // 调用创建客户 API
        const success = await createCustomer(processedValues)
        if (success) {
          message.success('创建客户成功')
          onSuccess?.(isAutoSave)
        }
      } else {
        // 调用更新客户 API
        if (!customer?.id) {
          message.error('客户ID不存在')
          return
        }
        const success = await updateCustomer(customer.id, processedValues)
        if (success) {
          message.success('更新客户成功')
          onSuccess?.(isAutoSave)
        }
      }
    } catch (error) {
      console.error('保存客户信息出错:', error)
      message.error('操作失败：' + (error instanceof Error ? error.message : '未知错误'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleAutoSave = async () => {
    if (!autoSaveEnabled || isSaving || mode === 'view') return

    try {
      // 验证表单必填项，如果有错误则不自动保存
      const fields = [
        'companyName',
        'socialCreditCode',
        'dailyContact',
        'dailyContactPhone',
        'salesRepresentative',
        'taxBureau',
        'taxRegistrationType',
        'enterpriseStatus',
        'businessStatus',
      ]

      const values = form.getFieldsValue()
      let hasError = false

      // 检查必填字段
      for (const field of fields) {
        if (!values[field]) {
          console.log(`自动保存：${field} 字段为空，跳过自动保存`)
          hasError = true
          break
        }
      }

      if (hasError) {
        console.log('自动保存：表单验证未通过，跳过自动保存')
        return
      }

      // 提交表单
      console.log('自动保存：图片更新后触发自动保存')
      await form.validateFields()
      await handleSubmit(form.getFieldsValue(), true) // 传递isAutoSave=true参数
    } catch (error) {
      console.error('自动保存出错:', error)
      // 不显示错误消息，避免干扰用户
    }
  }

  const tabs: TabsProps['items'] = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
          <Form.Item name="companyName" label="企业名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="socialCreditCode" label="统一社会信用代码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="dailyContact" label="日常联系人" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="dailyContactPhone" label="联系电话" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="salesRepresentative" label="业务员" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="businessSource" label="业务来源">
            <Input />
          </Form.Item>

          <Form.Item name="taxBureau" label="所属税局" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="taxRegistrationType" label="税务登记类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="general">一般纳税人</Select.Option>
              <Select.Option value="small">小规模纳税人</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="enterpriseStatus" label="企业状态" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="active">正常经营</Select.Option>
              <Select.Option value="inactive">停业</Select.Option>
              <Select.Option value="closed">注销</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="businessStatus" label="业务状态" rules={[{ required: true }]}>
            <Select>
              {Object.entries(BUSINESS_STATUS_MAP).map(([value, label]) => (
                <Select.Option key={value} value={value}>
                  {String(label)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="enterpriseType" label="企业类型">
            <Select>
              <Select.Option value="有限责任公司">有限责任公司</Select.Option>
              <Select.Option value="股份有限公司">股份有限公司</Select.Option>
              <Select.Option value="个人独资企业">个人独资企业</Select.Option>
              <Select.Option value="合伙企业">合伙企业</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="communicationNotes" label="沟通注意事项">
            <Input.TextArea rows={2} />
          </Form.Item>
        </div>
      ),
    },
    {
      key: '2',
      label: '业务详情',
      children: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
          <Form.Item name="mainBusiness" label="主营业务">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="businessScope" label="经营范围">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="businessAddress" label="经营地址">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="bossProfile" label="老板简介">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="communicationNotes" label="沟通注意事项">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="affiliatedEnterprises" label="关联企业">
            <Input.TextArea rows={2} />
          </Form.Item>
        </div>
      ),
    },
    {
      key: '3',
      label: '银行账户',
      children: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
          <Form.Item name="basicBank" label="基本户银行">
            <Input />
          </Form.Item>

          <Form.Item name="basicBankAccount" label="基本户账号">
            <Input />
          </Form.Item>

          <Form.Item name="basicBankNumber" label="基本户行号">
            <Input />
          </Form.Item>

          <Form.Item name="generalBank" label="一般户银行">
            <Input />
          </Form.Item>

          <Form.Item name="generalBankAccount" label="一般户账号">
            <Input />
          </Form.Item>

          <Form.Item name="generalBankNumber" label="一般户行号">
            <Input />
          </Form.Item>

          <Form.Item name="hasOnlineBanking" label="是否有网银">
            <Select>
              <Select.Option value="是">是</Select.Option>
              <Select.Option value="否">否</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="isOnlineBankingCustodian" label="网银是否托管">
            <Select>
              <Select.Option value="是">是</Select.Option>
              <Select.Option value="否">否</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="tripartiteAgreementAccount" label="三方协议账户">
            <Input />
          </Form.Item>
        </div>
      ),
    },
    {
      key: '4',
      label: '税务信息',
      children: (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item name="taxCategories" label="税种">
              <Input.TextArea rows={2} />
            </Form.Item>

            <Form.Item name="personalIncomeTaxPassword" label="个税申报密码">
              <Input />
            </Form.Item>

            <Form.Item name="personalIncomeTaxStaff" label="个税申报人员">
              <Input />
            </Form.Item>
          </div>

          <h3 className="mt-4 md:mt-6 mb-3 font-medium">法定代表人</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item name="legalRepresentativeName" label="姓名">
              <Input />
            </Form.Item>

            <Form.Item name="legalRepresentativePhone" label="联系电话">
              <Input />
            </Form.Item>

            <Form.Item name="legalRepresentativeId" label="身份证号">
              <Input />
            </Form.Item>

            <Form.Item name="legalRepresentativeTaxPassword" label="电子税务局密码">
              <Input />
            </Form.Item>
          </div>

          <h3 className="mt-4 md:mt-6 mb-3 font-medium">财务负责人</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item name="financialContactName" label="姓名">
              <Input />
            </Form.Item>

            <Form.Item name="financialContactPhone" label="联系电话">
              <Input />
            </Form.Item>

            <Form.Item name="financialContactId" label="身份证号">
              <Input />
            </Form.Item>

            <Form.Item name="financialContactTaxPassword" label="电子税务局密码">
              <Input />
            </Form.Item>
          </div>

          <h3 className="mt-4 md:mt-6 mb-3 font-medium">办税员</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item name="taxOfficerName" label="姓名">
              <Input />
            </Form.Item>

            <Form.Item name="taxOfficerPhone" label="联系电话">
              <Input />
            </Form.Item>

            <Form.Item name="taxOfficerId" label="身份证号">
              <Input />
            </Form.Item>

            <Form.Item name="taxOfficerTaxPassword" label="电子税务局密码">
              <Input />
            </Form.Item>
          </div>
        </>
      ),
    },
    {
      key: '5',
      label: '证照信息',
      children: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
          <Form.Item name="licenseExpiryDate" label="营业执照到期日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="capitalContributionDeadline" label="注册资本认缴截止日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="paidInCapital" label="实缴资本">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="annualInspectionPassword" label="年检密码">
            <Input />
          </Form.Item>

          <Form.Item name="shareholders" label="股东信息">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="supervisors" label="监事信息">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="administrativeLicenses" label="行政许可">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="capitalContributionRecords" label="资本实缴记录">
            <Input.TextArea rows={2} />
          </Form.Item>
        </div>
      ),
    },
    {
      key: '6',
      label: '图片资料',
      children: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">法人身份证照片</h3>
              <Form.Item name={['legalPersonIdImages', 'front']} label="身份证正面">
                <ImageUpload
                  label="身份证正面"
                  disabled={mode === 'view'}
                  value={safeGetFieldValue(form, ['legalPersonIdImages', 'front'])}
                  onChange={value =>
                    safeSetFieldValue(form, ['legalPersonIdImages', 'front'], value)
                  }
                  onSuccess={handleAutoSave}
                />
              </Form.Item>
              <Form.Item name={['legalPersonIdImages', 'back']} label="身份证反面">
                <ImageUpload
                  label="身份证反面"
                  disabled={mode === 'view'}
                  value={safeGetFieldValue(form, ['legalPersonIdImages', 'back'])}
                  onChange={value =>
                    safeSetFieldValue(form, ['legalPersonIdImages', 'back'], value)
                  }
                  onSuccess={handleAutoSave}
                />
              </Form.Item>
            </div>

            <div>
              <h3 className="font-medium mb-2">营业执照照片</h3>
              <Form.Item name={['businessLicenseImages', 'main']} label="营业执照">
                <ImageUpload
                  label="营业执照"
                  disabled={mode === 'view'}
                  value={safeGetFieldValue(form, ['businessLicenseImages', 'main'])}
                  onChange={value =>
                    safeSetFieldValue(form, ['businessLicenseImages', 'main'], value)
                  }
                  onSuccess={handleAutoSave}
                />
              </Form.Item>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">开户许可证照片</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Item name={['bankAccountLicenseImages', 'basic']} label="基本户开户许可证">
                <ImageUpload
                  label="基本户开户许可证"
                  disabled={mode === 'view'}
                  value={safeGetFieldValue(form, ['bankAccountLicenseImages', 'basic'])}
                  onChange={value =>
                    safeSetFieldValue(form, ['bankAccountLicenseImages', 'basic'], value)
                  }
                  onSuccess={handleAutoSave}
                />
              </Form.Item>
              <Form.Item name={['bankAccountLicenseImages', 'general']} label="一般户开户许可证">
                <ImageUpload
                  label="一般户开户许可证"
                  disabled={mode === 'view'}
                  value={safeGetFieldValue(form, ['bankAccountLicenseImages', 'general'])}
                  onChange={value =>
                    safeSetFieldValue(form, ['bankAccountLicenseImages', 'general'], value)
                  }
                  onSuccess={handleAutoSave}
                />
              </Form.Item>
            </div>
          </div>

          <div>
            <Form.Item name="otherIdImages" label="其他人员身份证照片">
              <MultiImageUpload
                title="其他人员身份证照片"
                disabled={mode === 'view'}
                value={form.getFieldValue('otherIdImages')}
                onChange={value => form.setFieldValue('otherIdImages', value)}
                onSuccess={handleAutoSave}
              />
            </Form.Item>
          </div>

          <div>
            <Form.Item name="supplementaryImages" label="补充资料照片">
              <MultiImageUpload
                title="补充资料照片"
                disabled={mode === 'view'}
                value={form.getFieldValue('supplementaryImages')}
                onChange={value => form.setFieldValue('supplementaryImages', value)}
                onSuccess={handleAutoSave}
              />
            </Form.Item>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="customer-form-container">
      <Form
        form={form}
        layout="vertical"
        initialValues={customer as FormCustomer}
        onFinish={handleSubmit}
        className="customer-form"
      >
        <div className="mb-4 flex justify-between items-center">
          <div className="font-medium text-lg">
            {mode === 'add' ? '添加客户' : mode === 'edit' ? '编辑客户' : '客户详情'}
          </div>
          {mode !== 'view' && (
            <div className="flex items-center">
              <span className="mr-2">图片自动保存:</span>
              <Switch checked={autoSaveEnabled} onChange={setAutoSaveEnabled} size="small" />
            </div>
          )}
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabs}
          className="customer-form-tabs"
        />
        <div className="customer-form-footer">
          <Space>
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" htmlType="submit" loading={isSaving}>
              {mode === 'add' ? '创建' : '保存'}
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  )
}

export default CustomerForm
