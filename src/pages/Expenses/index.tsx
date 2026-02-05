import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Form,
  message,
  Popconfirm,
  DatePicker,
  Tag,
  Tooltip,
  AutoComplete,
} from 'antd'
import type { ColumnType, ColumnGroupType } from 'antd/es/table'
import {
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
  AuditOutlined,
  InfoCircleOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  CloseOutlined,
  MessageOutlined,
} from '@ant-design/icons'
import { useSearchParams } from 'react-router-dom'
import { usePageStates } from '../../hooks/usePageStates'
import { useExpenseList, expenseDetailFetcher, exportExpenseData } from '../../hooks/useExpense'
import { usePermission } from '../../hooks/usePermission'
import { useDebounce } from '../../hooks/useDebounce'
import { Expense, ExpenseStatus, ExpenseQueryParams } from '../../types/expense'
import ExpenseForm from './ExpenseForm'
import ExpenseReceipt from './ExpenseReceipt'
import AuditModal from './AuditModal'
import { getAllBusinessOptions } from '../../utils/businessOptions'
import { getBusinessOptions } from '../../api/businessOption'
import { getCustomerSearchSuggestions } from '../../api/customer'
import dayjs from 'dayjs'
import './expenses.css'

const { RangePicker } = DatePicker

// 搜索防抖延迟时间（毫秒）
const DEBOUNCE_DELAY = 500

// 业务类型选项
const BUSINESS_TYPE_OPTIONS = [
  { label: '新增', value: '新增' },
  { label: '续费', value: '续费' },
]

// 社保业务类型选项
const SOCIAL_INSURANCE_BUSINESS_TYPE_OPTIONS = [
  { label: '新增', value: '新增' },
  { label: '续费', value: '续费' },
]

// 业务查询选项（已废弃，现在使用动态选项 getAllBusinessOptions）
// 保留这个定义是为了向后兼容，但实际使用时会被动态选项覆盖
const BUSINESS_INQUIRY_OPTIONS_DEPRECATED = [
  { label: '代理费', value: '代理费' },
  { label: '记账软件费', value: '记账软件费' },
  { label: '开票软件费', value: '开票软件费' },
  { label: '地址费', value: '地址费' },
  { label: '社保代理费', value: '社保代理费' },
  { label: '公积金代理费', value: '公积金代理费' },
  { label: '统计局报表费', value: '统计局报表费' },
  { label: '客户资料整理费', value: '客户资料整理费' },
  { label: '办照费用', value: '办照费用' },
  { label: '牌子费', value: '牌子费' },
  { label: '备案章费用', value: '备案章费用' },
  { label: '一般刻章费用', value: '一般刻章费用' },
  { label: '地址变更', value: '地址变更' },
  { label: '名称变更', value: '名称变更' },
  { label: '股东变更', value: '股东变更' },
  { label: '监事变更', value: '监事变更' },
  { label: '范围变更', value: '范围变更' },
  { label: '注册资本变更', value: '注册资本变更' },
  { label: '跨区域变更', value: '跨区域变更' },
  { label: '法定代表人变更', value: '法定代表人变更' },
  { label: '个升企', value: '个升企' },
  { label: '食品经营许可证', value: '食品经营许可证' },
  { label: '卫生许可证', value: '卫生许可证' },
  { label: '酒类经营许可证', value: '酒类经营许可证' },
  { label: '道路运输许可证', value: '道路运输许可证' },
  { label: '医疗器械经营许可证', value: '医疗器械经营许可证' },
  { label: '建筑施工许可证', value: '建筑施工许可证' },
  { label: '特种行业许可证', value: '特种行业许可证' },
  { label: '非代理企业工商注销', value: '非代理企业工商注销' },
  { label: '非代理企业税务注销', value: '非代理企业税务注销' },
  { label: '非代理企业银行注销', value: '非代理企业银行注销' },
  { label: '税务处理逾期/补充申报', value: '税务处理逾期/补充申报' },
  { label: '工商年报/工商公示', value: '工商年报/工商公示' },
  { label: '补执照', value: '补执照' },
  { label: '报表编制', value: '报表编制' },
  { label: '非代理企业行政许可注销', value: '非代理企业行政许可注销' },
  { label: '银行开户', value: '银行开户' },
  { label: '银行变更', value: '银行变更' },
  { label: '代理企业工商注销', value: '代理企业工商注销' },
  { label: '代理企业税务注销', value: '代理企业税务注销' },
  { label: '代理企业银行注销', value: '代理企业银行注销' },
  { label: '代理企业注销', value: '代理企业注销' },
  { label: '解除工商异常', value: '解除工商异常' },
  { label: '解除税务异常', value: '解除税务异常' },
  { label: '代办条形码', value: '代办条形码' },
  { label: '劳务派遣证年检', value: '劳务派遣证年检' },
  { label: '民非证年检', value: '民非证年检' },
  { label: '公司转让', value: '公司转让' },
  { label: '建设项目环境影响登记表', value: '建设项目环境影响登记表' },
  { label: '代办固定污染源排污', value: '代办固定污染源排污' },
  { label: '登报', value: '登报' },
  { label: '商标注册', value: '商标注册' },
  { label: '商标变更', value: '商标变更' },
  { label: '商标续展', value: '商标续展' },
  { label: '商标过户', value: '商标过户' },
  { label: '审计报告', value: '审计报告' },
  { label: '检测报告', value: '检测报告' },
  { label: '验资报告', value: '验资报告' },
  { label: '出版物许可证', value: '出版物许可证' },
  { label: '著作权', value: '著作权' },
  { label: '版权', value: '版权' },
  { label: '建筑资质证书', value: '建筑资质证书' },
  { label: '3A信用认证', value: '3A信用认证' },
  { label: '质量体系认证（环境、健康、职业）', value: '质量体系认证（环境、健康、职业）' },
  { label: '信用修复', value: '信用修复' },
  { label: '暂住证', value: '暂住证' },
  { label: '贷款业务', value: '贷款业务' },
  { label: '金融业务', value: '金融业务' },
  { label: '资产评估报告', value: '资产评估报告' },
  { label: '区块链', value: '区块链' },
  { label: '招标投标代理', value: '招标投标代理' },
  { label: '工程审计/预算/决算', value: '工程审计/预算/决算' },
  { label: '标书制作', value: '标书制作' },
  { label: '定位服务', value: '定位服务' },
  { label: '活动费用', value: '活动费用' },
  { label: '执行标准', value: '执行标准' },
  { label: '外包地址', value: '外包地址' },
  { label: '税务风险报告', value: '税务风险报告' },
  { label: '代理企业行政许可注销', value: '代理企业行政许可注销' },
  { label: '公司合作业务', value: '公司合作业务' },
  { label: '代办烟草证', value: '代办烟草证' },
  { label: '出口退税', value: '出口退税' },
  { label: '进出口权限申请', value: '进出口权限申请' },
]

