import { useState } from 'react'
import { Form, Input, Button, Select, DatePicker, InputNumber, Tabs, Upload, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import type { Customer } from '../../types'
import { createCustomer, updateCustomer } from '../../api/customer'
import dayjs from 'dayjs'

const { TabPane } = Tabs

interface CustomerFormProps {
  initialValues?: Customer | null
  onSuccess: () => void
  onCancel: () => void
}

const CustomerForm = ({ initialValues, onSuccess, onCancel }: CustomerFormProps) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('1')

  const isEdit = !!initialValues

  // 图片上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    action: `${import.meta.env.VITE_API_BASE_URL}/upload`,
    headers: {
      authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`)
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败`)
      }
    },
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()

      // 格式化日期字段
      const formattedValues = { ...values }
      if (formattedValues.establishment_date) {
        formattedValues.establishment_date = dayjs(formattedValues.establishment_date).format(
          'YYYY-MM-DD'
        )
      }
      if (formattedValues.license_expiry_date) {
        formattedValues.license_expiry_date = dayjs(formattedValues.license_expiry_date).format(
          'YYYY-MM-DD'
        )
      }
      if (formattedValues.capital_contribution_deadline) {
        formattedValues.capital_contribution_deadline = dayjs(
          formattedValues.capital_contribution_deadline
        ).format('YYYY-MM-DD')
      }

      setLoading(true)

      try {
        if (isEdit && initialValues) {
          // 实际项目中这里应该使用 API 请求
          // await updateCustomer(initialValues.id, formattedValues)
          message.success('更新成功')
        } else {
          // 实际项目中这里应该使用 API 请求
          // await createCustomer(formattedValues)
          message.success('创建成功')
        }
        onSuccess()
      } catch (error) {
        console.error('操作失败', error)
        message.error('操作失败')
      } finally {
        setLoading(false)
      }
    } catch (error) {
      console.error('表单验证失败', error)
    }
  }

  // 设置初始值
  const getInitialValues = () => {
    if (!initialValues) return {}

    const values = { ...initialValues }

    // 转换日期字段为 dayjs 对象
    if (values.establishment_date) {
      values.establishment_date = dayjs(values.establishment_date)
    }
    if (values.license_expiry_date) {
      values.license_expiry_date = dayjs(values.license_expiry_date)
    }
    if (values.capital_contribution_deadline) {
      values.capital_contribution_deadline = dayjs(values.capital_contribution_deadline)
    }

    return values
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={getInitialValues()}
      style={{ maxHeight: '70vh', overflow: 'auto' }}
      className="px-1 md:px-4"
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="overflow-x-auto">
        <TabPane tab="基本信息" key="1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item
              name="company_name"
              label="企业名称"
              rules={[{ required: true, message: '请输入企业名称' }]}
            >
              <Input placeholder="请输入企业名称" />
            </Form.Item>

            <Form.Item
              name="social_credit_code"
              label="统一社会信用代码"
              rules={[{ required: true, message: '请输入统一社会信用代码' }]}
            >
              <Input placeholder="请输入统一社会信用代码" />
            </Form.Item>

            <Form.Item
              name="daily_contact"
              label="日常联系人"
              rules={[{ required: true, message: '请输入日常联系人' }]}
            >
              <Input placeholder="请输入日常联系人" />
            </Form.Item>

            <Form.Item
              name="daily_contact_phone"
              label="联系电话"
              rules={[{ required: true, message: '请输入联系电话' }]}
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>

            <Form.Item
              name="sales_representative"
              label="业务员"
              rules={[{ required: true, message: '请输入业务员' }]}
            >
              <Input placeholder="请输入业务员" />
            </Form.Item>

            <Form.Item name="business_source" label="业务来源">
              <Input placeholder="请输入业务来源" />
            </Form.Item>

            <Form.Item name="tax_registration_type" label="税务登记类型">
              <Select placeholder="请选择税务登记类型">
                <Select.Option value="一般纳税人">一般纳税人</Select.Option>
                <Select.Option value="小规模纳税人">小规模纳税人</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="tax_bureau" label="所属税局">
              <Input placeholder="请输入所属税局" />
            </Form.Item>

            <Form.Item name="chief_accountant" label="主管会计">
              <Input placeholder="请输入主管会计" />
            </Form.Item>

            <Form.Item name="responsible_accountant" label="责任会计">
              <Input placeholder="请输入责任会计" />
            </Form.Item>

            <Form.Item name="enterprise_status" label="企业状态">
              <Select placeholder="请选择企业状态">
                <Select.Option value="正常经营">正常经营</Select.Option>
                <Select.Option value="停业">停业</Select.Option>
                <Select.Option value="注销">注销</Select.Option>
                <Select.Option value="筹建">筹建</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="business_status"
              label="业务状态"
              rules={[{ required: true, message: '请选择业务状态' }]}
            >
              <Select placeholder="请选择业务状态">
                <Select.Option value="待处理">待处理</Select.Option>
                <Select.Option value="已签约">已签约</Select.Option>
                <Select.Option value="已终止">已终止</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="enterprise_type" label="企业类型">
              <Select placeholder="请选择企业类型">
                <Select.Option value="有限责任公司">有限责任公司</Select.Option>
                <Select.Option value="股份有限公司">股份有限公司</Select.Option>
                <Select.Option value="个人独资企业">个人独资企业</Select.Option>
                <Select.Option value="合伙企业">合伙企业</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="boss_name" label="老板姓名">
              <Input placeholder="请输入老板姓名" />
            </Form.Item>

            <Form.Item name="establishment_date" label="成立日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="registered_capital" label="注册资本">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入注册资本"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                addonAfter="元"
              />
            </Form.Item>
          </div>
        </TabPane>

        <TabPane tab="业务详情" key="2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item name="main_business" label="主营业务" className="col-span-2">
              <Input.TextArea rows={2} placeholder="请输入主营业务" />
            </Form.Item>

            <Form.Item name="business_scope" label="经营范围" className="col-span-2">
              <Input.TextArea rows={3} placeholder="请输入经营范围" />
            </Form.Item>

            <Form.Item name="business_address" label="经营地址" className="col-span-2">
              <Input placeholder="请输入经营地址" />
            </Form.Item>

            <Form.Item name="boss_profile" label="老板简介" className="col-span-2">
              <Input.TextArea rows={3} placeholder="请输入老板简介" />
            </Form.Item>

            <Form.Item name="communication_notes" label="沟通注意事项" className="col-span-2">
              <Input.TextArea rows={3} placeholder="请输入沟通注意事项" />
            </Form.Item>

            <Form.Item name="affiliated_enterprises" label="关联企业" className="col-span-2">
              <Input.TextArea rows={3} placeholder="请输入关联企业信息" />
            </Form.Item>
          </div>
        </TabPane>

        <TabPane tab="银行账户" key="3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item name="basic_bank" label="基本户银行">
              <Input placeholder="请输入基本户银行" />
            </Form.Item>

            <Form.Item name="basic_bank_account" label="基本户账号">
              <Input placeholder="请输入基本户账号" />
            </Form.Item>

            <Form.Item name="basic_bank_number" label="基本户行号">
              <Input placeholder="请输入基本户行号" />
            </Form.Item>

            <Form.Item name="general_bank" label="一般户银行">
              <Input placeholder="请输入一般户银行" />
            </Form.Item>

            <Form.Item name="general_bank_account" label="一般户账号">
              <Input placeholder="请输入一般户账号" />
            </Form.Item>

            <Form.Item name="general_bank_number" label="一般户行号">
              <Input placeholder="请输入一般户行号" />
            </Form.Item>

            <Form.Item name="has_online_banking" label="是否有网银">
              <Select placeholder="请选择">
                <Select.Option value="是">是</Select.Option>
                <Select.Option value="否">否</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="is_online_banking_custodian" label="网银是否托管">
              <Select placeholder="请选择">
                <Select.Option value="是">是</Select.Option>
                <Select.Option value="否">否</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="tripartite_agreement_account" label="三方协议账户">
              <Input placeholder="请输入三方协议账户" />
            </Form.Item>
          </div>
        </TabPane>

        <TabPane tab="税务信息" key="4">
          <h3 className="mb-3 font-medium">税种信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item name="tax_categories" label="税种" className="col-span-2">
              <Input.TextArea rows={2} placeholder="请输入需要缴纳的税种" />
            </Form.Item>

            <Form.Item name="personal_income_tax_password" label="个税申报密码">
              <Input placeholder="请输入个税申报密码" />
            </Form.Item>

            <Form.Item name="personal_income_tax_staff" label="个税申报人员" className="col-span-2">
              <Input.TextArea rows={2} placeholder="请输入需要申报个人所得税的员工信息" />
            </Form.Item>
          </div>

          <h3 className="mt-4 md:mt-6 mb-3 font-medium">法定代表人</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item name="legal_representative_name" label="姓名">
              <Input placeholder="请输入法定代表人姓名" />
            </Form.Item>

            <Form.Item name="legal_representative_phone" label="联系电话">
              <Input placeholder="请输入法定代表人联系电话" />
            </Form.Item>

            <Form.Item name="legal_representative_id" label="身份证号">
              <Input placeholder="请输入法定代表人身份证号" />
            </Form.Item>

            <Form.Item name="legal_representative_tax_password" label="电子税务局密码">
              <Input placeholder="请输入法定代表人电子税务局密码" />
            </Form.Item>
          </div>

          <h3 className="mt-4 md:mt-6 mb-3 font-medium">财务负责人</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item name="financial_contact_name" label="姓名">
              <Input placeholder="请输入财务负责人姓名" />
            </Form.Item>

            <Form.Item name="financial_contact_phone" label="联系电话">
              <Input placeholder="请输入财务负责人联系电话" />
            </Form.Item>

            <Form.Item name="financial_contact_id" label="身份证号">
              <Input placeholder="请输入财务负责人身份证号" />
            </Form.Item>

            <Form.Item name="financial_contact_tax_password" label="电子税务局密码">
              <Input placeholder="请输入财务负责人电子税务局密码" />
            </Form.Item>
          </div>

          <h3 className="mt-4 md:mt-6 mb-3 font-medium">办税员</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item name="tax_officer_name" label="姓名">
              <Input placeholder="请输入办税员姓名" />
            </Form.Item>

            <Form.Item name="tax_officer_phone" label="联系电话">
              <Input placeholder="请输入办税员联系电话" />
            </Form.Item>

            <Form.Item name="tax_officer_id" label="身份证号">
              <Input placeholder="请输入办税员身份证号" />
            </Form.Item>

            <Form.Item name="tax_officer_tax_password" label="电子税务局密码">
              <Input placeholder="请输入办税员电子税务局密码" />
            </Form.Item>
          </div>
        </TabPane>

        <TabPane tab="证照信息" key="5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
            <Form.Item name="license_expiry_date" label="营业执照到期日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="capital_contribution_deadline" label="注册资本认缴截止日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="paid_in_capital" label="实缴资本">
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入实缴资本"
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value!.replace(/\$\s?|(,*)/g, '')}
                addonAfter="元"
              />
            </Form.Item>

            <Form.Item name="annual_inspection_password" label="年检密码">
              <Input placeholder="请输入年检密码" />
            </Form.Item>

            <Form.Item name="shareholders" label="股东信息" className="col-span-2">
              <Input.TextArea rows={3} placeholder="请输入股东信息" />
            </Form.Item>

            <Form.Item name="supervisors" label="监事信息" className="col-span-2">
              <Input.TextArea rows={2} placeholder="请输入监事信息" />
            </Form.Item>

            <Form.Item name="administrative_licenses" label="行政许可" className="col-span-2">
              <Input.TextArea rows={2} placeholder="请输入行政许可信息" />
            </Form.Item>

            <Form.Item
              name="capital_contribution_records"
              label="资本实缴记录"
              className="col-span-2"
            >
              <Input.TextArea rows={2} placeholder="请输入资本实缴记录" />
            </Form.Item>

            <Form.Item
              name="legal_person_id_images"
              label="法定代表人身份证件"
              className="col-span-2"
            >
              <Upload {...uploadProps} listType="picture">
                <Button icon={<UploadOutlined />}>上传文件</Button>
              </Upload>
            </Form.Item>

            <Form.Item name="business_license_images" label="营业执照" className="col-span-2">
              <Upload {...uploadProps} listType="picture">
                <Button icon={<UploadOutlined />}>上传文件</Button>
              </Upload>
            </Form.Item>

            <Form.Item name="bank_account_license_images" label="开户许可证" className="col-span-2">
              <Upload {...uploadProps} listType="picture">
                <Button icon={<UploadOutlined />}>上传文件</Button>
              </Upload>
            </Form.Item>

            <Form.Item name="other_id_images" label="其他人员身份证件" className="col-span-2">
              <Upload {...uploadProps} listType="picture">
                <Button icon={<UploadOutlined />}>上传文件</Button>
              </Upload>
            </Form.Item>

            <Form.Item name="supplementary_images" label="补充资料" className="col-span-2">
              <Upload {...uploadProps} listType="picture">
                <Button icon={<UploadOutlined />}>上传文件</Button>
              </Upload>
            </Form.Item>
          </div>
        </TabPane>
      </Tabs>

      <div className="flex justify-end mt-4 pt-4 border-t">
        <Button onClick={onCancel} style={{ marginRight: 8 }}>
          取消
        </Button>
        <Button type="primary" loading={loading} onClick={handleSubmit}>
          {isEdit ? '保存' : '创建'}
        </Button>
      </div>
    </Form>
  )
}

export default CustomerForm
