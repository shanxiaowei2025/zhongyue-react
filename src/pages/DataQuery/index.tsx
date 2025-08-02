import React, { useState, useEffect } from 'react'
import { Table, Button, Input, Space, Form, Alert, message } from 'antd'
import { SearchOutlined, ReloadOutlined, DatabaseOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import {
  searchArchive,
  type ArchiveSearchResult,
  type ArchiveSearchParams,
} from '../../api/archive'
import { usePageStates, PageStatesStore } from '../../store/pageStates'
import { useDebouncedValue } from '../../hooks/useDebounce'
import useSWR from 'swr'

export default function DataQuery() {
  // 使用 pageStates 存储来保持状态
  const getState = usePageStates((state: PageStatesStore) => state.getState)
  const setState = usePageStates((state: PageStatesStore) => state.setState)

  // 从 pageStates 恢复搜索参数
  const savedSearchParams = getState('dataQuerySearchParams')
  const savedPagination = getState('dataQueryPagination')
  const savedHasSearched = getState('dataQueryHasSearched')

  const [current, setCurrent] = useState(savedPagination?.current || 1)
  const [pageSize, setPageSize] = useState(savedPagination?.pageSize || 10)
  const [searchParams, setSearchParams] = useState(() => ({
    companyName: '',
    unifiedSocialCreditCode: '',
    ...(savedSearchParams || {}),
  }))
  const [hasSearched, setHasSearched] = useState(savedHasSearched || false)
  const [isMobile, setIsMobile] = useState(false)

  // 添加防抖搜索参数
  const debouncedSearchParams = useDebouncedValue(searchParams, 500)

  // 构建请求参数 - 只传递搜索参数给后端，分页在前端处理
  const apiParams: ArchiveSearchParams = {
    ...debouncedSearchParams,
  }

  // 检查是否有搜索条件
  const hasSearchConditions = Boolean(
    debouncedSearchParams.companyName?.trim() ||
      debouncedSearchParams.unifiedSocialCreditCode?.trim()
  )

  // 使用SWR获取档案列表数据 - 只在有搜索条件且已执行搜索时才发起请求
  const {
    data: response,
    error,
    isLoading,
    mutate,
  } = useSWR(
    hasSearched && hasSearchConditions ? ['archive-search', apiParams] : null,
    () => searchArchive(apiParams),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000,
      onSuccess: data => {
        console.log('📄 档案查询API成功响应:', data)
        console.log('📄 响应数据结构:', JSON.stringify(data, null, 2))
        if (data?.data && Array.isArray(data.data)) {
          console.log('📄 档案列表项数:', data.data.length)
          console.log('📄 第一项数据:', data.data[0])
        }
      },
      onError: err => {
        console.error('❌ 档案查询API错误:', err)
        console.error('❌ 错误详情:', JSON.stringify(err, null, 2))
        message.error(`查询失败: ${err.message || '服务器错误'}`)
      },
    }
  )

  // 适配后端响应结构：data 直接是数组
  const allArchiveList = response?.data || []

  // 前端实现分页和搜索过滤
  const filteredList = allArchiveList.filter(item => {
    const matchCompanyName =
      !debouncedSearchParams.companyName ||
      item.companyName?.toLowerCase().includes(debouncedSearchParams.companyName.toLowerCase())
    const matchCreditCode =
      !debouncedSearchParams.unifiedSocialCreditCode ||
      item.unifiedSocialCreditCode?.includes(debouncedSearchParams.unifiedSocialCreditCode)
    return matchCompanyName && matchCreditCode
  })

  const total = filteredList.length
  const startIndex = (current - 1) * pageSize
  const endIndex = startIndex + pageSize
  const archiveList = filteredList.slice(startIndex, endIndex).map(item => ({
    ...item,
    // 清理数据中的特殊字符
    sealStorageNumber: item.sealStorageNumber?.replace(/[\r\n]/g, '').trim() || '',
    onlineBankingArchiveNumber: item.onlineBankingArchiveNumber?.trim() || '',
    paperArchiveNumber: item.paperArchiveNumber?.trim() || '',
    archiveStorageRemarks: item.archiveStorageRemarks?.trim() || '',
  }))

  // 调试信息
  console.log('档案查询 - 请求参数:', apiParams)
  console.log('档案查询 - API响应:', response)
  console.log('档案查询 - 原始数据:', allArchiveList)
  console.log('档案查询 - 过滤后数据:', filteredList)
  console.log('档案查询 - 当前页数据:', archiveList)
  console.log('档案查询 - 总数:', total)
  console.log('档案查询 - 错误:', error)

  // 当搜索参数变化时，保存到 pageStates
  useEffect(() => {
    setState('dataQuerySearchParams', searchParams)
  }, [searchParams, setState])

  // 当分页参数变化时，保存到 pageStates
  useEffect(() => {
    setState('dataQueryPagination', { current, pageSize })
  }, [current, pageSize, setState])

  // 当搜索状态变化时，保存到 pageStates
  useEffect(() => {
    setState('dataQueryHasSearched', hasSearched)
  }, [hasSearched, setState])

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 当搜索参数变化时，自动重置到第一页
  useEffect(() => {
    setCurrent(1)
  }, [searchParams.companyName, searchParams.unifiedSocialCreditCode])

  const handleSearch = () => {
    if (!hasSearchConditions) {
      message.warning('请输入企业名称或统一社会信用代码进行查询')
      return
    }
    setHasSearched(true)
    setCurrent(1)
    mutate()
  }

  const resetSearch = () => {
    setSearchParams({
      companyName: '',
      unifiedSocialCreditCode: '',
    })
    setHasSearched(false)
    setCurrent(1)
  }

  const columns: ColumnsType<ArchiveSearchResult> = [
    {
      title: '企业名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: isMobile ? 160 : 200,
      fixed: 'left',
      ellipsis: true,
    },
    {
      title: '统一社会信用代码',
      dataIndex: 'unifiedSocialCreditCode',
      key: 'unifiedSocialCreditCode',
      width: isMobile ? 180 : 200,
      responsive: ['md'],
      ellipsis: true,
    },
    {
      title: '印章存放档案编号',
      dataIndex: 'sealStorageNumber',
      key: 'sealStorageNumber',
      width: isMobile ? 160 : 180,
      responsive: ['lg'],
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '网银托管档案号',
      dataIndex: 'onlineBankingArchiveNumber',
      key: 'onlineBankingArchiveNumber',
      width: isMobile ? 160 : 180,
      responsive: ['lg'],
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '纸质资料档案编号',
      dataIndex: 'paperArchiveNumber',
      key: 'paperArchiveNumber',
      width: isMobile ? 160 : 180,
      responsive: ['md'],
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: '档案存放备注',
      dataIndex: 'archiveStorageRemarks',
      key: 'archiveStorageRemarks',
      width: isMobile ? 200 : 250,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
  ]

  return (
    <div className="data-query-container">
      {/* 页面标题 */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <DatabaseOutlined className="mr-2" />
          数据查询 - 档案存放信息
        </h2>
        <p className="text-gray-600 mt-1">根据企业名称或统一社会信用代码查询档案存放信息</p>
      </div>

      {/* 搜索和操作工具栏 */}
      <div className="mb-4">
        <Form layout="inline" className="data-query-search-form">
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
              <Form.Item label="企业名称" className="mb-2">
                <Input
                  placeholder="请输入企业名称关键词"
                  value={searchParams.companyName}
                  onChange={e => setSearchParams({ ...searchParams, companyName: e.target.value })}
                  className="w-full"
                  allowClear
                />
              </Form.Item>

              <Form.Item label="统一社会信用代码" className="mb-2">
                <Input
                  placeholder="请输入统一社会信用代码"
                  value={searchParams.unifiedSocialCreditCode}
                  onChange={e =>
                    setSearchParams({ ...searchParams, unifiedSocialCreditCode: e.target.value })
                  }
                  className="w-full"
                  allowClear
                />
              </Form.Item>
            </div>

            <div className="flex flex-wrap gap-2 mt-4 justify-between items-center">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  className="w-full sm:w-auto"
                >
                  查询
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={resetSearch}
                  className="w-full sm:w-auto"
                >
                  重置
                </Button>
              </div>
            </div>
          </div>
        </Form>
      </div>

      {/* 错误信息显示 */}
      {error && (
        <Alert
          message="查询失败"
          description={error.message || '无法连接到服务器，请检查网络连接或联系管理员'}
          type="error"
          showIcon
          className="mb-4"
        />
      )}

      {/* 未搜索状态提示 */}
      {!hasSearched && (
        <Alert
          message="请输入搜索条件"
          description="请在上方输入企业名称或统一社会信用代码，然后点击查询按钮开始搜索"
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      {/* 搜索无结果提示 */}
      {hasSearched && !isLoading && !error && archiveList.length === 0 && hasSearchConditions && (
        <Alert
          message="暂无数据"
          description="当前查询条件下没有找到相关档案信息，请尝试调整搜索条件"
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      {/* 数据表格 - 只在已搜索且有数据时显示 */}
      {hasSearched && (
        <Table
          columns={columns}
          dataSource={archiveList}
          rowKey={record =>
            record.unifiedSocialCreditCode || record.companyName || Math.random().toString()
          }
          pagination={{
            total,
            current,
            pageSize,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条记录`,
            onChange: (page, size) => {
              setCurrent(page)
              if (size !== pageSize) {
                setPageSize(size)
              }
            },
            size: isMobile ? 'small' : 'default',
            simple: isMobile,
          }}
          loading={isLoading}
          scroll={{ x: 'max-content' }}
          size={isMobile ? 'small' : 'middle'}
          sticky={{ offsetHeader: 0 }}
          className="data-query-table"
        />
      )}
    </div>
  )
}
