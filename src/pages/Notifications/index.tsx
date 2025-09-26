import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Tooltip,
  Modal,
  message,
  Tabs,
  Badge,
  Empty,
  Popconfirm,
} from 'antd'
import {
  BellOutlined,
  CheckOutlined,
  DeleteOutlined,
  ReloadOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import {
  useNotificationList,
  useNewNotifications,
  useNotificationActions,
  getNotificationListKey,
  getNewNotificationsKey,
} from '../../hooks/useNotification'
import { useNotificationStore } from '../../store/notification'
import type { Notification } from '../../types/notification'
import { mutate } from 'swr'
import NotificationDetail from '../../components/NotificationDetail'

const { Title, Text, Paragraph } = Typography

const NotificationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all')
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

  const { stats, isWebSocketConnected, updateStats } = useNotificationStore()

  // 用于追踪stats变化的ref
  const [prevStatsTotal, setPrevStatsTotal] = useState(stats.total)

  // 根据当前标签页获取数据
  const {
    notifications: allNotifications,
    meta: allMeta,
    isLoading: allLoading,
    refreshNotificationList: refreshAll,
  } = useNotificationList({ page: 1, limit: 50 })

  const {
    newNotifications: unreadNotifications,
    meta: unreadMeta,
    isLoading: unreadLoading,
  } = useNewNotifications({ page: 1, limit: 50 })

  const {
    markAsReadAction,
    markAllAsReadAction,
    deleteNotificationAction,
    isMarkingAsRead,
    isMarkingAllAsRead,
    isDeleting,
  } = useNotificationActions()

  // 当前显示的数据
  const currentNotifications = activeTab === 'all' ? allNotifications : unreadNotifications
  const currentMeta = activeTab === 'all' ? allMeta : unreadMeta
  const currentLoading = activeTab === 'all' ? allLoading : unreadLoading

  // 监听store中的通知统计变化，当收到新通知时自动刷新列表
  useEffect(() => {
    // 如果总通知数增加，说明收到了新通知
    if (stats.total > prevStatsTotal) {
      console.log('检测到新通知，刷新通知列表')

      // 刷新全部通知列表
      mutate(getNotificationListKey({ page: 1, limit: 50 }))

      // 刷新未读通知列表
      mutate(getNewNotificationsKey({ page: 1, limit: 50 }))

      // 更新追踪的总数
      setPrevStatsTotal(stats.total)
    }
  }, [stats.total, prevStatsTotal])

  // 刷新数据
  const handleRefresh = async () => {
    await refreshAll()
    await updateStats()
  }

  // 查看通知详情
  const handleViewDetail = (notification: Notification) => {
    setSelectedNotification(notification)
    setDetailModalVisible(true)

    // 如果是未读状态，标记为已读
    if (notification.readStatus === 0) {
      markAsReadAction(notification.notificationId).then(success => {
        if (success) {
          // SWR缓存已在markAsReadAction中刷新
          updateStats()
          handleRefresh()
        }
      })
    }
  }

  // 标记单个通知为已读
  const handleMarkAsRead = async (notification: Notification) => {
    const success = await markAsReadAction(notification.notificationId)
    if (success) {
      // SWR缓存已在markAsReadAction中刷新
      updateStats()
      handleRefresh()
    }
  }

  // 标记所有通知为已读
  const handleMarkAllAsRead = async () => {
    const success = await markAllAsReadAction()
    if (success) {
      // SWR缓存已在markAllAsReadAction中刷新
      updateStats()
      handleRefresh()
    }
  }

  // 删除通知
  const handleDelete = async (notification: Notification) => {
    const success = await deleteNotificationAction(notification.id)
    if (success) {
      // SWR缓存已在deleteNotificationAction中刷新
      updateStats()
      handleRefresh()
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的通知')
      return
    }

    Modal.confirm({
      title: '确认删除',
      content: `确定要删除选中的 ${selectedRowKeys.length} 条通知吗？`,
      onOk: async () => {
        const promises = selectedRowKeys.map(key => {
          const notification = currentNotifications.find(n => n.id === key)
          return notification ? deleteNotificationAction(notification.id) : Promise.resolve(false)
        })

        const results = await Promise.all(promises)
        const successCount = results.filter(Boolean).length

        if (successCount > 0) {
          message.success(`成功删除 ${successCount} 条通知`)
          // SWR缓存已在deleteNotificationAction中刷新
          updateStats()
          handleRefresh()
          setSelectedRowKeys([])
        }
      },
    })
  }

  // 表格列定义
  const columns: ColumnsType<Notification> = [
    {
      title: '状态',
      dataIndex: 'readStatus',
      key: 'readStatus',
      width: 80,
      render: (readStatus: number) => (
        <div className="flex justify-center">
          {readStatus === 0 ? <Badge status="processing" /> : <Badge status="default" />}
        </div>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Notification) => (
        <div className="flex items-center gap-2">
          <Text
            strong={record.readStatus === 0}
            className={record.readStatus === 0 ? 'text-blue-600' : ''}
          >
            {title}
          </Text>
          {record.readStatus === 0 && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
        </div>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      render: (content: string) => (
        <Paragraph ellipsis={{ rows: 2 }} className="mb-0">
          {content}
        </Paragraph>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        let color = 'default'
        let displayText = type || '系统'

        if (type === '客户') {
          color = 'green'
        } else if (type === '费用') {
          color = 'yellow'
        } else if (type === 'system') {
          color = 'blue'
          displayText = '系统'
        } else if (type === 'financial_self_inspection') {
          color = 'orange'
          displayText = '账务自查'
        }

        return <Tag color={color}>{displayText}</Tag>
      },
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (createdAt: string) => (
        <Text type="secondary">{dayjs(createdAt).format('YYYY-MM-DD HH:mm')}</Text>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record: Notification) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            />
          </Tooltip>
          {record.readStatus === 0 && (
            <Tooltip title="标记已读">
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                loading={isMarkingAsRead}
                onClick={() => handleMarkAsRead(record)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="确定要删除这条通知吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
                loading={isDeleting}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <Card>
        {/* 页面头部 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <BellOutlined className="text-2xl text-blue-500" />
            <Title level={3} className="mb-0">
              通知中心
            </Title>
            {/* WebSocket连接状态 */}
            <Tooltip title={isWebSocketConnected ? '实时连接正常' : '实时连接断开'}>
              <div
                className={`w-3 h-3 rounded-full ${
                  isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
            </Tooltip>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={currentLoading}>
              刷新
            </Button>
            {stats.unread > 0 && (
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={handleMarkAllAsRead}
                loading={isMarkingAllAsRead}
              >
                全部已读
              </Button>
            )}
          </Space>
        </div>

        {/* 统计信息 */}
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <Space size="large">
            <div>
              <Text type="secondary">总通知数：</Text>
              <Text strong className="text-lg">
                {stats.total}
              </Text>
            </div>
            <div>
              <Text type="secondary">未读通知：</Text>
              <Text strong className="text-lg text-red-500">
                {stats.unread}
              </Text>
            </div>
          </Space>
        </div>

        {/* 标签页 */}
        <Tabs
          activeKey={activeTab}
          onChange={key => setActiveTab(key as 'all' | 'unread')}
          items={[
            {
              key: 'all',
              label: (
                <span>
                  全部通知
                  {stats.total > 0 && <Badge count={stats.total} className="ml-2" />}
                </span>
              ),
            },
            {
              key: 'unread',
              label: (
                <span>
                  未读通知
                  {stats.unread > 0 && <Badge count={stats.unread} className="ml-2" />}
                </span>
              ),
            },
          ]}
        />

        {/* 批量操作 */}
        {selectedRowKeys.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <Space>
              <Text>已选择 {selectedRowKeys.length} 项</Text>
              <Button size="small" onClick={handleBatchDelete}>
                批量删除
              </Button>
              <Button size="small" onClick={() => setSelectedRowKeys([])}>
                取消选择
              </Button>
            </Space>
          </div>
        )}

        {/* 通知表格 */}
        <Table
          columns={columns}
          dataSource={currentNotifications}
          rowKey="id"
          loading={currentLoading}
          pagination={{
            total: currentMeta.total,
            current: currentMeta.page,
            pageSize: currentMeta.limit,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          locale={{
            emptyText: <Empty description="暂无通知" />,
          }}
        />
      </Card>

      {/* 通知详情弹窗 */}
      <NotificationDetail
        visible={detailModalVisible}
        notification={selectedNotification}
        onClose={() => {
          setDetailModalVisible(false)
          setSelectedNotification(null)
        }}
        onMarkAsRead={async notificationId => {
          const success = await markAsReadAction(notificationId)
          if (success) {
            updateStats()
          }
          return success
        }}
        showCopyButton={true}
      />
    </div>
  )
}

export default NotificationsPage
