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
  Cascader,
} from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { User, Department, ApiResponse, PaginatedResponse } from '../../types'
import { getUserList, createUser, updateUserById, deleteUser, searchUsers } from '../../api/user'
import { getDepartmentList, getDepartmentTree } from '../../api/department'
import { getRoleList } from '../../api/roles'
import { useDebouncedValue } from '../../hooks/useDebounce'
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
  dept_name?: string
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

// 定义级联选择器选项类型
interface CascaderOption {
  value: number | null
  label: string
  disabled?: boolean
  children?: CascaderOption[]
}

const Users = () => {
  const [users, setUsers] = useState<ApiUser[]>([])
  const [roles, setRoles] = useState<{ id: number; name: string; code: string }[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [departmentTree, setDepartmentTree] = useState<CascaderOption[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [keyword, setKeyword] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  // 使用防抖值处理搜索
  const debouncedSearchText = useDebouncedValue(searchText, 500)

  // 创建角色代码到名称的映射
  const roleCodeToName = useMemo(() => {
    const map: Record<string, string> = {}
    roles.forEach(role => {
      map[role.code] = role.name
    })
    return map
  }, [roles])

  const transformToCascaderOptions = (departments: any[]): CascaderOption[] => {
    const rootOption: CascaderOption = {
      value: null,
      label: '无上级部门',
    }

    const transform = (depts: any[]): CascaderOption[] => {
      return depts.map(dept => ({
        value: dept.id,
        label: dept.name,
        children: dept.children ? transform(dept.children) : undefined,
      }))
    }

    return [rootOption, ...transform(departments)]
  }

  // 添加获取部门路径的辅助函数
  const getDepartmentPath = (deptId: number | undefined, departments: any[]): number[] => {
    const path: number[] = []

    const findPath = (depts: any[], targetId: number): boolean => {
      for (const dept of depts) {
        if (dept.id === targetId) {
          path.push(dept.id)
          return true
        }
        if (dept.children && dept.children.length > 0) {
          path.push(dept.id)
          if (findPath(dept.children, targetId)) {
            return true
          }
          path.pop()
        }
      }
      return false
    }

    if (deptId) {
      findPath(departments, deptId)
    }

    return path
  }

  useEffect(() => {
    fetchUsers()
    fetchRoles()
    fetchDepartmentTree()
  }, [pagination.current, pagination.pageSize, debouncedSearchText])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      let response

      if (debouncedSearchText) {
        // 使用搜索接口
        response = await searchUsers(
          debouncedSearchText,
          pagination.current as number,
          pagination.pageSize as number
        )
      } else {
        // 使用常规列表接口
        response = await getUserList(
          pagination.current as number,
          pagination.pageSize as number,
          keyword
        )
      }

      if (response) {
        const apiResponse = response as unknown as ApiData<UserResponse>
        if (apiResponse.code === 0 && apiResponse.data) {
          // 获取部门树数据
          const deptResponse = await getDepartmentTree()
          const deptApiResponse = deptResponse as unknown as ApiData<any[]>

          // 为每个用户添加部门名称
          const usersWithDeptName = apiResponse.data.items.map(user => {
            if (user.dept_id) {
              // 获取部门路径
              const deptPath = getDepartmentPath(user.dept_id, deptApiResponse.data)
              // 获取部门名称
              const deptNames = deptPath
                .map(id => {
                  const findDeptName = (depts: any[]): string | undefined => {
                    for (const dept of depts) {
                      if (dept.id === id) {
                        return dept.name
                      }
                      if (dept.children) {
                        const name = findDeptName(dept.children)
                        if (name) return name
                      }
                    }
                    return undefined
                  }
                  return findDeptName(deptApiResponse.data)
                })
                .filter(Boolean)

              return {
                ...user,
                dept_name: deptNames.join(' / '),
              }
            }
            return user
          })

          setUsers(usersWithDeptName)
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
      const apiResponse = response as unknown as ApiData<
        { id: number; name: string; code: string }[]
      >
      if (apiResponse.code === 0) {
        setRoles(apiResponse.data)
      }
    } catch (error) {
      console.error('获取角色列表失败:', error)
      message.error('获取角色列表失败')
    }
  }

  const fetchDepartmentTree = async () => {
    try {
      const response = await getDepartmentTree()
      const apiResponse = response as unknown as ApiData<any[]>
      if (apiResponse.code === 0) {
        const options = transformToCascaderOptions(apiResponse.data)
        setDepartmentTree(options)
      }
    } catch (error) {
      console.error('获取部门树失败:', error)
      message.error('获取部门树失败')
    }
  }

  const handleAdd = () => {
    setCurrentId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = async (record: ApiUser) => {
    setCurrentId(record.id)

    try {
      // 获取最新的部门树数据
      const response = await getDepartmentTree()
      const apiResponse = response as unknown as ApiData<any[]>
      if (apiResponse.code === 0) {
        // 获取部门路径
        const deptPath = getDepartmentPath(record.dept_id, apiResponse.data)

        form.setFieldsValue({
          username: record.username,
          email: record.email,
          phone: record.phone,
          isActive: record.isActive,
          dept_id: deptPath, // 设置完整的部门路径
          roles: record.roles,
        })
        setModalVisible(true)
      }
    } catch (error) {
      console.error('获取部门树失败:', error)
      message.error('获取部门树失败')
    }
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

      // 处理部门ID，从级联选择器数组中获取最后一个值
      if (values.dept_id) {
        values.dept_id = values.dept_id[values.dept_id.length - 1]
      }

      // 如果是编辑模式并且没有输入新密码，则不传递密码字段
      if (currentId && !values.password) {
        delete values.password
      }

      if (currentId) {
        const response = await updateUserById(currentId, values)
        const apiResponse = response as unknown as ApiData<any>
        if (apiResponse.code === 0) {
          message.success('更新用户成功')
          setModalVisible(false)
          fetchUsers()
        } else {
          message.error(apiResponse.message || '更新用户失败')
        }
      } else {
        try {
          const response = await createUser(values)
          const apiResponse = response as unknown as ApiData<any>
          if (apiResponse.code === 0) {
            message.success('添加用户成功')
            setModalVisible(false)
            fetchUsers()
          } else {
            message.error(apiResponse.message || '添加用户失败')
          }
        } catch (error: any) {
          // 错误已经在全局拦截器中处理，这里只是为了捕获错误
          console.error('添加用户失败:', error)
        }
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    })
  }

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
    // 重置到第一页
    setPagination(prev => ({
      ...prev,
      current: 1,
    }))
  }

  // 处理重置
  const handleReset = () => {
    setSearchText('')
    setPagination(prev => ({
      ...prev,
      current: 1,
    }))
  }

  const columns: ColumnsType<ApiUser> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 70,
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>{isActive ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      width: 160,
      render: (roles: string[]) => (
        <Space>
          {roles &&
            roles.map(roleCode => (
              <Tag key={roleCode} color="blue">
                {roleCodeToName[roleCode] || roleCode}
              </Tag>
            ))}
        </Space>
      ),
    },
    {
      title: '部门',
      dataIndex: 'dept_name',
      key: 'dept_name',
      width: 180,
      render: (dept_name: string) => dept_name || '无部门',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (createdAt: string) => dayjs(createdAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (updatedAt: string) => dayjs(updatedAt).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 180,
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
    <div className="p-6">
      <div className="mb-4 flex justify-between items-center">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加用户
          </Button>
          <Input
            placeholder="搜索用户名"
            value={searchText}
            onChange={e => handleSearch(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        scroll={{ x: 'max-content' }}
        pagination={{
          ...pagination,
          position: ['bottomCenter'],
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: total => `共 ${total} 条数据`,
        }}
        onChange={handleTableChange}
        bordered
      />

      <Modal
        title={currentId ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input />
          </Form.Item>

          {!currentId && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码长度不能少于6位' },
              ]}
            >
              <Input.Password placeholder="请输入至少6位密码" />
            </Form.Item>
          )}

          {currentId && (
            <Form.Item
              name="password"
              label="密码"
              rules={[{ min: 6, message: '密码长度不能少于6位' }]}
              help="如不修改密码请留空"
            >
              <Input.Password placeholder="如需修改密码，请输入至少6位新密码" />
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
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="dept_id"
            label="所属部门"
            rules={[{ required: true, message: '请选择所属部门' }]}
          >
            <Cascader
              options={departmentTree}
              placeholder="请选择部门"
              changeOnSelect
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="roles" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select mode="multiple" placeholder="请选择角色" style={{ width: '100%' }}>
              {roles.map(role => (
                <Select.Option key={role.code} value={role.code}>
                  {role.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="isActive" label="状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Users
