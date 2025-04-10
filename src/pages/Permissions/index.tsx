import { useState, useEffect } from 'react'
import { Table, Button, Input, Space, Modal, Form, message, Tag, Switch, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Permission, Role } from '../../types'
import { usePageStates, PageStatesStore } from '../../store/pageStates'

const Permissions = () => {
  // 使用 pageStates 存储来保持状态
  const getState = usePageStates((state: PageStatesStore) => state.getState);
  const setState = usePageStates((state: PageStatesStore) => state.setState);
  
  // 从 pageStates 恢复搜索参数
  const savedSearchText = getState('permissionsSearchText');
  
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [searchText, setSearchText] = useState(savedSearchText || '')
  const [form] = Form.useForm()
  
  // 当搜索文本变化时，保存到 pageStates
  useEffect(() => {
    setState('permissionsSearchText', searchText);
  }, [searchText, setState]);

  useEffect(() => {
    fetchPermissions()
    fetchRoles()
  }, [])

  const fetchPermissions = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      const mockPermissions: Permission[] = [
        {
          id: 1,
          role_name: '管理员',
          page_name: '用户管理',
          permission_name: 'user:view',
          permission_value: true,
          description: '查看用户列表和详情',
          role_id: 1,
        },
        {
          id: 2,
          role_name: '管理员',
          page_name: '用户管理',
          permission_name: 'user:edit',
          permission_value: true,
          description: '编辑用户信息',
          role_id: 1,
        },
      ]
      setPermissions(mockPermissions)
    } catch (error) {
      console.error('获取权限列表失败:', error)
      message.error('获取权限列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      // 模拟API调用
      const mockRoles: Role[] = [
        {
          id: 1,
          name: '管理员',
          code: 'admin',
          status: 1,
          remark: '系统管理员',
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),
        },
      ]
      setRoles(mockRoles)
    } catch (error) {
      console.error('获取角色列表失败:', error)
      message.error('获取角色列表失败')
    }
  }

  const handleAdd = () => {
    setCurrentId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Permission) => {
    setCurrentId(record.id)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (_id: number) => {
    try {
      // 模拟API调用
      // await deletePermission(id)
      message.success('删除成功')
      fetchPermissions()
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  const handleCancel = () => {
    setModalVisible(false)
    form.resetFields()
  }

  const handleOk = async () => {
    try {
      await form.validateFields()
      if (currentId) {
        // 模拟更新权限
        // await updatePermission(currentId, values)
        message.success('更新成功')
      } else {
        // 模拟创建权限
        // await createPermission(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchPermissions()
    } catch (error) {
      console.error('操作失败:', error)
      message.error('操作失败')
    }
  }

  const columns: ColumnsType<Permission> = [
    {
      title: '角色名称',
      dataIndex: 'role_name',
      key: 'role_name',
    },
    {
      title: '页面名称',
      dataIndex: 'page_name',
      key: 'page_name',
    },
    {
      title: '权限名称',
      dataIndex: 'permission_name',
      key: 'permission_name',
    },
    {
      title: '权限值',
      dataIndex: 'permission_value',
      key: 'permission_value',
      render: (value: boolean) => (
        <Tag color={value ? 'success' : 'error'}>{value ? '是' : '否'}</Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
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
          placeholder="搜索权限"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onSearch={value => console.log(value)}
          className="w-64"
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加权限
        </Button>
      </div>

      <Table columns={columns} dataSource={permissions} rowKey="id" loading={loading} />

      <Modal
        title={currentId ? '编辑权限' : '添加权限'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            permission_value: true,
          }}
        >
          <Form.Item
            name="role_id"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              {roles.map(role => (
                <Select.Option key={role.id} value={role.id}>
                  {role.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="page_name"
            label="页面名称"
            rules={[{ required: true, message: '请输入页面名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="permission_name"
            label="权限名称"
            rules={[{ required: true, message: '请输入权限名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="permission_value" label="权限值">
            <Switch checkedChildren="是" unCheckedChildren="否" defaultChecked />
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入描述' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Permissions
