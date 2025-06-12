import React, { useState, useEffect, useRef } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Form,
  Row,
  Col,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { usePageStates, PageStatesStore } from '../../store/pageStates'
import { useDebouncedValue } from '../../hooks/useDebounce'
import { getEnterpriseList } from '../../api/enterpriseService'
import type { Enterprise, EnterpriseQueryParams } from '../../types/enterpriseService'

const { Title } = Typography;

// 智能文本渲染组件 - 只在文本被截断时显示tooltip
const EllipsisText: React.FC<{
  text: string
  maxWidth?: number
}> = ({ text, maxWidth }) => {
  const textRef = useRef<HTMLSpanElement>(null)
  const [isOverflowing, setIsOverflowing] = useState(false)

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const isOverflow = textRef.current.scrollWidth > textRef.current.clientWidth
        setIsOverflowing(isOverflow)
      }
    }

    checkOverflow()
    // 添加resize监听以处理窗口大小变化
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [text])

  const content = (
    <span
      ref={textRef}
      style={{
        cursor: isOverflowing ? 'pointer' : 'default',
        display: 'block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: maxWidth ? `${maxWidth}px` : '100%',
      }}
    >
      {text}
    </span>
  )

  if (isOverflowing) {
    return (
      <Tooltip
        title={text}
        placement="topLeft"
        mouseEnterDelay={0.3}
      >
        {content}
      </Tooltip>
    )
  }

  return content
}

const EnterpriseService: React.FC = () => {
  const navigate = useNavigate()
  
  // 使用 pageStates 存储来保持状态
  const getState = usePageStates((state: PageStatesStore) => state.getState)
  const setState = usePageStates((state: PageStatesStore) => state.setState)

  // 从 pageStates 恢复搜索参数和分页信息
  const savedSearchParams = getState('enterpriseSearchParams')
  const savedPagination = getState('enterprisePagination')

  // 状态管理
  const [loading, setLoading] = useState<boolean>(false)
  const [enterprises, setEnterprises] = useState<Enterprise[]>([])
  const [total, setTotal] = useState<number>(0)
  const [current, setCurrent] = useState<number>(savedPagination?.current || 1)
  const [pageSize, setPageSize] = useState<number>(savedPagination?.pageSize || 10)
  const [searchParams, setSearchParams] = useState<EnterpriseQueryParams>({
    companyName: '',
    unifiedSocialCreditCode: '',
    ...(savedSearchParams || {}),
  })

  // 添加防抖搜索参数
  const debouncedSearchParams = useDebouncedValue(searchParams, 500)

  // 加载企业列表数据
  const loadData = async () => {
    try {
      setLoading(true)
      const params: EnterpriseQueryParams = {
        page: current,
        pageSize,
        ...debouncedSearchParams,
      }

      // 保存分页和搜索参数到状态管理
      setState('enterpriseSearchParams', searchParams)
      setState('enterprisePagination', { current, pageSize })

      const response = await getEnterpriseList(params)
      
      if (response.code === 0 && response.data) {
        setEnterprises(response.data.data)
        setTotal(response.data.total)
      }
    } catch (error) {
      console.error('加载企业列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 当搜索参数或分页变化时，重新加载数据
  useEffect(() => {
    loadData()
  }, [current, pageSize, debouncedSearchParams])

  // 处理搜索
  const handleSearch = () => {
    setCurrent(1) // 重置为第一页
  }

  // 重置搜索
  const handleReset = () => {
    setSearchParams({
      companyName: '',
      unifiedSocialCreditCode: '',
    })
    setCurrent(1)
  }

  // 处理表格分页变化
  const handleTableChange = (pagination: TablePaginationConfig) => {
    if (pagination.current) {
      setCurrent(pagination.current)
    }
    if (pagination.pageSize) {
      setPageSize(pagination.pageSize)
    }
  }

  // 查看详情
  const handleView = (record: Enterprise) => {
    // 将企业信息保存到 localStorage，供详情页使用
    localStorage.setItem('currentEnterprise', JSON.stringify(record))
    navigate(`/enterprise-service/detail/${record.id}`)
  }

  // 格式化金额为人民币格式
  const formatCurrency = (amount?: string | null) => {
    if (amount === undefined || amount === null) return '¥0.00'
    // 将字符串转换为数字
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount)) return '¥0.00'
    
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(numAmount)
  }

  // 定义表格列
  const columns: ColumnsType<Enterprise> = [
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 280,
      render: (text: string, record: Enterprise) => (
        <Button 
          type="link" 
          onClick={() => handleView(record)}
          style={{ padding: 0, textAlign: 'left' }}
        >
          <EllipsisText text={text} maxWidth={260} />
        </Button>
      ),
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'unifiedSocialCreditCode',
      key: 'unifiedSocialCreditCode',
      width: 280,
    },
    {
      title: '费用贡献金额',
      dataIndex: 'contributionAmount',
      key: 'contributionAmount',
      render: (amount: string | null) => formatCurrency(amount),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record: Enterprise) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            size="small"
          >
            详情
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div className="enterprise-service">
      <Title level={2}>企业服务</Title>
      
      <Card className="mb-4">
        <Form layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item label="企业名称">
                <Input
                  placeholder="请输入企业名称"
                  value={searchParams.companyName}
                  onChange={e => setSearchParams({ ...searchParams, companyName: e.target.value })}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} lg={8}>
              <Form.Item label="统一社会信用代码">
                <Input
                  placeholder="请输入统一社会信用代码"
                  value={searchParams.unifiedSocialCreditCode}
                  onChange={e => setSearchParams({ ...searchParams, unifiedSocialCreditCode: e.target.value })}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={24} lg={8}>
              <Form.Item label=" " colon={false}>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                    搜索
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={enterprises}
          loading={loading}
          pagination={{
            current,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
          }}
          onChange={handleTableChange}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  )
}

export default EnterpriseService 