// 状态映射为显示文本
const STATUS_LABELS = {
  [ExpenseStatus.Pending]: '未审核',
  [ExpenseStatus.Approved]: '已审核',
  [ExpenseStatus.Rejected]: '已退回',
}

// 状态映射为标签颜色
const STATUS_COLORS = {
  [ExpenseStatus.Pending]: 'orange',
  [ExpenseStatus.Approved]: 'green',
  [ExpenseStatus.Rejected]: 'red',
}

// 定义表格列
const columns: (ColumnType<Expense> | ColumnGroupType<Expense>)[] = [
  {
    title: '企业名称',
    dataIndex: 'companyName',
    key: 'companyName',
    width: 180,
    ellipsis: true,
  },
  {
    title: '总计费用',
    dataIndex: 'totalFee',
    key: 'totalFee',
    width: 100,
    render: (value: number | string | null | undefined) => {
      if (value === null || value === undefined) return '¥0.00'

      // 确保将任何类型的值转换为数字
      const numValue = typeof value === 'string' ? parseFloat(value) : Number(value)

      // 检查是否为有效数字
      return !isNaN(numValue) ? `¥${numValue.toFixed(2)}` : '¥0.00'
    },
  },
  {
    title: '业务类型',
    dataIndex: 'businessType',
    key: 'businessType',
    width: 120,
    ellipsis: true,
    render: (value: string) => value || '-',
  },
  {
    title: '社保代理业务类型',
    dataIndex: 'socialInsuranceBusinessType',
    key: 'socialInsuranceBusinessType',
    width: 140,
    ellipsis: true,
    render: (value: string) => value || '-',
  },
  {
    title: '代理费起止日期',
    key: 'agencyDateRange',
    width: 220,
    ellipsis: false,
    render: (record: Expense) => {
      const startDate = record.agencyStartDate
      const endDate = record.agencyEndDate

      if (!startDate || !endDate) return '-'

      return (
        <span style={{ whiteSpace: 'nowrap' }}>
          {`${dayjs(startDate).format('YYYY-MM')} ~ ${dayjs(endDate).format('YYYY-MM')}`}
        </span>
      )
    },
  },
  {
    title: '收费日期',
    dataIndex: 'chargeDate',
    key: 'chargeDate',
    width: 120,
    render: (value: string) => (value ? dayjs(value).format('YYYY-MM-DD') : '-'),
  },
  {
    title: '业务员',
    dataIndex: 'salesperson',
    key: 'salesperson',
    width: 100,
  },
  {
    title: '审核状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (status: ExpenseStatus) => (
      <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
    ),
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 150,
    render: (value: string) => (value ? dayjs(value).format('YYYY-MM-DD HH:mm:ss') : '-'),
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 150,
  },
]

