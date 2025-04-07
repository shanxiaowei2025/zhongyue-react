import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Space,
  message,
  Tag,
  Modal,
  Drawer,
  Tabs,
  Form,
  Descriptions,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Customer } from '../../types'
import { getCustomerList, deleteCustomer } from '../../api/customer'
import CustomerForm from './CustomerForm'

const { TabPane } = Tabs
const { confirm } = Modal

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [current, setCurrent] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchText, setSearchText] = useState('')
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null)
  const [detailType, setDetailType] = useState<'view' | 'edit' | 'add'>('view')

  // 模拟客户数据
  const mockCustomerData: Customer[] = [
    {
      id: 1,
      company_name: '杭州某科技有限公司',
      daily_contact: '张三',
      daily_contact_phone: '13900001111',
      sales_representative: '李四',
      social_credit_code: '91330000XXXXXXXXXX',
      tax_bureau: '杭州市税务局第一分局',
      business_source: '朋友介绍',
      tax_registration_type: '一般纳税人',
      chief_accountant: '王五',
      responsible_accountant: '赵六',
      enterprise_status: '正常经营',
      business_status: '待处理',
      boss_name: '张董',
      enterprise_type: '有限责任公司',
      legal_representative_name: '张董',
      financial_contact_name: '王五',
      establishment_date: '2015-01-01',
      update_time: '2023-01-01T08:00:00.000Z',
      create_time: '2022-01-01T08:00:00.000Z',
      submitter: 'admin',
      affiliated_enterprises: null,
      main_business: '软件开发',
      boss_profile: null,
      communication_notes: null,
      business_scope: '计算机软件开发、销售',
      business_address: '杭州市西湖区',
      registered_capital: 1000000,
      license_expiry_date: null,
      capital_contribution_deadline: null,
      shareholders: null,
      supervisors: null,
      annual_inspection_password: null,
      paid_in_capital: null,
      administrative_licenses: null,
      capital_contribution_records: null,
      basic_bank: '中国银行',
      basic_bank_account: '123456789',
      basic_bank_number: null,
      general_bank: null,
      general_bank_account: null,
      general_bank_number: null,
      has_online_banking: '是',
      is_online_banking_custodian: '否',
      legal_representative_phone: '13800001111',
      legal_representative_id: null,
      legal_representative_tax_password: null,
      financial_contact_phone: '13800002222',
      financial_contact_id: null,
      financial_contact_tax_password: null,
      tax_officer_name: null,
      tax_officer_phone: null,
      tax_officer_id: null,
      tax_officer_tax_password: null,
      tripartite_agreement_account: null,
      tax_categories: '增值税、企业所得税',
      personal_income_tax_staff: null,
      personal_income_tax_password: null,
      legal_person_id_images: '[]',
      other_id_images: '[]',
      business_license_images: '[]',
      bank_account_license_images: '[]',
      supplementary_images: '[]',
    },
    {
      id: 2,
      company_name: '上海某贸易有限公司',
      daily_contact: '李明',
      daily_contact_phone: '13900002222',
      sales_representative: '王芳',
      social_credit_code: '91310000XXXXXXXXXX',
      tax_bureau: '上海市税务局第二分局',
      business_source: '网络推广',
      tax_registration_type: '小规模纳税人',
      chief_accountant: '刘强',
      responsible_accountant: '陈静',
      enterprise_status: '正常经营',
      business_status: '已签约',
      boss_name: '李总',
      enterprise_type: '有限责任公司',
      legal_representative_name: '李总',
      financial_contact_name: '刘强',
      establishment_date: '2018-05-12',
      update_time: '2023-02-15T08:00:00.000Z',
      create_time: '2022-06-11T08:00:00.000Z',
      submitter: 'editor',
      affiliated_enterprises: null,
      main_business: '国际贸易',
      boss_profile: null,
      communication_notes: null,
      business_scope: '货物与技术的进出口业务',
      business_address: '上海市浦东新区',
      registered_capital: 5000000,
      license_expiry_date: null,
      capital_contribution_deadline: null,
      shareholders: null,
      supervisors: null,
      annual_inspection_password: null,
      paid_in_capital: null,
      administrative_licenses: null,
      capital_contribution_records: null,
      basic_bank: '工商银行',
      basic_bank_account: '987654321',
      basic_bank_number: null,
      general_bank: null,
      general_bank_account: null,
      general_bank_number: null,
      has_online_banking: '是',
      is_online_banking_custodian: '是',
      legal_representative_phone: '13800003333',
      legal_representative_id: null,
      legal_representative_tax_password: null,
      financial_contact_phone: '13800004444',
      financial_contact_id: null,
      financial_contact_tax_password: null,
      tax_officer_name: null,
      tax_officer_phone: null,
      tax_officer_id: null,
      tax_officer_tax_password: null,
      tripartite_agreement_account: null,
      tax_categories: '增值税、企业所得税',
      personal_income_tax_staff: null,
      personal_income_tax_password: null,
      legal_person_id_images: '[]',
      other_id_images: '[]',
      business_license_images: '[]',
      bank_account_license_images: '[]',
      supplementary_images: '[]',
    },
  ]

  useEffect(() => {
    fetchCustomers()
  }, [current, pageSize, searchText])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      // 实际项目中这里应该使用 API 请求
      // const res = await getCustomerList({
      //   page: current,
      //   pageSize,
      //   keyword: searchText,
      // })
      // setCustomers(res.data.data)
      // setTotal(res.data.total)

      // 使用模拟数据
      const filteredData = mockCustomerData.filter(
        customer =>
          customer.company_name?.includes(searchText) ||
          customer.daily_contact?.includes(searchText) ||
          customer.sales_representative?.includes(searchText)
      )
      setCustomers(filteredData)
      setTotal(filteredData.length)
    } catch (error) {
      console.error('获取客户列表失败', error)
      message.error('获取客户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    setCurrent(1)
  }

  const handleAdd = () => {
    setDetailType('add')
    setCurrentCustomer(null)
    setModalVisible(true)
  }

  const handleView = (record: Customer) => {
    setDetailType('view')
    setCurrentCustomer(record)
    setDrawerVisible(true)
  }

  const handleEdit = (record: Customer) => {
    setDetailType('edit')
    setCurrentCustomer(record)
    setModalVisible(true)
  }

  const handleDelete = (id: number) => {
    confirm({
      title: '确定要删除该客户吗?',
      content: '删除后无法恢复，请谨慎操作',
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 实际项目中这里应该使用 API 请求
          // await deleteCustomer(id)
          message.success('删除成功')
          fetchCustomers()
        } catch (error) {
          console.error('删除失败', error)
          message.error('删除失败')
        }
      },
    })
  }

  const columns: ColumnsType<Customer> = [
    {
      title: '公司名称',
      dataIndex: 'company_name',
      key: 'company_name',
      width: 200,
    },
    {
      title: '业务联系人',
      dataIndex: 'daily_contact',
      key: 'daily_contact',
      width: 120,
    },
    {
      title: '联系电话',
      dataIndex: 'daily_contact_phone',
      key: 'daily_contact_phone',
      width: 150,
    },
    {
      title: '业务员',
      dataIndex: 'sales_representative',
      key: 'sales_representative',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'business_status',
      key: 'business_status',
      width: 100,
      render: status => {
        let color = 'default'
        if (status === '已签约') color = 'success'
        else if (status === '待处理') color = 'warning'
        else if (status === '已终止') color = 'error'
        return <Tag color={color}>{status}</Tag>
      },
    },
    {
      title: '企业类型',
      dataIndex: 'enterprise_type',
      key: 'enterprise_type',
      width: 120,
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      width: 180,
      render: date => (date ? new Date(date).toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)}>
            查看
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Input.Search
          placeholder="搜索客户名称/联系人/业务员"
          allowClear
          onSearch={handleSearch}
          className="w-64"
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加客户
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={customers}
        rowKey="id"
        loading={loading}
        pagination={{
          current,
          pageSize,
          total,
          onChange: page => setCurrent(page),
          onShowSizeChange: (_, size) => setPageSize(size),
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条`,
        }}
        scroll={{ x: 1300 }}
      />

      {/* 客户详情抽屉 */}
      <Drawer
        title="客户详情"
        width={800}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        extra={
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setDrawerVisible(false)
              setDetailType('edit')
              setModalVisible(true)
            }}
          >
            编辑
          </Button>
        }
      >
        {currentCustomer && <CustomerDetail customer={currentCustomer} />}
      </Drawer>

      {/* 添加/编辑客户对话框 */}
      <Modal
        title={detailType === 'add' ? '添加客户' : '编辑客户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={1000}
        footer={null}
      >
        <CustomerForm
          initialValues={currentCustomer}
          onSuccess={() => {
            setModalVisible(false)
            fetchCustomers()
          }}
          onCancel={() => setModalVisible(false)}
        />
      </Modal>
    </div>
  )
}

// 客户详情组件
const CustomerDetail = ({ customer }: { customer: Customer }) => {
  return (
    <Tabs defaultActiveKey="1">
      <TabPane tab="基本信息" key="1">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="公司名称">{customer.company_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="统一社会信用代码">
            {customer.social_credit_code || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="日常联系人">{customer.daily_contact || '-'}</Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {customer.daily_contact_phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="业务员">
            {customer.sales_representative || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="业务来源">{customer.business_source || '-'}</Descriptions.Item>
          <Descriptions.Item label="税务登记类型">
            {customer.tax_registration_type || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="所属税局">{customer.tax_bureau || '-'}</Descriptions.Item>
          <Descriptions.Item label="主管会计">{customer.chief_accountant || '-'}</Descriptions.Item>
          <Descriptions.Item label="责任会计">
            {customer.responsible_accountant || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="企业状态">
            {customer.enterprise_status || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="业务状态">{customer.business_status || '-'}</Descriptions.Item>
          <Descriptions.Item label="企业类型">{customer.enterprise_type || '-'}</Descriptions.Item>
          <Descriptions.Item label="老板姓名">{customer.boss_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="成立日期">
            {customer.establishment_date || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="注册资本">
            {customer.registered_capital ? `${customer.registered_capital}元` : '-'}
          </Descriptions.Item>
        </Descriptions>
      </TabPane>

      <TabPane tab="业务详情" key="2">
        <Descriptions bordered column={1}>
          <Descriptions.Item label="主营业务">{customer.main_business || '-'}</Descriptions.Item>
          <Descriptions.Item label="经营范围">{customer.business_scope || '-'}</Descriptions.Item>
          <Descriptions.Item label="经营地址">{customer.business_address || '-'}</Descriptions.Item>
          <Descriptions.Item label="老板简介">{customer.boss_profile || '-'}</Descriptions.Item>
          <Descriptions.Item label="沟通注意事项">
            {customer.communication_notes || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="关联企业">
            {customer.affiliated_enterprises || '-'}
          </Descriptions.Item>
        </Descriptions>
      </TabPane>

      <TabPane tab="银行账户" key="3">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="基本户银行">{customer.basic_bank || '-'}</Descriptions.Item>
          <Descriptions.Item label="基本户账号">
            {customer.basic_bank_account || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="基本户行号">
            {customer.basic_bank_number || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="一般户银行">{customer.general_bank || '-'}</Descriptions.Item>
          <Descriptions.Item label="一般户账号">
            {customer.general_bank_account || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="一般户行号">
            {customer.general_bank_number || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="是否有网银">
            {customer.has_online_banking || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="网银是否托管">
            {customer.is_online_banking_custodian || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="三方协议账户">
            {customer.tripartite_agreement_account || '-'}
          </Descriptions.Item>
        </Descriptions>
      </TabPane>

      <TabPane tab="税务信息" key="4">
        <Descriptions bordered column={2}>
          <Descriptions.Item label="税种">{customer.tax_categories || '-'}</Descriptions.Item>
          <Descriptions.Item label="个税申报密码">
            {customer.personal_income_tax_password || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="个税申报人员" span={2}>
            {customer.personal_income_tax_staff || '-'}
          </Descriptions.Item>
        </Descriptions>

        <h3 className="mt-4 mb-2 font-medium">法定代表人</h3>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="姓名">
            {customer.legal_representative_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {customer.legal_representative_phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="身份证号">
            {customer.legal_representative_id || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="电子税务局密码">
            {customer.legal_representative_tax_password || '-'}
          </Descriptions.Item>
        </Descriptions>

        <h3 className="mt-4 mb-2 font-medium">财务负责人</h3>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="姓名">
            {customer.financial_contact_name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {customer.financial_contact_phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="身份证号">
            {customer.financial_contact_id || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="电子税务局密码">
            {customer.financial_contact_tax_password || '-'}
          </Descriptions.Item>
        </Descriptions>

        <h3 className="mt-4 mb-2 font-medium">办税员</h3>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="姓名">{customer.tax_officer_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="联系电话">
            {customer.tax_officer_phone || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="身份证号">{customer.tax_officer_id || '-'}</Descriptions.Item>
          <Descriptions.Item label="电子税务局密码">
            {customer.tax_officer_tax_password || '-'}
          </Descriptions.Item>
        </Descriptions>
      </TabPane>

      <TabPane tab="证照信息" key="5">
        <Descriptions bordered column={1}>
          <Descriptions.Item label="营业执照到期日期">
            {customer.license_expiry_date || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="注册资本认缴截止日期">
            {customer.capital_contribution_deadline || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="实缴资本">{customer.paid_in_capital || '-'}</Descriptions.Item>
          <Descriptions.Item label="年检密码">
            {customer.annual_inspection_password || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="股东信息">{customer.shareholders || '-'}</Descriptions.Item>
          <Descriptions.Item label="监事信息">{customer.supervisors || '-'}</Descriptions.Item>
          <Descriptions.Item label="行政许可">
            {customer.administrative_licenses || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="资本实缴记录">
            {customer.capital_contribution_records || '-'}
          </Descriptions.Item>
        </Descriptions>

        {/* 这里可以添加证件照片的展示，因为图片数据以JSON字符串形式存储，实际项目中需要进行解析 */}
      </TabPane>
    </Tabs>
  )
}

export default Customers
