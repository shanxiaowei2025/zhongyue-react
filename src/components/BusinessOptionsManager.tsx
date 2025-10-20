import React, { useState, useEffect } from 'react'
import { Select, Button, Input, Space, message, Modal, List, Popconfirm } from 'antd'
import { PlusOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons'
import { triggerBusinessOptionsUpdate } from '../utils/businessOptions'
import { useAuthStore } from '../store/auth'
import { isAdminUser } from '../utils/permissionUtils'

interface BusinessOptionsManagerProps {
  value?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  storageKey: string // 用于localStorage的唯一键
  defaultOptions?: { value: string; label: string }[] // 默认选项
}

const BusinessOptionsManager: React.FC<BusinessOptionsManagerProps> = ({
  value,
  onChange,
  placeholder = '请选择或输入业务',
  storageKey,
  defaultOptions = [],
}) => {
  // 获取当前用户信息和权限
  const { user } = useAuthStore()
  const isAdmin = isAdminUser(user)

  // 从localStorage加载自定义选项
  const loadCustomOptions = (): string[] => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('加载自定义选项失败:', error)
      return []
    }
  }

  // 保存自定义选项到localStorage
  const saveCustomOptions = (options: string[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(options))
      // 触发业务选项更新事件，通知其他组件更新
      triggerBusinessOptionsUpdate()
    } catch (error) {
      console.error('保存自定义选项失败:', error)
    }
  }

  const [customOptions, setCustomOptions] = useState<string[]>(loadCustomOptions())
  const [manageModalVisible, setManageModalVisible] = useState(false)
  const [newOptionInput, setNewOptionInput] = useState('')

  // 合并默认选项和自定义选项
  const allOptions = [
    ...defaultOptions,
    ...customOptions.map(opt => ({ value: opt, label: opt })),
  ]

  // 添加新选项（添加到默认选项和自定义选项的合并列表）
  const handleAddOption = () => {
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

    // 检查是否已存在于默认选项
    const existsInDefault = defaultOptions.some(opt => opt.value === trimmedInput)
    if (existsInDefault) {
      message.warning('该业务已存在于默认选项中')
      return
    }

    // 检查是否已存在于自定义选项
    const existsInCustom = customOptions.includes(trimmedInput)
    if (existsInCustom) {
      message.warning('该业务已存在')
      return
    }

    const updatedCustomOptions = [...customOptions, trimmedInput]
    setCustomOptions(updatedCustomOptions)
    saveCustomOptions(updatedCustomOptions)
    setNewOptionInput('')
    message.success('添加成功')
  }

  // 删除默认选项
  const handleDeleteDefaultOption = (optionValue: string) => {
    // 这个函数现在也可以删除默认选项了
    message.error('暂不支持删除此业务')
  }

  // 删除自定义选项
  const handleDeleteCustomOption = (optionValue: string) => {
    // 权限检查：只有管理员才能删除业务选项
    if (!isAdmin) {
      message.error('只有管理员才能删除业务选项')
      return
    }

    const updatedCustomOptions = customOptions.filter(opt => opt !== optionValue)
    setCustomOptions(updatedCustomOptions)
    saveCustomOptions(updatedCustomOptions)
    message.success('删除成功')
  }

  // 更新localStorage中的自定义选项
  useEffect(() => {
    const stored = loadCustomOptions()
    if (JSON.stringify(stored) !== JSON.stringify(customOptions)) {
      setCustomOptions(stored)
    }
  }, [storageKey])

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
      <Select
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        mode="multiple"
        style={{ flex: 1 }}
        options={allOptions}
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

          {/* 当前业务列表 - 合并默认选项和自定义选项 */}
          <div>
            <h4 style={{ marginBottom: '8px' }}>当前业务</h4>
            <List
              size="small"
              bordered
              dataSource={[
                ...defaultOptions.map(opt => ({ value: opt.value, label: opt.label, isDefault: true })),
                ...customOptions.map(opt => ({ value: opt, label: opt, isDefault: false })),
              ]}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Popconfirm
                      title="确定删除该业务吗？"
                      onConfirm={() =>
                        item.isDefault
                          ? handleDeleteDefaultOption(item.value)
                          : handleDeleteCustomOption(item.value)
                      }
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="link"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        title="删除"
                      />
                    </Popconfirm>,
                  ]}
                >
                  <span>{item.label}</span>
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