const Expenses: React.FC = () => {
  const [urlSearchParams, setUrlSearchParams] = useSearchParams()

  // 获取权限控制
  const { expensePermissions, loading: permissionsLoading, refreshPermissions } = usePermission()

  // 权限标志 - 如果权限加载中，默认允许所有操作，避免界面闪烁
  const canCreateExpense = permissionsLoading ? true : expensePermissions?.canCreate
  const canEditExpense = permissionsLoading ? true : expensePermissions?.canEdit
  const canDeleteExpense = permissionsLoading ? true : expensePermissions?.canDelete
  const canAuditExpense = permissionsLoading ? true : expensePermissions?.canAudit
  const canCancelAuditExpense = permissionsLoading ? true : expensePermissions?.canCancelAudit
  const canViewReceipt = permissionsLoading ? true : expensePermissions?.canViewReceipt

  // 动态业务选项（从数据库获取）
  const [businessInquiryOptions, setBusinessInquiryOptions] = useState<{ label: string; value: string }[]>([])

  // 企业名称搜索建议相关状态
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{
    value: string
    label: React.ReactNode
    id: number
  }>>([])
  const [searchLoading, setSearchLoading] = useState(false)

  // 处理企业名称搜索建议
  const handleSearchSuggestions = useCallback(async (value: string) => {
    if (!value || value.trim().length < 2) {
      setSearchSuggestions([])
      return
    }

    setSearchLoading(true)
    try {
      const response = await getCustomerSearchSuggestions(value.trim(), 10)
      
      if (response.code === 0 && Array.isArray(response.data)) {
        if (response.data.length > 0) {
          const suggestions = response.data.map(item => ({
            value: item.companyName,
            label: (
              <div style={{ padding: '4px 0' }}>
                <div style={{ fontWeight: 500 }}>{item.companyName}</div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>
                  {item.unifiedSocialCreditCode || '无统一社会信用代码'}
                </div>
              </div>
            ),
            id: item.id,
          }))
          setSearchSuggestions(suggestions)
        } else {
          setSearchSuggestions([])
        }
      } else {
        setSearchSuggestions([])
      }
    } catch (error) {
      console.error('获取搜索建议失败:', error)
      setSearchSuggestions([])
    } finally {
      setSearchLoading(false)
    }
  }, [])

  // 加载所有业务选项（从数据库）
  const loadAllBusinessOptions = async () => {
    try {
      const response = await getBusinessOptions({})
      if (response.code === 0 && response.data?.list) {
        // 将数据库选项转换为下拉列表格式
        const dbOptions = response.data.list.map(opt => ({
          label: opt.optionValue,
          value: opt.optionValue
        }))
        
        // 合并localStorage的旧选项（向后兼容）
        const localStorageOptions = getAllBusinessOptions()
        
        // 去重合并
        const allOptionsMap = new Map<string, { label: string; value: string }>()
        
        // 先添加localStorage选项
        localStorageOptions.forEach(opt => {
          allOptionsMap.set(opt.value, opt)
        })
        
        // 再添加数据库选项（覆盖重复的）
        dbOptions.forEach(opt => {
          allOptionsMap.set(opt.value, opt)
        })
        
        // 转换为数组并排序
        const mergedOptions = Array.from(allOptionsMap.values()).sort((a, b) => 
          a.label.localeCompare(b.label)
        )
        
        setBusinessInquiryOptions(mergedOptions)
      }
    } catch (error) {
      console.error('加载业务选项失败:', error)
      // 失败时使用localStorage作为兜底
      setBusinessInquiryOptions(getAllBusinessOptions())
    }
  }

  // 初始化加载业务选项
  useEffect(() => {
    loadAllBusinessOptions()
  }, [])

  // 监听业务选项变化（支持localStorage方式的兼容）
  useEffect(() => {
    const handleBusinessOptionsUpdate = () => {
      loadAllBusinessOptions()
    }

    // 监听自定义事件
    window.addEventListener('businessOptionsUpdated', handleBusinessOptionsUpdate)

    // 清理函数
    return () => {
      window.removeEventListener('businessOptionsUpdated', handleBusinessOptionsUpdate)
    }
  }, [])

  // 刷新权限信息
  useEffect(() => {
    refreshPermissions()
  }, [refreshPermissions])

  // 页面状态
  const PAGE_STATE_KEY = 'expense_list_state'
  const [savedState, setSavedState] = usePageStates<{
    companyName: string
    unifiedSocialCreditCode: string
    status?: ExpenseStatus
    salesperson: string
    businessType?: string
    socialInsuranceBusinessType?: string
    businessInquiry?: string | string[]
    dateRange?: any // 使用any类型避免typescript错误
    createDateRange?: any // 开据时间范围
    auditDateRange?: any // 审核时间范围
    page: number
    pageSize: number
  }>(PAGE_STATE_KEY, {
    companyName: '',
    unifiedSocialCreditCode: '',
    status: undefined,
    salesperson: '',
    businessType: undefined,
    socialInsuranceBusinessType: undefined,
    businessInquiry: undefined,
    dateRange: undefined,
    createDateRange: undefined,
    auditDateRange: undefined,
    page: 1,
    pageSize: 10,
  })

  // 搜索参数状态
  const [form] = Form.useForm()

  // 正确处理savedState中的日期范围
  const initialDateRange = useMemo(() => {
    if (!savedState.dateRange) return undefined
    try {
      // 确保日期是有效的数组
      if (Array.isArray(savedState.dateRange) && savedState.dateRange.length === 2) {
        return [dayjs(savedState.dateRange[0]), dayjs(savedState.dateRange[1])]
      }
    } catch (error) {
      console.error('解析日期范围失败:', error)
    }
    return undefined
  }, [savedState.dateRange])

  // 正确处理savedState中的开据时间范围
  const initialCreateDateRange = useMemo(() => {
    if (!savedState.createDateRange) return undefined
    try {
      // 确保日期是有效的数组
      if (Array.isArray(savedState.createDateRange) && savedState.createDateRange.length === 2) {
        return [dayjs(savedState.createDateRange[0]), dayjs(savedState.createDateRange[1])]
      }
    } catch (error) {
      console.error('解析开据时间范围失败:', error)
    }
    return undefined
  }, [savedState.createDateRange])

  // 正确处理savedState中的审核时间范围
  const initialAuditDateRange = useMemo(() => {
    if (!savedState.auditDateRange) return undefined
    try {
      // 确保日期是有效的数组
      if (Array.isArray(savedState.auditDateRange) && savedState.auditDateRange.length === 2) {
        return [dayjs(savedState.auditDateRange[0]), dayjs(savedState.auditDateRange[1])]
      }
    } catch (error) {
      console.error('解析审核时间范围失败:', error)
    }
    return undefined
  }, [savedState.auditDateRange])

  const [searchParams, setSearchParams] = useState({
    companyName: savedState.companyName || '',
    unifiedSocialCreditCode: savedState.unifiedSocialCreditCode || '',
    status: savedState.status !== undefined ? savedState.status : undefined,
    salesperson: savedState.salesperson || '',
    businessType: savedState.businessType || undefined,
    socialInsuranceBusinessType: savedState.socialInsuranceBusinessType || undefined,
    businessInquiry: savedState.businessInquiry || undefined,
    dateRange: initialDateRange,
    createDateRange: initialCreateDateRange,
    auditDateRange: initialAuditDateRange,
    page: Number(savedState.page) || 1,
    pageSize: Number(savedState.pageSize) || 10,
  })

  // 费用详情状态
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [formVisible, setFormVisible] = useState(false)
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add')
  const [receiptVisible, setReceiptVisible] = useState(false)
  const [receiptExpenseId, setReceiptExpenseId] = useState<number | null>(null)
  const [previewVisible, setPreviewVisible] = useState(false)
  const [previewExpenseId, setPreviewExpenseId] = useState<number | null>(null)
  const [auditModalVisible, setAuditModalVisible] = useState(false)
  const [expenseToAudit, setExpenseToAudit] = useState<Expense | null>(null)

  // 使用数据获取钩子
  const {
    expenses,
    total,
    isLoading: loading,
    refreshExpenseList: fetchExpenses,
    removeExpense,
    auditExpense,
    cancelAudit: cancelAuditExpense,
  } = useExpenseList(searchParams)

  // 导航

  // 增加搜索状态跟踪
  const [isSearching, setIsSearching] = useState(false)

  // 初始化表单
  useEffect(() => {
    // 处理业务类型：将空字符串转换为"__EMPTY__"以便在界面上显示为"-"
    let displayBusinessType: string | string[] | undefined = searchParams.businessType
    if (Array.isArray(displayBusinessType)) {
      displayBusinessType = displayBusinessType.map(type => (type === '' ? '__EMPTY__' : type))
    } else if (displayBusinessType === '') {
      displayBusinessType = '__EMPTY__'
    }

    // 处理社保业务类型：将空字符串转换为"__EMPTY__"以便在界面上显示为"-"
    let displaySocialInsuranceBusinessType: string | string[] | undefined = searchParams.socialInsuranceBusinessType
    if (Array.isArray(displaySocialInsuranceBusinessType)) {
      displaySocialInsuranceBusinessType = displaySocialInsuranceBusinessType.map(type => (type === '' ? '__EMPTY__' : type))
    } else if (displaySocialInsuranceBusinessType === '') {
      displaySocialInsuranceBusinessType = '__EMPTY__'
    }

    form.setFieldsValue({
      companyName: searchParams.companyName,
      unifiedSocialCreditCode: searchParams.unifiedSocialCreditCode,
      status: searchParams.status,
      salesperson: searchParams.salesperson,
      businessType: displayBusinessType,
      socialInsuranceBusinessType: displaySocialInsuranceBusinessType,
      businessInquiry: searchParams.businessInquiry,
      dateRange: searchParams.dateRange,
      createDateRange: searchParams.createDateRange,
      auditDateRange: searchParams.auditDateRange,
    })
  }, [form, searchParams])

  // 保存页面状态 - 添加依赖项管理，避免无限循环
  useEffect(() => {
    // 记录上次状态变更时间，避免短时间内的多次保存
    const stateToSave = {
      companyName: searchParams.companyName,
      unifiedSocialCreditCode: searchParams.unifiedSocialCreditCode,
      status: searchParams.status,
      salesperson: searchParams.salesperson,
      businessType: searchParams.businessType,
      socialInsuranceBusinessType: searchParams.socialInsuranceBusinessType,
      businessInquiry: searchParams.businessInquiry,
      page: searchParams.page,
      pageSize: searchParams.pageSize,
      dateRange: searchParams.dateRange
        ? [
            searchParams.dateRange[0].format('YYYY-MM-DD'),
            searchParams.dateRange[1].format('YYYY-MM-DD'),
          ]
        : undefined,
      createDateRange: searchParams.createDateRange
        ? [
            searchParams.createDateRange[0].format('YYYY-MM-DD'),
            searchParams.createDateRange[1].format('YYYY-MM-DD'),
          ]
        : undefined,
      auditDateRange: searchParams.auditDateRange
        ? [
            searchParams.auditDateRange[0].format('YYYY-MM-DD'),
            searchParams.auditDateRange[1].format('YYYY-MM-DD'),
          ]
        : undefined,
    }

    // 使用ref或变量来跟踪初始渲染
    const timeoutId = setTimeout(() => {
      setSavedState(stateToSave)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [
    searchParams.companyName,
    searchParams.unifiedSocialCreditCode,
    searchParams.status,
    searchParams.salesperson,
    searchParams.businessType,
    searchParams.socialInsuranceBusinessType,
    searchParams.businessInquiry,
    searchParams.page,
    searchParams.pageSize,
    searchParams.dateRange,
    searchParams.createDateRange,
    searchParams.auditDateRange,
    setSavedState,
  ])

  // 点击搜索
  const handleSearch = () => {
    const values = form.getFieldsValue()

    // 处理业务类型：将"__EMPTY__"转换为空字符串
    let processedBusinessType = values.businessType
    if (Array.isArray(processedBusinessType)) {
      // 多选情况：将数组中的"__EMPTY__"替换为空字符串
      processedBusinessType = processedBusinessType.map(type => (type === '__EMPTY__' ? '' : type))
    } else if (processedBusinessType === '__EMPTY__') {
      // 单选情况：将"__EMPTY__"替换为空字符串
      processedBusinessType = ''
    }

    // 处理社保业务类型：将"__EMPTY__"转换为空字符串
    let processedSocialInsuranceBusinessType = values.socialInsuranceBusinessType
    if (Array.isArray(processedSocialInsuranceBusinessType)) {
      // 多选情况：将数组中的"__EMPTY__"替换为空字符串
      processedSocialInsuranceBusinessType = processedSocialInsuranceBusinessType.map(type => (type === '__EMPTY__' ? '' : type))
    } else if (processedSocialInsuranceBusinessType === '__EMPTY__') {
      // 单选情况：将"__EMPTY__"替换为空字符串
      processedSocialInsuranceBusinessType = ''
    }

    // 处理日期范围
    const params: any = {
      ...searchParams,
      companyName: values.companyName,
      unifiedSocialCreditCode: values.unifiedSocialCreditCode,
      status: values.status,
      salesperson: values.salesperson,
      businessType: processedBusinessType,
      socialInsuranceBusinessType: processedSocialInsuranceBusinessType,
      businessInquiry: values.businessInquiry,
      page: 1,
    }

    // 如果有收费日期范围，格式化后加入查询参数
    if (values.dateRange && values.dateRange.length === 2) {
      params.dateRange = values.dateRange
    } else {
      params.dateRange = undefined
    }

    // 如果有开据时间范围，格式化后加入查询参数
    if (values.createDateRange && values.createDateRange.length === 2) {
      params.createDateRange = values.createDateRange
    } else {
      params.createDateRange = undefined
    }

    // 如果有审核时间范围，格式化后加入查询参数
    if (values.auditDateRange && values.auditDateRange.length === 2) {
      params.auditDateRange = values.auditDateRange
    } else {
      params.auditDateRange = undefined
    }

    setSearchParams(params)
  }

  // 创建防抖处理后的搜索函数
  const debouncedSearch = useDebounce(handleSearch, DEBOUNCE_DELAY)

  // 处理选择搜索建议
  const handleSelectSuggestion = useCallback((value: string) => {
    form.setFieldValue('companyName', value)
    // 直接触发防抖搜索
    setIsSearching(true)
    debouncedSearch()
  }, [form, debouncedSearch])

  // 表单字段变化时的处理函数
  const handleFormFieldChange = () => {
    // 获取当前表单值
    const currentValues = form.getFieldsValue()

    // 特殊处理dateRange字段，确保当它被清空时能正确设置为undefined
    if (
      currentValues.dateRange === null ||
      (Array.isArray(currentValues.dateRange) &&
        (currentValues.dateRange.length === 0 ||
          currentValues.dateRange.some((date: any) => !date)))
    ) {
      form.setFieldValue('dateRange', undefined)
    }

    // 特殊处理createDateRange字段，确保当它被清空时能正确设置为undefined
    if (
      currentValues.createDateRange === null ||
      (Array.isArray(currentValues.createDateRange) &&
        (currentValues.createDateRange.length === 0 ||
          currentValues.createDateRange.some((date: any) => !date)))
    ) {
      form.setFieldValue('createDateRange', undefined)
    }

    // 特殊处理auditDateRange字段，确保当它被清空时能正确设置为undefined
    if (
      currentValues.auditDateRange === null ||
      (Array.isArray(currentValues.auditDateRange) &&
        (currentValues.auditDateRange.length === 0 ||
          currentValues.auditDateRange.some((date: any) => !date)))
    ) {
      form.setFieldValue('auditDateRange', undefined)
    }

    setIsSearching(true)
    debouncedSearch()
  }

  // 监听加载状态变化
  useEffect(() => {
    if (!loading && isSearching) {
      setIsSearching(false)
    }
  }, [loading, isSearching])

  // 处理URL参数 - 自动打开收据模态框
  useEffect(() => {
    const openReceiptParam = urlSearchParams.get('openReceipt')
    const openReceiptByIdParam = urlSearchParams.get('openReceiptById')

    // 通过收据编号查找 (原有逻辑)
    if (openReceiptParam && expenses.length > 0 && !loading) {
      const targetExpense = expenses.find(expense => expense.receiptNo === openReceiptParam)

      if (targetExpense) {
        // 找到收据对应的费用记录
        setReceiptExpenseId(targetExpense.id)
        setReceiptVisible(true)

        const newSearchParams = new URLSearchParams(urlSearchParams)
        newSearchParams.delete('openReceipt')
        setUrlSearchParams(newSearchParams, { replace: true })
      } else {
        message.warning(`未找到收据编号为 ${openReceiptParam} 的费用记录`)

        const newSearchParams = new URLSearchParams(urlSearchParams)
        newSearchParams.delete('openReceipt')
        setUrlSearchParams(newSearchParams, { replace: true })
      }
    }

    // 通过费用ID直接打开 (新增逻辑)
    if (openReceiptByIdParam && !loading) {
      const expenseId = parseInt(openReceiptByIdParam, 10)
      if (!isNaN(expenseId)) {
        // 直接通过费用ID打开收据
        setReceiptExpenseId(expenseId)
        setReceiptVisible(true)

        const newSearchParams = new URLSearchParams(urlSearchParams)
        newSearchParams.delete('openReceiptById')
        setUrlSearchParams(newSearchParams, { replace: true })
      } else {
        message.warning('无效的费用ID')

        const newSearchParams = new URLSearchParams(urlSearchParams)
        newSearchParams.delete('openReceiptById')
        setUrlSearchParams(newSearchParams, { replace: true })
      }
    }
  }, [urlSearchParams, expenses, loading, setUrlSearchParams])

  // 重置搜索条件
  const handleReset = () => {
    form.resetFields()
    // 重置所有查询参数
    setSearchParams({
      companyName: '',
      unifiedSocialCreditCode: '',
      status: undefined,
      salesperson: '',
      businessType: undefined,
      socialInsuranceBusinessType: undefined,
      businessInquiry: undefined,
      dateRange: undefined,
      createDateRange: undefined,
      auditDateRange: undefined,
      page: 1,
      pageSize: 10,
    })

    // 直接触发重新获取数据，不使用防抖
    // 使用下一个事件循环确保状态已更新
    setTimeout(() => {
      fetchExpenses()
      setIsSearching(false) // 确保重置loading状态
    }, 0)
  }

  // 表格页码改变
  const handleTableChange = (pagination: any) => {
    setSearchParams({
      ...searchParams,
      page: pagination.current,
      pageSize: pagination.pageSize,
    })
  }

  // 处理新增费用
  const handleAdd = () => {
    // 检查创建权限
    if (!canCreateExpense) {
      message.error('您没有创建费用的权限')
      return
    }

    setSelectedExpense(null)
    setFormMode('add')
    setFormVisible(true)
  }

  // 处理编辑费用
  const handleEdit = async (record: Expense) => {
    // 检查编辑权限
    if (!canEditExpense) {
      message.error('您没有编辑费用的权限')
      return
    }

    // 选中的费用记录

    // 使用Hook中的费用详情获取函数（包含响应处理逻辑）
    try {
      const expenseData = await expenseDetailFetcher(`/expense/${record.id}`)
      // 获取的费用详情
      setSelectedExpense(expenseData as Expense)
      setFormMode('edit')
      setFormVisible(true)
    } catch (error) {
      console.error('获取费用详情失败:', error)
      // 错误处理由拦截器统一处理
    }
  }

  // 处理删除费用
  const handleDelete = async (id: number) => {
    // 检查删除权限
    if (!canDeleteExpense) {
      message.error('您没有删除费用的权限')
      return
    }

    try {
      // 使用removeExpense函数代替直接调用API
      // 这样可以避免显示两次成功消息
      await removeExpense(id)
      // 不再需要单独刷新列表，因为removeExpense会自动刷新
    } catch (error) {
      console.error('删除费用失败:', error)
      // 错误消息已经在removeExpense中处理，这里不需要重复显示
    }
  }

  // 处理查看收据
  const handleViewReceipt = (id: number) => {
    // 检查查看收据权限
    if (!canViewReceipt) {
      message.error('您没有查看收据的权限')
      return
    }

    setReceiptExpenseId(id)
    setReceiptVisible(true)
  }

  // 处理预览收据
  const handlePreviewReceipt = (id: number) => {
    setPreviewExpenseId(id)
    setPreviewVisible(true)
  }

  // 处理审核
  const handleAudit = (record: Expense) => {
    // 检查审核权限
    if (!canAuditExpense) {
      message.error('您没有审核费用的权限')
      return
    }

    setExpenseToAudit(record)
    setAuditModalVisible(true)
  }

  // 提交审核
  const handleAuditSubmit = async (values: { status: ExpenseStatus; reason?: string }) => {
    try {
      // 检查审核权限
      if (!canAuditExpense) {
        message.error('您没有审核费用的权限')
        return
      }

      if (!expenseToAudit) {
        message.error('未选择要审核的费用')
        return
      }

      const success = await auditExpense(expenseToAudit.id, {
        status: values.status,
        reason: values.reason,
      })

      if (success) {
        setAuditModalVisible(false)
        // 不需要手动调用fetchExpenses()，Hook中的auditExpense已经自动刷新了
      }
    } catch (error) {
      console.error('审核失败:', error)
      // 错误处理由拦截器统一处理
    }
  }

  // 取消审核
  const handleCancelAudit = async (record: Expense) => {
    try {
      // 检查取消审核权限
      if (!canCancelAuditExpense) {
        message.error('您没有取消审核的权限')
        return
      }

      await cancelAuditExpense(record.id, { cancelReason: '取消审核' })
      message.success('已取消审核')
      fetchExpenses()
    } catch (error) {
      console.error('取消审核失败:', error)
      // 错误处理由拦截器统一处理
    }
  }

  // 导出数据
  const handleExport = async () => {
    try {
      // 显示加载提示
      message.loading('正在导出数据，请稍候...', 0)

      // 准备查询参数，使用当前搜索条件
      const exportParams: Partial<ExpenseQueryParams> = { ...searchParams }

      // 处理收费日期范围
      if (form.getFieldValue('dateRange')) {
        const dateRange = form.getFieldValue('dateRange')
        if (dateRange && dateRange[0] && dateRange[1]) {
          exportParams.chargeDateStart = dayjs(dateRange[0]).format('YYYY-MM-DD')
          exportParams.chargeDateEnd = dayjs(dateRange[1]).format('YYYY-MM-DD')
        }
      }

      // 处理开据时间范围
      if (form.getFieldValue('createDateRange')) {
        const createDateRange = form.getFieldValue('createDateRange')
        if (createDateRange && createDateRange[0] && createDateRange[1]) {
          exportParams.startDate = dayjs(createDateRange[0]).format('YYYY-MM-DD')
          exportParams.endDate = dayjs(createDateRange[1]).format('YYYY-MM-DD')
        }
      }

      // 处理审核时间范围
      if (form.getFieldValue('auditDateRange')) {
        const auditDateRange = form.getFieldValue('auditDateRange')
        if (auditDateRange && auditDateRange[0] && auditDateRange[1]) {
          exportParams.auditDateStart = dayjs(auditDateRange[0]).format('YYYY-MM-DD')
          exportParams.auditDateEnd = dayjs(auditDateRange[1]).format('YYYY-MM-DD')
        }
      }

      // 使用Hook中的导出函数（会自动清理分页参数）
      const response = await exportExpenseData(exportParams)

      // 创建Blob对象
      const blob = new Blob([response], { type: 'text/csv;charset=utf-8;' })

      // 创建下载链接
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url

      // 设置文件名，使用当前日期
      const date = dayjs().format('YYYYMMDD_HHmmss')
      link.download = `费用数据_${date}.csv`

      // 添加到DOM并触发点击
      document.body.appendChild(link)
      link.click()

      // 清理
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      // 关闭加载提示
      message.destroy()
      message.success('导出成功')
    } catch (error) {
      // 关闭加载提示
      message.destroy()
      console.error('导出错误:', error)
      message.error('导出失败，请联系管理员添加导出权限')
    }
  }

  // 操作列渲染函数
  const renderActions = (record: Expense) => {
    // 根据审核状态显示不同的操作按钮
    switch (record.status) {
      case ExpenseStatus.Pending: // 未审核
        return (
          <Space size="small" className="action-buttons">
            {/* 预览收据按钮 */}
            <Tooltip title="预览收据">
              <Button
                type="link"
                size="small"
                icon={<FileSearchOutlined />}
                className="preview-btn"
                onClick={() => handlePreviewReceipt(record.id)}
              />
            </Tooltip>

            {canEditExpense && (
              <Tooltip title="编辑">
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  className="edit-btn"
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
            )}
            {canAuditExpense && (
              <Tooltip title="审核">
                <Button
                  type="link"
                  size="small"
                  icon={<AuditOutlined />}
                  onClick={() => handleAudit(record)}
                />
              </Tooltip>
            )}
            {canDeleteExpense && (
              <Popconfirm
                title="确定要删除吗?"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Tooltip title="删除">
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    className="delete-btn"
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        )

      case ExpenseStatus.Approved: // 已审核通过
        return (
          <Space size="small" className="action-buttons">
            {canViewReceipt && (
              <Tooltip title="查看收据">
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  className="view-btn"
                  onClick={() => handleViewReceipt(record.id)}
                />
              </Tooltip>
            )}
            {record.internalRemarks && (
              <Tooltip
                title={
                  <div>
                    内部备注：
                    <br />
                    {record.internalRemarks}
                  </div>
                }
              >
                <Button
                  type="link"
                  size="small"
                  icon={<MessageOutlined />}
                  className="message-btn"
                />
              </Tooltip>
            )}
            {canCancelAuditExpense && (
              <Tooltip title="取消审核">
                <Button
                  type="link"
                  size="small"
                  danger
                  icon={<CloseOutlined />}
                  onClick={() => handleCancelAudit(record)}
                />
              </Tooltip>
            )}
          </Space>
        )

      case ExpenseStatus.Rejected: // 已退回/拒绝
        return (
          <Space size="small" className="action-buttons">
            {canEditExpense && (
              <Tooltip title="编辑">
                <Button
                  type="link"
                  size="small"
                  icon={<EditOutlined />}
                  className="edit-btn"
                  onClick={() => handleEdit(record)}
                />
              </Tooltip>
            )}
            <Popconfirm
              title={
                <div className="reject-reason-popup">
                  <div className="reject-reason-header">
                    <InfoCircleOutlined
                      style={{ color: '#FF4D4F', fontSize: '18px', marginRight: '8px' }}
                    />
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>退回原因</span>
                  </div>
                  <div
                    className="reject-reason-content"
                    style={{
                      margin: '12px 0',
                      padding: '10px',
                      background: '#f9f9f9',
                      border: '1px solid #f0f0f0',
                      borderRadius: '4px',
                      minHeight: '60px',
                      maxHeight: '200px',
                      overflow: 'auto',
                    }}
                  >
                    {record.rejectReason || '未提供退回原因'}
                  </div>
                </div>
              }
              okText="关闭"
              cancelButtonProps={{ style: { display: 'none' } }}
              okButtonProps={{ style: { backgroundColor: '#1890ff', borderColor: '#1890ff' } }}
              overlayStyle={{ maxWidth: '400px' }}
              icon={null}
            >
              <Tooltip title="退回原因">
                <Button type="link" size="small" danger icon={<InfoCircleOutlined />} />
              </Tooltip>
            </Popconfirm>
            {canDeleteExpense && (
              <Popconfirm
                title="确定要删除吗?"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Tooltip title="删除">
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    className="delete-btn"
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        )

      default:
        return null
    }
  }

  // 为columns添加操作列
  const tableColumns = [...columns]
  // 替换操作列
  if (tableColumns[tableColumns.length - 1].key === 'action') {
    tableColumns[tableColumns.length - 1] = {
      ...tableColumns[tableColumns.length - 1],
      render: (_: any, record: Expense) => renderActions(record),
    }
  }

  return (
    <div className="expenses-page">
      <div className="search-card mb-4">
        <Form
          form={form}
          layout="inline"
          className="search-form"
          onFinish={handleSearch}
          onValuesChange={handleFormFieldChange}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full mb-4">
            <Form.Item name="companyName" label="企业名称" className="m-0 w-full">
              <AutoComplete
                placeholder="输入企业名称关键词"
                options={searchSuggestions}
                onSearch={handleSearchSuggestions}
                onSelect={handleSelectSuggestion}
                allowClear
                className="w-full"
                notFoundContent={searchLoading ? '搜索中...' : '请输入至少2个字符'}
              />
            </Form.Item>

            <Form.Item
              name="unifiedSocialCreditCode"
              label="统一社会信用代码"
              className="m-0 w-full"
            >
              <Input placeholder="输入统一社会信用代码" allowClear className="w-full" />
            </Form.Item>

            <Form.Item name="status" label="状态" className="m-0 w-full">
              <Select placeholder="选择状态" allowClear className="w-full">
                <Select.Option value={ExpenseStatus.Pending}>未审核</Select.Option>
                <Select.Option value={ExpenseStatus.Approved}>已审核</Select.Option>
                <Select.Option value={ExpenseStatus.Rejected}>已退回</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="salesperson" label="业务员" className="m-0 w-full">
              <Input placeholder="输入业务员" allowClear className="w-full" />
            </Form.Item>

            <Form.Item name="businessType" label="业务类型" className="m-0 w-full">
              <Select
                mode="multiple"
                placeholder="选择业务类型"
                allowClear
                className="w-full"
                maxTagCount="responsive"
              >
                {BUSINESS_TYPE_OPTIONS.map(option => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
                <Select.Option value="__EMPTY__">-</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="socialInsuranceBusinessType" label="社保代理业务类型" className="m-0 w-full">
              <Select
                mode="multiple"
                placeholder="选择社保代理业务类型"
                allowClear
                className="w-full"
                maxTagCount="responsive"
              >
                {SOCIAL_INSURANCE_BUSINESS_TYPE_OPTIONS.map(option => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.label}
                  </Select.Option>
                ))}
                <Select.Option value="__EMPTY__">-</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="businessInquiry" label="业务" className="m-0 w-full">
              <Select
                mode="multiple"
                placeholder="请输入业务"
                allowClear
                className="w-full"
                maxTagCount="responsive"
                showSearch
                optionFilterProp="label"
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
                options={businessInquiryOptions}
              />
            </Form.Item>

            <Form.Item name="dateRange" label="收费日期" className="m-0 w-full">
              <RangePicker
                allowClear
                style={{ width: '100%' }}
                onChange={() => {
                  // 日期变化时特殊处理，确保能正确触发搜索
                  setTimeout(handleFormFieldChange, 0)
                }}
              />
            </Form.Item>

            <Form.Item name="createDateRange" label="开据时间" className="m-0 w-full">
              <RangePicker
                allowClear
                style={{ width: '100%' }}
                onChange={() => {
                  // 日期变化时特殊处理，确保能正确触发搜索
                  setTimeout(handleFormFieldChange, 0)
                }}
              />
            </Form.Item>

            <Form.Item name="auditDateRange" label="审核时间" className="m-0 w-full">
              <RangePicker
                allowClear
                style={{ width: '100%' }}
                onChange={() => {
                  // 日期变化时特殊处理，确保能正确触发搜索
                  setTimeout(handleFormFieldChange, 0)
                }}
              />
            </Form.Item>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 w-full">
            <div className="flex gap-2">
              <Form.Item className="m-0">
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </Form.Item>
            </div>
            <div className="flex gap-2">
              {canCreateExpense && (
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  新增费用
                </Button>
              )}
              <Button icon={<DownloadOutlined />} onClick={handleExport}>
                导出
              </Button>
            </div>
          </div>
        </Form>
      </div>

      <div>
        <Table
          columns={tableColumns}
          dataSource={expenses}
          rowKey="id"
          scroll={{ x: 1500 }}
          loading={loading || isSearching}
          pagination={{
            current: searchParams.page,
            pageSize: searchParams.pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条数据`,
          }}
          onChange={handleTableChange}
        />
      </div>

      {/* 费用表单弹窗 */}
      {formVisible && (
        <ExpenseForm
          visible={true}
          mode={formMode}
          expense={selectedExpense}
          onCancel={() => {
            setFormVisible(false)
            // 清空選中的費用記錄
            setTimeout(() => setSelectedExpense(null), 300)
            fetchExpenses()
          }}
        />
      )}

      {/* 收据查看弹窗 - 只有在需要显示时才渲染 */}
      {receiptVisible && receiptExpenseId && (
        <ExpenseReceipt
          visible={receiptVisible}
          expenseId={receiptExpenseId}
          onClose={() => setReceiptVisible(false)}
        />
      )}

      {/* 收据预览弹窗 - 只有在需要显示时才渲染 */}
      {previewVisible && previewExpenseId && (
        <ExpenseReceipt
          visible={previewVisible}
          expenseId={previewExpenseId}
          onClose={() => setPreviewVisible(false)}
          previewMode={true}
        />
      )}

      {/* 审核弹窗 */}
      <AuditModal
        visible={auditModalVisible}
        expense={expenseToAudit}
        onClose={() => setAuditModalVisible(false)}
        onConfirm={handleAuditSubmit}
      />
    </div>
  )
}

export default Expenses
