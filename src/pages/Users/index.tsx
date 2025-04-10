import { useState, useEffect } from 'react'
import { Table, Button, Input, Space, Modal, Form, Select, message, Tag, Switch } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { User, Role } from '../../types'
import { usePageStates, PageStatesStore } from '../../store/pageStates'

const Users = () => {
  // 使用 pageStates 存储来保持状态
  const getState = usePageStates((state: PageStatesStore) => state.getState);
  const setState = usePageStates((state: PageStatesStore) => state.setState);
  
  // 从 pageStates 恢复搜索参数
  const savedSearchText = getState('usersSearchText');
  const savedPagination = getState('usersPagination');
  
  const [form] = Form.useForm()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [_total] = useState(0)
  const [_current] = useState(savedPagination?.current || 1)
  const [pageSize] = useState(savedPagination?.pageSize || 10)
  const [_searchText] = useState(savedSearchText || '')
  const [modalVisible, setModalVisible] = useState(false)
  const [currentId, setCurrentId] = useState<number | null>(null)

  // 当搜索文本变化时，保存到 pageStates
  useEffect(() => {
    setState('usersSearchText', _searchText);
  }, [_searchText, setState]);

  // 当分页参数变化时，保存到 pageStates
  useEffect(() => {
    setState('usersPagination', { _current, pageSize });
  }, [_current, pageSize, setState]);

  // 模拟数据
  const mockUserData: User[] = [
    {
      id: 1,
      username: 'admin',
      password: 'admin',
      nickname: '管理员',
      email: 'admin@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg',
      phone: '13800138000',
      sex: 0,
      status: 1,
      remark: '系统管理员',
      roles: ['admin'],
      user_groups: ['admin'],
      user_permissions: ['all'],
      is_superuser: true,
      is_staff: true,
      is_active: true,
      is_expense_auditor: true,
      date_joined: new Date().toISOString(),
      first_name: 'Admin',
      last_name: 'User',
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    },
    {
      id: 2,
      username: 'editor',
      password: 'editor',
      nickname: '编辑',
      email: 'editor@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg',
      phone: '13800138001',
      sex: 0,
      status: 1,
      remark: '内容编辑',
      roles: ['editor'],
      user_groups: ['editor'],
      user_permissions: ['content:view', 'content:edit'],
      is_superuser: false,
      is_staff: true,
      is_active: true,
      is_expense_auditor: false,
      date_joined: new Date().toISOString(),
      first_name: 'Editor',
      last_name: 'User',
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    },
    {
      id: 3,
      username: 'user',
      password: 'user',
      nickname: '普通用户',
      email: 'user@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg',
      phone: '13800138002',
      sex: 0,
      status: 1,
      remark: '普通用户',
      roles: ['user'],
      user_groups: ['user'],
      user_permissions: ['content:view'],
      is_superuser: false,
      is_staff: false,
      is_active: true,
      is_expense_auditor: false,
      date_joined: new Date().toISOString(),
      first_name: 'Normal',
      last_name: 'User',
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    },
  ]

  // 模拟角色数据
  const mockRoleData: Role[] = [
    {
      id: 1,
      name: '管理员',
      code: 'admin',
      status: 1,
      remark: '系统管理员',
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    },
    {
      id: 2,
      name: '编辑',
      code: 'editor',
      status: 1,
      remark: '内容编辑',
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    },
    {
      id: 3,
      name: '用户',
      code: 'user',
      status: 1,
      remark: '普通用户',
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    },
  ]

  useEffect(() => {
    fetchRoles()
    fetchUsers()
  }, [_current, pageSize, _searchText])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      // 实际项目中这里应该使用 API 请求
      // const res = await getUserList({
      //   page: _current,
      //   pageSize,
      //   keyword: _searchText,
      // })
      // setUsers(res.items)
      // setTotal(res.total)

      // 使用模拟数据
      setUsers(mockUserData)
    } catch (error) {
      console.error('获取用户列表失败', error)
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      // 实际项目中这里应该使用 API 请求
      // const res = await getAllRoles()
      // setRoles(res)

      // 使用模拟数据
      setRoles(mockRoleData)
    } catch (error) {
      console.error('获取角色列表失败', error)
      message.error('获取角色列表失败')
    }
  }

  const handleAdd = () => {
    setCurrentId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: User) => {
    setCurrentId(record.id)
    form.setFieldsValue({
      ...record,
      roles: record.roles,
      user_groups: record.user_groups,
      user_permissions: record.user_permissions,
    })
    setModalVisible(true)
  }

  const handleDelete = async (_id: number) => {
    try {
      // 实际项目中这里应该使用 API 请求
      // await deleteUser(id)
      message.success('删除成功')
      fetchUsers()
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
        // 模拟更新用户
        // await updateUser(currentId, values)
        message.success('更新成功')
      } else {
        // 模拟创建用户
        // await createUser(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchUsers()
    } catch (error) {
      console.error('操作失败:', error)
      message.error('操作失败')
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'error'}>{status === 1 ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => (
        <Space>
          {roles.map(role => (
            <Tag key={role}>{role}</Tag>
          ))}
        </Space>
      ),
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
          placeholder="搜索用户"
          onSearch={value => console.log(value)}
          className="w-64"
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加用户
        </Button>
      </div>

      <Table columns={columns} dataSource={users} rowKey="id" loading={loading} />

      <Modal
        title={currentId ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 1,
            sex: 0,
            is_superuser: false,
            is_staff: false,
            is_active: true,
            is_expense_auditor: false,
          }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ required: true, message: '请输入手机号' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="sex" label="性别">
            <Select>
              <Select.Option value={0}>男</Select.Option>
              <Select.Option value={1}>女</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" defaultChecked />
          </Form.Item>

          <Form.Item name="roles" label="角色">
            <Select mode="multiple">
              {roles.map(role => (
                <Select.Option key={role.id} value={role.code}>
                  {role.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Users
