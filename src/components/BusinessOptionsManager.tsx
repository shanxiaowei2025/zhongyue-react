import React, { useState, useEffect } from 'react'
import { Select, Button, Input, Space, message, Modal, List, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/auth'
import { isAdminUser } from '../utils/permissionUtils'
import {
  getBusinessOptionsByCategory,
  createBusinessOption,
  deleteBusinessOption,
} from '../api/businessOption'
import { BusinessOption } from '../types/businessOption'
import { triggerBusinessOptionsUpdate } from '../utils/businessOptions'

interface BusinessOptionsManagerProps {
  value?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  category: string // 业务类别，如 'change_business', 'administrative_license' 等
  defaultOptions?: { value: string; label: string }[] // 默认选项（仅用于后端未返回时的兜底）
}

const BusinessOptionsManager: React.FC<BusinessOptionsManagerProps> = ({
  value,
  onChange,
  placeholder = '请选择或输入业务',
  category,
  defaultOptions = [],
}) => {
  // 获取当前用户信息和权限
  const { user } = useAuthStore()
  const isAdmin = isAdminUser(user)

  const [businessOptions, setBusinessOptions] = useState<BusinessOption[]>([])
  const [loading, setLoading] = useState(false)
  const [manageModalVisible, setManageModalVisible] = useState(false)
  const [newOptionInput, setNewOptionInput] = useState('')

  // 从后端加载业务选项
  const loadBusinessOptions = async () => {
    setLoading(true)
    try {
      const response = await getBusinessOptionsByCategory(category)
      if (response.code === 0 && response.data) {
        // 处理后端返回的数据，确保 isDefault 是布尔类型
        const normalizedData = response.data.map(option => ({
          ...option,
          isDefault: Boolean(option.isDefault), // 将 0/1 转换为 false/true
        }))
        setBusinessOptions(normalizedData)
      } else {
        // 如果后端没有数据，使用默认选项作为兜底
        console.warn('后端未返回业务选项，使用默认选项')
      }
    } catch (error) {
      console.error('加载业务选项失败:', error)
      message.error('加载业务选项失败')
    } finally {
      setLoading(false)
    }
  }

  // 组件挂载时加载数据
  useEffect(() => {
    loadBusinessOptions()
  }, [category])

  // 合并默认选项和后端选项
  const allOptions = [
    ...defaultOptions,
    ...businessOptions
      .filter(opt => !defaultOptions.some(def => def.value === opt.optionValue))
      .map(opt => ({ value: opt.optionValue, label: opt.optionValue })),
  ]

  // 添加新选项
  const handleAddOption = async () => {
    // 权限检查：只有管理员才能添加业务选项
    if (!isAdmin) {
      message.error('只有管理员才能添加业务选项')
      return
    }

    if (!newOptionInput.trim()) {
      message.warning('请输入业务名称')
      return
    }

    const trimmedInput = newOptionInput.trim()

    // 检查是否已存在
    const existsInDefault = defaultOptions.some(opt => opt.value === trimmedInput)
    const existsInBackend = businessOptions.some(opt => opt.optionValue === trimmedInput)

    if (existsInDefault || existsInBackend) {
      message.warning('该业务已存在')
      return
    }

    try {
      const response = await createBusinessOption({
        category,
        optionValue: trimmedInput,
        isDefault: false,
      })

      if (response.code === 0) {
        message.success('添加成功')
        setNewOptionInput('')
        // 重新加载选项列表
        await loadBusinessOptions()
        // 触发全局业务选项更新事件，通知其他组件刷新
        triggerBusinessOptionsUpdate()
      } else {
        message.error(response.message || '添加失败')
      }
    } catch (error) {
      console.error('添加业务选项失败:', error)
      message.error('添加失败')
    }
  }

  // 删除选项
  const handleDeleteOption = async (option: BusinessOption) => {
    // 权限检查：只有管理员才能删除业务选项
    if (!isAdmin) {
      message.error('只有管理员才能删除业务选项')
      return
    }

    // 不允许删除默认选项
    if (option.isDefault) {
      message.error('不能删除默认选项')
      return
    }

    try {
      const response = await deleteBusinessOption(option.id)
      if (response.code === 0) {
        message.success('删除成功')
        // 重新加载选项列表
        await loadBusinessOptions()
        // 触发全局业务选项更新事件，通知其他组件刷新
        triggerBusinessOptionsUpdate()
      } else {
        message.error(response.message || '删除失败')
      }
    } catch (error) {
      console.error('删除业务选项失败:', error)
      message.error('删除失败')
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      <Select
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        mode="multiple"
        style={{ flex: 1 }}
        options={allOptions}
        loading={loading}
      />
      {/* 只有管理员才显示管理按钮 */}
      {isAdmin && (
        <Button
          icon={<SettingOutlined />}
          onClick={() => setManageModalVisible(true)}
          title="管理业务选项（仅管理员）"
        />
      )}

      <Modal
        title="管理业务选项"
        open={manageModalVisible}
        onCancel={() => setManageModalVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setManageModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 添加新业务 */}
          <div>
            <h4 style={{ marginBottom: '8px' }}>添加新业务</h4>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                value={newOptionInput}
                onChange={e => setNewOptionInput(e.target.value)}
                placeholder="请输入业务名称"
                onPressEnter={handleAddOption}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddOption}>
                添加
              </Button>
            </Space.Compact>
          </div>

          {/* 当前业务列表 */}
          <div>
            <h4 style={{ marginBottom: '8px' }}>当前业务</h4>
            <List
              size="small"
              bordered
              dataSource={businessOptions}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Popconfirm
                      title="确定删除该业务吗？"
                      onConfirm={() => handleDeleteOption(item)}
                      okText="确定"
                      cancelText="取消"
                      disabled={item.isDefault}
                    >
                      <Button
                        type="link"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        title={item.isDefault ? '默认选项不能删除' : '删除'}
                        disabled={item.isDefault}
                      />
                    </Popconfirm>,
                  ]}
                >
                  <span>
                    {item.optionValue}
                    {item.isDefault && (
                      <span style={{ marginLeft: 8, color: '#999', fontSize: '12px' }}>
                        (默认)
                      </span>
                    )}
                  </span>
                </List.Item>
              )}
              locale={{ emptyText: '暂无业务选项' }}
              style={{ maxHeight: '300px', overflowY: 'auto' }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  )
}

export default BusinessOptionsManager
