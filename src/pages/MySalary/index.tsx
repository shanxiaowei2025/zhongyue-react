import React, { useState, useEffect } from 'react'
import { Button, Spin, message, DatePicker, Table, Tag, Modal, Space, Tooltip } from 'antd'
import {
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  LockOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useMySalary } from '../../hooks/useMySalary'
import MySalaryDetails from './components/MySalaryDetails'
import SalaryAuthModal from '../../components/SalaryAuthModal'
import type { MySalaryRecord } from '../../types/mySalary'
import { useSalaryAuthStore } from '../../store/salaryAuth'

const MySalary: React.FC = () => {
  const { selectedRecord, selectedYearMonth, salaryList, loading, operations, refreshData } =
    useMySalary()
  const { clearToken } = useSalaryAuthStore()
  const tokenInfo = useSalaryAuthStore(state => state.tokenInfo)

  // 计算token是否有效
  const isTokenValid = () => {
    if (!tokenInfo) return false
    const now = Date.now()
    return tokenInfo.expiresAt > now
  }

  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [authModalVisible, setAuthModalVisible] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)

  // 检查薪资访问权限
  useEffect(() => {
    const checkAuth = () => {
      if (isTokenValid()) {
        setIsAuthorized(true)
      } else {
        setIsAuthorized(false)
        setAuthModalVisible(true)
      }
    }

    checkAuth()
  }, [tokenInfo]) // 直接依赖tokenInfo，而不是函数

  // 处理认证成功
  const handleAuthSuccess = () => {
    setAuthModalVisible(false)
    setIsAuthorized(true)
    // 认证成功后，SWR会因为token状态变化自动重新发起请求
    // 手动触发刷新以确保立即更新
    refreshData()
  }

  // 处理认证取消
  const handleAuthCancel = () => {
    setAuthModalVisible(false)
    // 返回上一页或主页
    window.history.back()
  }

  // 处理锁定按钮
  const handleLock = () => {
    Modal.confirm({
      title: '确认锁定薪资访问',
      content: '锁定后需要重新验证薪资密码才能访问薪资信息。',
      okText: '确认锁定',
      cancelText: '取消',
      onOk() {
        clearToken()
        setIsAuthorized(false)
        setAuthModalVisible(true)
        message.success('已锁定薪资访问')
      },
    })
  }

  const handleYearChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      const year = date.format('YYYY')
      operations.switchMonth(`${year}-01`) // 保持接口兼容，内部会转换为年度查询
    }
  }

  const handleViewRecord = (record: MySalaryRecord) => {
    operations.selectRecord(record)
    setDetailModalVisible(true)
  }

  const handleConfirmSalary = async (record: MySalaryRecord) => {
    try {
      setConfirmingId(record.id)
      await operations.confirmSalary(record.id)
      message.success('薪资确认成功')
    } catch (error) {
      // 错误已在hook中处理
    } finally {
      setConfirmingId(null)
    }
  }

  const handleConfirmInModal = async () => {
    if (!selectedRecord) return

    try {
      setConfirmingId(selectedRecord.id)
      await operations.confirmSalary(selectedRecord.id)
      setDetailModalVisible(false)
      message.success('薪资确认成功')
    } catch (error) {
      // 错误已在hook中处理
    } finally {
      setConfirmingId(null)
    }
  }

  // 格式化货币
  const formatCurrency = (amount: string | number | undefined | null) => {
    if (amount === undefined || amount === null || amount === '' || isNaN(Number(amount))) {
      return '¥0.00'
    }
    const numAmount = Number(amount)
    return `¥${numAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`
  }

  // 表格列定义
  const columns: ColumnsType<MySalaryRecord> = [
    {
      title: '月份',
      dataIndex: 'yearMonth',
      key: 'yearMonth',
      width: 130,
      render: (yearMonth: string) => dayjs(yearMonth).format('YYYY年MM月'),
      fixed: 'left',
    },
    {
      title: '工资基数',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      width: 100,
      render: (value: string | number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '考勤扣款',
      dataIndex: 'attendanceDeduction',
      key: 'attendanceDeduction',
      width: 100,
      render: (value: string | number) => (
        <span className="text-red-500">-{formatCurrency(value)}</span>
      ),
      align: 'right',
    },
    {
      title: '临时增加',
      dataIndex: 'temporaryIncrease',
      key: 'temporaryIncrease',
      width: 100,
      render: (value: string | number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '全勤奖励',
      dataIndex: 'fullAttendance',
      key: 'fullAttendance',
      width: 100,
      render: (value: string | number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '补贴合计',
      dataIndex: 'totalSubsidy',
      key: 'totalSubsidy',
      width: 100,
      render: (value: string | number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '工龄津贴',
      dataIndex: 'seniority',
      key: 'seniority',
      width: 100,
      render: (value: string | number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: (
        <span>
          代理费提成{' '}
          <Tooltip
            title={
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>代理费提成比例</div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #d9d9d9' }}>
                        续费
                      </td>
                      <td style={{ padding: '4px 8px', borderBottom: '1px solid #d9d9d9' }}>1%</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 8px' }}>软件费、地址费</td>
                      <td style={{ padding: '4px 8px' }}>10%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            }
            placement="top"
          >
            <QuestionCircleOutlined style={{ fontSize: '12px', color: '#999' }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'agencyFeeCommission',
      key: 'agencyFeeCommission',
      width: 110,
      render: (value: string | number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '绩效提成',
      dataIndex: 'performanceCommission',
      key: 'performanceCommission',
      width: 100,
      render: (value: string | number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '业务提成',
      dataIndex: 'businessCommission',
      key: 'businessCommission',
      width: 100,
      render: (value: string | number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '朋友圈扣款',
      dataIndex: 'otherDeductions',
      key: 'otherDeductions',
      width: 100,
      render: (value: string | number) => (
        <span className="text-red-500">-{formatCurrency(value)}</span>
      ),
      align: 'right',
    },
    {
      title: '个人医疗',
      dataIndex: 'personalMedical',
      key: 'personalMedical',
      width: 100,
      render: (value: string | number) => (
        <span className="text-red-500">-{formatCurrency(value)}</span>
      ),
      align: 'right',
    },
    {
      title: '个人养老',
      dataIndex: 'personalPension',
      key: 'personalPension',
      width: 100,
      render: (value: string | number) => (
        <span className="text-red-500">-{formatCurrency(value)}</span>
      ),
      align: 'right',
    },
    {
      title: '个人失业',
      dataIndex: 'personalUnemployment',
      key: 'personalUnemployment',
      width: 100,
      render: (value: string | number) => (
        <span className="text-red-500">-{formatCurrency(value)}</span>
      ),
      align: 'right',
    },
    {
      title: '社保合计',
      dataIndex: 'personalInsuranceTotal',
      key: 'personalInsuranceTotal',
      width: 100,
      render: (value: string | number) => (
        <span className="font-medium text-red-500">-{formatCurrency(value)}</span>
      ),
      align: 'right',
    },
    {
      title: '公司承担合计',
      dataIndex: 'companyInsuranceTotal',
      key: 'companyInsuranceTotal',
      width: 110,
      render: (value: string | number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '保证金扣除',
      dataIndex: 'depositDeduction',
      key: 'depositDeduction',
      width: 100,
      render: (value: string | number) => (
        <span className="text-red-500">-{formatCurrency(value)}</span>
      ),
      align: 'right',
    },
    {
      title: '个税',
      dataIndex: 'personalIncomeTax',
      key: 'personalIncomeTax',
      width: 100,
      render: (value: string | number) => (
        <span className="font-medium text-red-500">-{formatCurrency(value)}</span>
      ),
      align: 'right',
    },
    {
      title: '应发合计',
      dataIndex: 'totalPayable',
      key: 'totalPayable',
      width: 120,
      render: (value: string | number) => (
        <span className="font-mono font-bold text-green-600">{formatCurrency(value)}</span>
      ),
      align: 'right',
    },
    {
      title: '银行卡号',
      dataIndex: 'bankCardNumber',
      key: 'bankCardNumber',
      width: 140,
      ellipsis: true,
    },
    {
      title: '银行卡/微信',
      dataIndex: 'bankCardOrWechat',
      key: 'bankCardOrWechat',
      width: 110,
      render: (value: string | number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '现金发放',
      dataIndex: 'cashPaid',
      key: 'cashPaid',
      width: 100,
      render: (value: string | number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '对公转账',
      dataIndex: 'corporatePayment',
      key: 'corporatePayment',
      width: 100,
      render: (value: string | number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '个税申报',
      dataIndex: 'taxDeclaration',
      key: 'taxDeclaration',
      width: 100,
      render: (value: string | number) => formatCurrency(value),
      align: 'right',
    },
    {
      title: '确认状态',
      dataIndex: 'isConfirmed',
      key: 'isConfirmed',
      width: 130,
      render: (isConfirmed: boolean, record: MySalaryRecord) => {
        if (isConfirmed) {
          return (
            <div className="space-y-1">
              <Tag icon={<CheckCircleOutlined />} color="success">
                已确认
              </Tag>
              {record.confirmedAt && (
                <div className="text-xs text-gray-500">
                  {dayjs(record.confirmedAt).format('MM-DD HH:mm')}
                </div>
              )}
            </div>
          )
        }
        return (
          <Tag icon={<ClockCircleOutlined />} color="warning">
            待确认
          </Tag>
        )
      },
      align: 'center',
      fixed: 'right',
    },
    {
      title: '发放状态',
      dataIndex: 'isPaid',
      key: 'isPaid',
      width: 110,
      render: (isPaid: boolean) => (
        <Tag
          icon={isPaid ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
          color={isPaid ? 'green' : 'orange'}
        >
          {isPaid ? '已发放' : '待发放'}
        </Tag>
      ),
      align: 'center',
      fixed: 'right',
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      render: (_, record: MySalaryRecord) => {
        const canConfirm = !record.isConfirmed && Number(record.totalPayable) > 0

        return (
          <div className="flex flex-col gap-1">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewRecord(record)}
              className="!p-1 !h-auto"
            >
              详情
            </Button>
            {!record.isConfirmed && (
              <Button
                type="primary"
                size="small"
                loading={confirmingId === record.id}
                disabled={!canConfirm}
                onClick={() => handleConfirmSalary(record)}
                className="!p-1 !h-auto"
              >
                确认
              </Button>
            )}
          </div>
        )
      },
      fixed: 'right',
      align: 'center',
    },
  ]

  const currentYear = dayjs(selectedYearMonth)

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 页头 */}
      <div className="bg-white border-b shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">我的薪资</h1>
            <p className="text-gray-500">
              查看和确认我的薪资记录 - {dayjs(selectedYearMonth).format('YYYY年')}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <DatePicker
              value={currentYear}
              onChange={handleYearChange}
              allowClear={false}
              picker="year"
              format="YYYY"
              placeholder="选择年份"
              disabled={!isAuthorized}
            />
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={refreshData}
                loading={loading}
                disabled={!isAuthorized}
              >
                刷新
              </Button>
              <Button icon={<LockOutlined />} onClick={handleLock} disabled={!isAuthorized} danger>
                锁定
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 bg-white p-6 overflow-hidden">
        {isAuthorized ? (
          <>
            <div className="mb-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">薪资记录</h2>
                <div className="text-sm text-gray-500">共 {salaryList.length} 条记录</div>
              </div>
            </div>

            <Table
              columns={columns}
              dataSource={salaryList}
              rowKey="id"
              loading={loading}
              pagination={false}
              scroll={{ x: 2800, y: 'calc(100vh - 250px)' }}
              size="middle"
              bordered
              locale={{
                emptyText: (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-lg mb-2">暂无薪资记录</div>
                    <div className="text-sm">该年度暂无薪资数据</div>
                  </div>
                ),
              }}
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <LockOutlined className="text-6xl text-gray-300 mb-4" />
              <h3 className="text-xl text-gray-600 mb-2">薪资信息已锁定</h3>
              <p className="text-gray-500 mb-4">请验证您的薪资密码以查看薪资信息</p>
              <Button
                type="primary"
                onClick={() => setAuthModalVisible(true)}
                icon={<LockOutlined />}
              >
                验证密码
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 薪资详情弹窗 */}
      <Modal
        title="薪资详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={1200}
        footer={null}
        className="salary-detail-modal"
      >
        <MySalaryDetails
          detail={selectedRecord}
          onConfirm={handleConfirmInModal}
          loading={confirmingId === selectedRecord?.id}
        />
      </Modal>

      {/* 薪资认证弹窗 */}
      <SalaryAuthModal
        visible={authModalVisible}
        onSuccess={handleAuthSuccess}
        onCancel={handleAuthCancel}
        title="薪资密码验证"
        description="为了保护您的薪资隐私，请输入薪资查看密码"
      />
    </div>
  )
}

export default MySalary
