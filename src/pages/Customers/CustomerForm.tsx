import { useState } from 'react'
import { Form, Input, Button, Select, DatePicker, InputNumber, Tabs, Upload, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import type { Customer } from '../../types'
import { createCustomer, updateCustomer } from '../../api/customer'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

interface CustomerFormProps {
  customer?: Customer | null
  mode: 'view' | 'edit' | 'add'
  onSuccess: () => void
  onCancel?: () => void
}

// 为表单值创建类型，允许日期字段为Dayjs类型，图片字段为上传文件列表
type FormCustomer = Omit<
  Customer,
  | 'establishmentDate'
  | 'licenseExpiryDate'
  | 'capitalContributionDeadline'
  | 'legalPersonIdImages'
  | 'businessLicenseImages'
  | 'bankAccountLicenseImages'
  | 'otherIdImages'
  | 'supplementaryImages'
> & {
  establishmentDate?: Dayjs | null
  licenseExpiryDate?: Dayjs | null
  capitalContributionDeadline?: Dayjs | null
  legalPersonIdImages?: any[]
  businessLicenseImages?: any[]
  bankAccountLicenseImages?: any[]
  otherIdImages?: any[]
  supplementaryImages?: any[]
}

const CustomerForm = ({ customer, mode, onSuccess, onCancel }: CustomerFormProps) => {
  const [form] = Form.useForm<FormCustomer>()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('1')

  const isEdit = mode === 'edit' && !!customer

  // 图片上传配置
  const uploadProps: UploadProps = {
    name: 'file',
    action: `${import.meta.env.VITE_API_BASE_URL}/upload`,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    onChange(info) {
      if (info.file.status === 'done') {
        message.success(`${info.file.name} 上传成功`)
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} 上传失败: ${info.file.error?.message || '未知错误'}`)
        
        // 检查是否是身份验证问题
        if (info.file.error && info.file.error.status === 401) {
          message.error('身份验证失败，请重新登录');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
      }
    },
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error(`${file.name} 不是图片文件`);
        return false;
      }
      
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error(`图片大小不能超过5MB!`);
        return false;
      }
      
      return true;
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      console.log('表单验证通过，准备提交数据:', values);

      // 获取token并验证
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('您尚未登录或登录已过期，请重新登录');
        setTimeout(() => {
          window.location.href = '/login';
        }, 1500);
        return;
      }
      
      // 从文件列表中提取单个URL
      const fileList2Url = (fileList: any[] | undefined, index: number = 0): string | undefined => {
        if (!fileList || !fileList[index]) return undefined
        const file = fileList[index]
        return file.url || (file.response && file.response.url)
      }

      // 创建一个新对象用于API提交，并转换日期和文件字段
      const formattedValues: Partial<Customer> = {
        ...(values as any), // 基础字段直接复制
        // 覆盖日期字段，确保它们是字符串类型
        establishmentDate: values.establishmentDate?.format('YYYY-MM-DD') || null,
        licenseExpiryDate: values.licenseExpiryDate?.format('YYYY-MM-DD') || null,
        capitalContributionDeadline:
          values.capitalContributionDeadline?.format('YYYY-MM-DD') || null,
        // 转换图片字段
        legalPersonIdImages: {
          front: fileList2Url(values.legalPersonIdImages, 0),
          back: fileList2Url(values.legalPersonIdImages, 1)
        },
        businessLicenseImages: {
          main: fileList2Url(values.businessLicenseImages, 0)
        },
        bankAccountLicenseImages: {
          basic: fileList2Url(values.bankAccountLicenseImages, 0),
          general: fileList2Url(values.bankAccountLicenseImages, 1)
        },
        otherIdImages: values.otherIdImages ? 
          values.otherIdImages.reduce((acc, file, index) => {
            if (file.url || (file.response && file.response.url)) {
              acc[`person${index + 1}`] = file.url || file.response.url;
            }
            return acc;
          }, {} as Record<string, string>) : {},
        supplementaryImages: values.supplementaryImages ? 
          values.supplementaryImages.reduce((acc, file, index) => {
            if (file.url || (file.response && file.response.url)) {
              acc[`doc${index + 1}`] = file.url || file.response.url;
            }
            return acc;
          }, {} as Record<string, string>) : {},
      }

      setLoading(true)

      try {
        let response;
        
        if (isEdit && customer) {
          // 仅发送实际修改过的字段（PATCH 请求最佳实践）
          const originalValues = getInitialValues();
          const changedValues: Partial<Customer> = {};
          
          // 检查哪些字段发生了变化
          Object.keys(formattedValues).forEach(key => {
            const k = key as keyof Customer;
            const formattedValue = formattedValues[k];
            const originalValue = (originalValues as any)[k];
            
            // 日期字段需要特殊处理
            if (
              k === 'establishmentDate' || 
              k === 'licenseExpiryDate' || 
              k === 'capitalContributionDeadline'
            ) {
              const formattedDate = formattedValue ? String(formattedValue) : null;
              const originalDate = originalValue ? 
                originalValue.format('YYYY-MM-DD') : null;
                
              if (formattedDate !== originalDate) {
                // 使用类型断言确保类型匹配
                (changedValues as any)[k] = formattedValue;
              }
              return;
            }
            
            // 数字字段特殊处理
            if (
              k === 'registeredCapital' ||
              k === 'paidInCapital'
            ) {
              // 转换为数字类型
              if (formattedValue !== originalValue) {
                // 使用类型断言确保类型匹配
                (changedValues as any)[k] = typeof formattedValue === 'string' 
                  ? parseFloat(formattedValue) 
                  : formattedValue;
              }
              return;
            }
            
            // 图片字段需要特殊处理
            if (
              k === 'legalPersonIdImages' || 
              k === 'businessLicenseImages' || 
              k === 'bankAccountLicenseImages' || 
              k === 'otherIdImages' || 
              k === 'supplementaryImages'
            ) {
              // 图片字段始终发送，因为难以比较复杂对象
              if (formattedValue) {
                // 使用类型断言确保类型匹配
                (changedValues as any)[k] = formattedValue;
              }
              return;
            }
            
            // 普通字段比较
            if (formattedValue !== originalValue) {
              // 使用类型断言确保类型匹配
              (changedValues as any)[k] = formattedValue;
            }
          });
          
          // 如果没有变更，直接返回成功
          if (Object.keys(changedValues).length === 0) {
            message.info('未检测到修改内容');
            onSuccess();
            return;
          }
          
          console.log('检测到已修改的字段:', changedValues);
          
          // 只发送修改过的字段
          response = await updateCustomer(customer.id, changedValues);
          console.log('更新客户响应:', response);
          
          if (response && response.code === 0) {
            message.success('客户信息更新成功');
            onSuccess();
          } else {
            message.error(response?.message || '更新失败，请稍后重试');
          }
        } else {
          // 创建新客户
          response = await createCustomer(formattedValues);
          console.log('创建客户响应:', response);
          
          if (response && response.code === 0) {
            message.success('客户创建成功');
            onSuccess();
          } else {
            message.error(response?.message || '创建失败，请稍后重试');
          }
        }
      } catch (error: any) {
        console.error('API操作失败', error);
        
        // 处理API错误
        if (error.response?.data) {
          const errorData = error.response.data;
          
          if (Array.isArray(errorData.message)) {
            // 显示所有错误消息
            errorData.message.forEach((msg: string) => {
              message.error(msg);
            });
          } else {
            message.error(errorData.message || '操作失败，请稍后重试');
          }
        } else {
          message.error('网络错误，请检查网络连接后重试');
        }
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('表单验证失败', error);
      message.error('请检查表单填写是否正确');
    }
  }

  // 设置初始值
  const getInitialValues = (): Partial<FormCustomer> => {
    if (!customer) return {}

    // 尝试解析图片字段的 JSON 字符串
    const parseImageList = (imageData: any): any[] => {
      if (!imageData) return []
      
      // 处理对象格式
      if (typeof imageData === 'object' && !Array.isArray(imageData)) {
        return Object.entries(imageData).map(([key, url], index) => ({
          uid: `-${index}`,
          name: `${key}`,
          status: 'done',
          url: url as string,
        }))
      }
      
      // 处理字符串格式 (JSON字符串)
      if (typeof imageData === 'string') {
        try {
          const parsed = JSON.parse(imageData)
          if (Array.isArray(parsed)) {
            return parsed.map((url, index) => ({
              uid: `-${index}`,
              name: `图片${index + 1}`,
              status: 'done',
              url: url,
            }))
          }
        } catch {
          // 解析失败，返回空数组
        }
      }
      
      return []
    }

    // 将API数据转换为表单数据，特别处理日期字段和图片字段
    return {
      ...customer,
      // 转换日期字符串为dayjs对象
      establishmentDate: customer.establishmentDate
        ? dayjs(customer.establishmentDate)
        : null,
      licenseExpiryDate: customer.licenseExpiryDate
        ? dayjs(customer.licenseExpiryDate)
        : null,
      capitalContributionDeadline: customer.capitalContributionDeadline
        ? dayjs(customer.capitalContributionDeadline)
        : null,
      // 转换图片字段
      legalPersonIdImages: parseImageList(customer.legalPersonIdImages),
      businessLicenseImages: parseImageList(customer.businessLicenseImages),
      bankAccountLicenseImages: parseImageList(customer.bankAccountLicenseImages),
      otherIdImages: parseImageList(customer.otherIdImages),
      supplementaryImages: parseImageList(customer.supplementaryImages),
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={getInitialValues()}
      style={{ maxHeight: '70vh', overflow: 'auto' }}
      className="px-1 md:px-4"
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="overflow-x-auto"
        items={[
          {
            key: '1',
            label: '基本信息',
            children: (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                <Form.Item
                  name="companyName"
                  label="企业名称"
                  rules={[{ required: true, message: '请输入企业名称' }]}
                >
                  <Input placeholder="请输入企业名称" />
                </Form.Item>

                <Form.Item
                  name="socialCreditCode"
                  label="统一社会信用代码"
                  rules={[{ required: true, message: '请输入统一社会信用代码' }]}
                >
                  <Input placeholder="请输入统一社会信用代码" />
                </Form.Item>

                <Form.Item
                  name="dailyContact"
                  label="日常联系人"
                  rules={[{ required: true, message: '请输入日常联系人' }]}
                >
                  <Input placeholder="请输入日常联系人" />
                </Form.Item>

                <Form.Item
                  name="dailyContactPhone"
                  label="联系电话"
                  rules={[{ required: true, message: '请输入联系电话' }]}
                >
                  <Input placeholder="请输入联系电话" />
                </Form.Item>

                <Form.Item
                  name="salesRepresentative"
                  label="业务员"
                  rules={[{ required: true, message: '请输入业务员' }]}
                >
                  <Input placeholder="请输入业务员" />
                </Form.Item>

                <Form.Item name="businessSource" label="业务来源">
                  <Input placeholder="请输入业务来源" />
                </Form.Item>

                <Form.Item name="taxRegistrationType" label="税务登记类型">
                  <Select placeholder="请选择税务登记类型">
                    <Select.Option value="general">一般纳税人</Select.Option>
                    <Select.Option value="small">小规模纳税人</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="taxBureau" label="所属税局">
                  <Input placeholder="请输入所属税局" />
                </Form.Item>

                <Form.Item name="chiefAccountant" label="主管会计">
                  <Input placeholder="请输入主管会计" />
                </Form.Item>

                <Form.Item name="responsibleAccountant" label="责任会计">
                  <Input placeholder="请输入责任会计" />
                </Form.Item>

                <Form.Item name="enterpriseStatus" label="企业状态">
                  <Select placeholder="请选择企业状态">
                    <Select.Option value="active">正常经营</Select.Option>
                    <Select.Option value="inactive">停业</Select.Option>
                    <Select.Option value="closed">注销</Select.Option>
                    <Select.Option value="preparing">筹建</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="businessStatus"
                  label="业务状态"
                  rules={[{ required: true, message: '请选择业务状态' }]}
                >
                  <Select placeholder="请选择业务状态">
                    <Select.Option value="normal">正常</Select.Option>
                    <Select.Option value="pending">待处理</Select.Option>
                    <Select.Option value="suspended">暂停</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="enterpriseType" label="企业类型">
                  <Select placeholder="请选择企业类型">
                    <Select.Option value="有限责任公司">有限责任公司</Select.Option>
                    <Select.Option value="股份有限公司">股份有限公司</Select.Option>
                    <Select.Option value="个人独资企业">个人独资企业</Select.Option>
                    <Select.Option value="合伙企业">合伙企业</Select.Option>
                    <Select.Option value="个体工商户">个体工商户</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="bossName" label="老板姓名">
                  <Input placeholder="请输入老板姓名" />
                </Form.Item>

                <Form.Item name="establishmentDate" label="成立日期">
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>

                <Form.Item name="registeredCapital" label="注册资本">
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入注册资本"
                    addonAfter="元"
                  />
                </Form.Item>
              </div>
            ),
          },
          {
            key: '2',
            label: '业务详情',
            children: (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                <Form.Item name="mainBusiness" label="主营业务" className="col-span-2">
                  <Input.TextArea rows={2} placeholder="请输入主营业务" />
                </Form.Item>

                <Form.Item name="businessScope" label="经营范围" className="col-span-2">
                  <Input.TextArea rows={3} placeholder="请输入经营范围" />
                </Form.Item>

                <Form.Item name="businessAddress" label="经营地址" className="col-span-2">
                  <Input.TextArea rows={2} placeholder="请输入经营地址" />
                </Form.Item>

                <Form.Item name="bossProfile" label="老板简介" className="col-span-2">
                  <Input.TextArea rows={3} placeholder="请输入老板简介" />
                </Form.Item>

                <Form.Item name="communicationNotes" label="沟通注意事项" className="col-span-2">
                  <Input.TextArea rows={2} placeholder="请输入沟通注意事项" />
                </Form.Item>

                <Form.Item name="affiliatedEnterprises" label="关联企业" className="col-span-2">
                  <Input.TextArea rows={2} placeholder="请输入关联企业" />
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
                  <Input placeholder="请输入基本户银行" />
                </Form.Item>

                <Form.Item name="basicBankAccount" label="基本户账号">
                  <Input placeholder="请输入基本户账号" />
                </Form.Item>

                <Form.Item name="basicBankNumber" label="基本户行号">
                  <Input placeholder="请输入基本户行号" />
                </Form.Item>

                <Form.Item name="generalBank" label="一般户银行">
                  <Input placeholder="请输入一般户银行" />
                </Form.Item>

                <Form.Item name="generalBankAccount" label="一般户账号">
                  <Input placeholder="请输入一般户账号" />
                </Form.Item>

                <Form.Item name="generalBankNumber" label="一般户行号">
                  <Input placeholder="请输入一般户行号" />
                </Form.Item>

                <Form.Item name="hasOnlineBanking" label="是否有网银">
                  <Select placeholder="请选择是否有网银">
                    <Select.Option value="是">是</Select.Option>
                    <Select.Option value="否">否</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="isOnlineBankingCustodian" label="网银是否托管">
                  <Select placeholder="请选择网银是否托管">
                    <Select.Option value="是">是</Select.Option>
                    <Select.Option value="否">否</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="tripartiteAgreementAccount" label="三方协议账户">
                  <Input placeholder="请输入三方协议账户" />
                </Form.Item>
              </div>
            ),
          },
          {
            key: '4',
            label: '税务信息',
            children: (
              <>
                <h3 className="mb-3 font-medium">税种信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                  <Form.Item name="taxCategories" label="税种" className="col-span-2">
                    <Input.TextArea rows={2} placeholder="请输入需要缴纳的税种" />
                  </Form.Item>

                  <Form.Item name="personalIncomeTaxPassword" label="个税申报密码">
                    <Input placeholder="请输入个税申报密码" />
                  </Form.Item>

                  <Form.Item name="personalIncomeTaxStaff" label="个税申报人员">
                    <Input placeholder="请输入个税申报人员" />
                  </Form.Item>
                </div>

                <h3 className="mt-4 md:mt-6 mb-3 font-medium">法定代表人</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                  <Form.Item name="legalRepresentativeName" label="姓名">
                    <Input placeholder="请输入法定代表人姓名" />
                  </Form.Item>

                  <Form.Item name="legalRepresentativePhone" label="联系电话">
                    <Input placeholder="请输入法定代表人联系电话" />
                  </Form.Item>

                  <Form.Item name="legalRepresentativeId" label="身份证号">
                    <Input placeholder="请输入法定代表人身份证号" />
                  </Form.Item>

                  <Form.Item name="legalRepresentativeTaxPassword" label="电子税务局密码">
                    <Input placeholder="请输入法定代表人电子税务局密码" />
                  </Form.Item>
                </div>

                <h3 className="mt-4 md:mt-6 mb-3 font-medium">财务负责人</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                  <Form.Item name="financialContactName" label="姓名">
                    <Input placeholder="请输入财务负责人姓名" />
                  </Form.Item>

                  <Form.Item name="financialContactPhone" label="联系电话">
                    <Input placeholder="请输入财务负责人联系电话" />
                  </Form.Item>

                  <Form.Item name="financialContactId" label="身份证号">
                    <Input placeholder="请输入财务负责人身份证号" />
                  </Form.Item>

                  <Form.Item name="financialContactTaxPassword" label="电子税务局密码">
                    <Input placeholder="请输入财务负责人电子税务局密码" />
                  </Form.Item>
                </div>

                <h3 className="mt-4 md:mt-6 mb-3 font-medium">办税员</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                  <Form.Item name="taxOfficerName" label="姓名">
                    <Input placeholder="请输入办税员姓名" />
                  </Form.Item>

                  <Form.Item name="taxOfficerPhone" label="联系电话">
                    <Input placeholder="请输入办税员联系电话" />
                  </Form.Item>

                  <Form.Item name="taxOfficerId" label="身份证号">
                    <Input placeholder="请输入办税员身份证号" />
                  </Form.Item>

                  <Form.Item name="taxOfficerTaxPassword" label="电子税务局密码">
                    <Input placeholder="请输入办税员电子税务局密码" />
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
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>

                <Form.Item name="capitalContributionDeadline" label="注册资本认缴截止日期">
                  <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                </Form.Item>

                <Form.Item name="paidInCapital" label="实缴资本">
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入实缴资本"
                    addonAfter="元"
                  />
                </Form.Item>

                <Form.Item name="annualInspectionPassword" label="年检密码">
                  <Input placeholder="请输入年检密码" />
                </Form.Item>

                <Form.Item name="shareholders" label="股东信息" className="col-span-2">
                  <Input.TextArea rows={2} placeholder="请输入股东信息" />
                </Form.Item>

                <Form.Item name="supervisors" label="监事信息" className="col-span-2">
                  <Input.TextArea rows={2} placeholder="请输入监事信息" />
                </Form.Item>

                <Form.Item name="administrativeLicenses" label="行政许可" className="col-span-2">
                  <Input.TextArea rows={2} placeholder="请输入行政许可" />
                </Form.Item>

                <Form.Item
                  name="capitalContributionRecords"
                  label="资本实缴记录"
                  className="col-span-2"
                >
                  <Input.TextArea rows={2} placeholder="请输入资本实缴记录" />
                </Form.Item>

                <Form.Item
                  name="legalPersonIdImages"
                  label="法人身份证照片"
                  className="col-span-2"
                  valuePropName="fileList"
                  getValueFromEvent={e => {
                    if (Array.isArray(e)) {
                      return e
                    }
                    return e?.fileList
                  }}
                >
                  <Upload {...uploadProps} listType="picture" maxCount={2}>
                    <Button icon={<UploadOutlined />}>上传法人身份证照片（正反面）</Button>
                  </Upload>
                </Form.Item>

                <Form.Item
                  name="businessLicenseImages"
                  label="营业执照照片"
                  className="col-span-2"
                  valuePropName="fileList"
                  getValueFromEvent={e => {
                    if (Array.isArray(e)) {
                      return e
                    }
                    return e?.fileList
                  }}
                >
                  <Upload {...uploadProps} listType="picture" maxCount={1}>
                    <Button icon={<UploadOutlined />}>上传营业执照照片</Button>
                  </Upload>
                </Form.Item>

                <Form.Item
                  name="bankAccountLicenseImages"
                  label="开户许可证照片"
                  className="col-span-2"
                  valuePropName="fileList"
                  getValueFromEvent={e => {
                    if (Array.isArray(e)) {
                      return e
                    }
                    return e?.fileList
                  }}
                >
                  <Upload {...uploadProps} listType="picture" maxCount={1}>
                    <Button icon={<UploadOutlined />}>上传开户许可证照片</Button>
                  </Upload>
                </Form.Item>

                <Form.Item
                  name="otherIdImages"
                  label="其他人员身份证照片"
                  className="col-span-2"
                  valuePropName="fileList"
                  getValueFromEvent={e => {
                    if (Array.isArray(e)) {
                      return e
                    }
                    return e?.fileList
                  }}
                >
                  <Upload {...uploadProps} listType="picture">
                    <Button icon={<UploadOutlined />}>上传其他人员身份证照片</Button>
                  </Upload>
                </Form.Item>

                <Form.Item
                  name="supplementaryImages"
                  label="补充资料照片"
                  className="col-span-2"
                  valuePropName="fileList"
                  getValueFromEvent={e => {
                    if (Array.isArray(e)) {
                      return e
                    }
                    return e?.fileList
                  }}
                >
                  <Upload {...uploadProps} listType="picture">
                    <Button icon={<UploadOutlined />}>上传补充资料照片</Button>
                  </Upload>
                </Form.Item>
              </div>
            ),
          },
        ]}
      />

      {/* 操作按钮区域 */}
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
        {onCancel && (
          <Button onClick={onCancel} disabled={loading}>
            取消
          </Button>
        )}
        <Button 
          type="primary" 
          onClick={handleSubmit} 
          loading={loading}
          disabled={mode === 'view'}
        >
          {isEdit ? '保存修改' : '创建客户'}
        </Button>
      </div>
    </Form>
  )
}

export default CustomerForm
