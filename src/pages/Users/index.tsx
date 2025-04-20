import React, { useState, useEffect, useMemo } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  message,
  Tag,
  Popconfirm,
} from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { User, Department, ApiResponse, PaginatedResponse } from '../../types'
import { getUserList, createUser, updateUserById, deleteUser } from '../../api/user'
import { getDepartmentList } from '../../api/department'
import { getRoleList } from '../../api/roles'
import dayjs from 'dayjs'

// 适配后端API返回的用户数据结构
interface ApiUser {
  id: number
  username: string
  password: string
  isActive: boolean
  phone: string
  email: string
  roles: string[]
  dept_id?: number
  createdAt: string
  updatedAt: string
}

interface UserResponse {
  items: ApiUser[]
  meta: {
    total: number
    page: number
    limit: number
  }
}

interface ApiData<T> {
  code: number
  message: string
  data: T
  timestamp?: number
}

const Users = () => {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [roles, setRoles] = useState<{id: number, name: string, code: string}[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [keyword, setKeyword] = useState<string>('')
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  // 创建角色代码到名称的映射
  const roleCodeToName = useMemo(() => {
    const map: Record<string, string> = {};
    roles.forEach(role => {
      map[role.code] = role.name;
    });
    return map;
  }, [roles]);

  useEffect(() => {
    fetchUsers()
    fetchRoles()
    fetchDepartments()
  }, [pagination.current, pagination.pageSize, keyword])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await getUserList(
        pagination.current as number, 
        pagination.pageSize as number,
        keyword
      )
      if (response) {
        const apiResponse = response as unknown as ApiData<UserResponse>
        if (apiResponse.code === 0 && apiResponse.data) {
          setUsers(apiResponse.data.items)
          setPagination({
            ...pagination,
            total: apiResponse.data.meta.total,
          })
        }
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await getRoleList()
      const apiResponse = response as unknown as ApiData<{id: number, name: string, code: string}[]>
      if (apiResponse.code === 0) {
        setRoles(apiResponse.data)
      }
    } catch (error) {
      console.error('获取角色列表失败:', error)
      message.error('获取角色列表失败')
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await getDepartmentList()
      const apiResponse = response as unknown as ApiData<Department[]>
      if (apiResponse.code === 0) {
        setDepartments(apiResponse.data)
      }
    } catch (error) {
      console.error('获取部门列表失败:', error)
      message.error('获取部门列表失败')
    }
  }

  const handleAdd = () => {
    setCurrentId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: ApiUser) => {
    setCurrentId(record.id)
    form.setFieldsValue({
      username: record.username,
      email: record.email,
      phone: record.phone,
      isActive: record.isActive,
      dept_id: record.dept_id,
      roles: record.roles
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await deleteUser(id)
      const apiResponse = response as unknown as ApiData<any>
      if (apiResponse.code === 0) {
        message.success('删除用户成功')
        fetchUsers()
      } else {
        message.error(apiResponse.message || '删除用户失败')
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      message.error('删除用户失败')
    }
  }

  const handleCancel = () => {
    setModalVisible(false)
    form.resetFields()
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      
      // 如果是编辑模式并且没有输入新密码，则不传递密码字段
      if (currentId && !values.password) {
        delete values.password
      }
      
      if (currentId) {
        const response = await updateUserById(currentId, values)
        const apiResponse = response as unknown as ApiData<any>
        if (apiResponse.code === 0) {
          message.success('更新用户成功')
        } else {
          message.error(apiResponse.message || '更新用户失败')
        }
      } else {
        const response = await createUser(values)
        const apiResponse = response as unknown as ApiData<any>
        if (apiResponse.code === 0) {
          message.success('添加用户成功')
        } else {
          message.error(apiResponse.message || '添加用户失败')
        }
      }

      setModalVisible(false)
      form.resetFields()
      fetchUsers()
    } catch (error) {
      console.error('保存用户失败:', error)
      message.error('保存用户失败')
    }
  }

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    })
  }

  const columns: ColumnsType<ApiUser> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>{isActive ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => (
        <Space>
          {roles && roles.map(roleCode => (
            <Tag key={roleCode} color="blue">
              {roleCodeToName[roleCode] || roleCode}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: string) => dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (updatedAt: string) => dayjs(updatedAt).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 150,
      render: (_: unknown, record: ApiUser) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此用户吗?"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between mb-4">
        <Input.Search
          placeholder="搜索用户名或邮箱"
          onSearch={value => {
            setKeyword(value)
            setPagination({ ...pagination, current: 1 })
          }}
          className="w-64"
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加用户
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="id" 
        loading={loading} 
        scroll={{ x: 1300 }}
        pagination={{
          ...pagination,
          position: ['bottomCenter'],
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条数据`
        }}
        onChange={handleTableChange}
      />

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
            isActive: true,
          }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>

          {!currentId ? (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码长度不能小于6位' }]}
            >
              <Input.Password />
            </Form.Item>
          ) : (
            <Form.Item
              name="password"
              label="新密码"
              extra="如不修改密码，请留空"
              rules={[{ min: 6, message: '密码长度不能小于6位' }]}
            >
              <Input.Password placeholder="如不修改密码，请留空" />
            </Form.Item>
          )}

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

          <Form.Item name="isActive" label="状态" valuePropName="checked">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
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

          <Form.Item
            name="dept_id"
            label="部门"
          >
            <Select placeholder="请选择部门">
              {departments.map(dept => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Users

