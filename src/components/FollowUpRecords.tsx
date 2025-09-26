import React, { useState } from 'react'
import { Button, Card, Empty, Form, Input, List, Modal, Space, Typography, message } from 'antd'
import { PlusOutlined, HistoryOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import type { FollowUpRecord } from '../types'

// 配置 dayjs 插件
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { TextArea } = Input
const { Text, Title } = Typography

interface FollowUpRecordsProps {
  /**
   * 跟进记录数组
   */
  records?: FollowUpRecord[]
  /**
   * 是否为只读模式
   */
  readonly?: boolean
  /**
   * 当跟进记录发生变化时的回调函数
   */
  onChange?: (records: FollowUpRecord[], addedRecords?: FollowUpRecord[]) => void
  /**
   * 组件标题
   */
  title?: string
  /**
   * 是否显示边框
   */
  bordered?: boolean
  /**
   * 分页配置
   */
  pagination?: {
    /**
     * 每页显示的记录数，默认为 10
     */
    pageSize?: number
    /**
     * 是否显示快速跳转
     */
    showQuickJumper?: boolean
    /**
     * 是否显示页数选择器
     */
    showSizeChanger?: boolean
    /**
     * 页数选择器的选项
     */
    pageSizeOptions?: string[]
  } | false
}

interface FollowUpFormData {
  text: string
}

/**
 * 跟进记录组件
 * 用于显示、添加、编辑和删除客户的跟进记录
 */
const FollowUpRecords: React.FC<FollowUpRecordsProps> = ({
  records = [],
  readonly = false,
  onChange,
  title = '跟进记录',
  bordered = true,
  pagination = { pageSize: 10, showQuickJumper: true, showSizeChanger: false },
}) => {
  const [form] = Form.useForm<FollowUpFormData>()
  const [modalVisible, setModalVisible] = useState(false)

  /**
   * 格式化日期时间显示
   */
  const formatDateTime = (datetime: string): string => {
    return dayjs(datetime).format('YYYY-MM-DD HH:mm:ss')
  }

  /**
   * 获取相对时间显示
   */
  const getRelativeTime = (datetime: string): string => {
    return dayjs(datetime).fromNow()
  }

  /**
   * 处理添加新跟进记录
   */
  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  /**
   * 处理表单提交
   */
  const handleSubmit = async () => {
    if (!onChange) return

    try {
      const values = await form.validateFields()
      const newRecord: FollowUpRecord = {
        text: values.text.trim(),
        datetime: new Date().toISOString(),
      }

      // 添加新记录
      const newRecords = [...records, newRecord].sort((a, b) => dayjs(b.datetime).valueOf() - dayjs(a.datetime).valueOf())
      const addedRecords = [newRecord] // 新添加的记录

      onChange(newRecords, addedRecords)
      setModalVisible(false)
      form.resetFields()
      message.success('跟进记录添加成功')
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  /**
   * 处理取消操作
   */
  const handleCancel = () => {
    setModalVisible(false)
    form.resetFields()
  }

  return (
    <Card
      title={
        <Space>
          <HistoryOutlined />
          <span>{title}</span>
          {records.length > 0 && <Text type="secondary">({records.length}条记录)</Text>}
        </Space>
      }
      bordered={bordered}
      extra={
        !readonly && (
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加跟进记录
          </Button>
        )
      }
    >
      {records.length === 0 ? (
        <Empty description="暂无跟进记录" />
      ) : (
        <List
          dataSource={[...records].sort((a, b) => dayjs(b.datetime).valueOf() - dayjs(a.datetime).valueOf())}
          pagination={pagination === false ? false : {
            pageSize: pagination?.pageSize || 10,
            showQuickJumper: pagination?.showQuickJumper ?? true,
            showSizeChanger: pagination?.showSizeChanger ?? false,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
            size: 'small',
          }}
          renderItem={(record, index) => (
            <List.Item
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Text strong>{formatDateTime(record.datetime)}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {getRelativeTime(record.datetime)}
                    </Text>
                  </Space>
                }
                description={
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {record.text}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}

      {/* 添加跟进记录的模态框 */}
      <Modal
        title="添加跟进记录"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText="确定"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="text"
            label="跟进内容"
            rules={[
              { required: true, message: '请输入跟进内容' },
              { min: 1, message: '跟进内容不能为空' },
              { max: 1000, message: '跟进内容不能超过1000字符' },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="请输入跟进内容..."
              showCount
              maxLength={1000}
            />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}

export default FollowUpRecords 