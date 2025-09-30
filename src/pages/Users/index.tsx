import React, { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Space,
  Tag,
  Popconfirm,
  Cascader,
} from 'antd'
import type { TablePaginationConfig } from 'antd/es/table'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons'
import { useUserList, useDepartmentTree, useRoleList, useUserOperations } from '../../hooks/useUser'
import { useDebouncedValue } from '../../hooks/useDebounce'

// 适配后端API返回的用户数据结构
interface ApiUser {
  id: number
  username: string
  password: string
  isActive: boolean
  phone: string
  idCardNumber?: string
  roles: string[]
  dept_id?: number
  dept_name?: string
  createdAt: string
  updatedAt: string
}

// 定义级联选择器选项类型
interface CascaderOption {
  value: number | null
  label: string
  disabled?: boolean
  children?: CascaderOption[]
}

const Users = () => {
  const [modalVisible, setModalVisible] = useState<boolean>(false)
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [searchText, setSearchText] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  
  // 添加提交状态
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 使用防抖值处理搜索
  const debouncedSearchText = useDebouncedValue(searchText, 500)

  // 使用hooks获取数据
  const {
    users,
    loading,
    pagination: userPagination,
  } = useUserList({
    page: currentPage,
    pageSize: pageSize,
    searchText: debouncedSearchText,
    role: selectedRole,
  })

  const { departmentTree: rawDepartmentTree } = useDepartmentTree()
  const { roles } = useRoleList()
  const { createUser, updateUser, deleteUser, resetSalaryPassword } = useUserOperations()

  // 转换部门树为级联选择器格式的函数
  const transformToCascaderOptions = (departments: any[]): CascaderOption[] => {
    const transform = (depts: any[]): CascaderOption[] => {
      return depts.map(dept => ({
        value: dept.id,
        label: dept.name,
        children: dept.children ? transform(dept.children) : undefined,
      }))
    }

    return transform(departments)
  }

  // 转换部门树为级联选择器格式
  const departmentTree = useMemo(() => {
    return transformToCascaderOptions(rawDepartmentTree)
  }, [rawDepartmentTree])

  // 创建角色代码到名称的映射
  const roleCodeToName = useMemo(() => {
    const map: Record<string, string> = {}
    roles.forEach(role => {
      map[role.code] = role.name
    })
    return map
  }, [roles])

  // 添加获取最终部门名称的辅助函数
  const getDepartmentFinalName = (deptId: number | undefined, departments: any[]): string => {
    const findDeptName = (depts: any[], targetId: number): string | null => {
      for (const dept of depts) {
        if (dept.id === targetId) {
          return dept.name
        }
        if (dept.children && dept.children.length > 0) {
          const result = findDeptName(dept.children, targetId)
          if (result) {
            return result
          }
        }
      }
      return null
    }

    if (deptId) {
      return findDeptName(departments, deptId) || ''
    }

    return ''
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

  const handleAdd = () => {
    setCurrentId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = async (record: ApiUser) => {
    setCurrentId(record.id)

    // 获取部门路径
    const deptPath = getDepartmentPath(record.dept_id, rawDepartmentTree)

    form.setFieldsValue({
      username: record.username,
      idCardNumber: record.idCardNumber,
      phone: record.phone,
      isActive: record.isActive,
      dept_id: deptPath, // 设置完整的部门路径
      roles: record.roles,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    await deleteUser(id)
  }

  const handleResetSalaryPassword = async (id: number) => {
    await resetSalaryPassword(id)
  }

  const handleCancel = () => {
    setModalVisible(false)
    form.resetFields()
  }

  const handleOk = async () => {
    // 防止重复提交
    if (isSubmitting) {
      return
    }

    try {
      setIsSubmitting(true)
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
        await updateUser(currentId, values)
        setModalVisible(false)
      } else {
        await createUser(values)
        setModalVisible(false)
      }
    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTableChange = (newPagination: TablePaginationConfig) => {
    if (newPagination.current) {
      setCurrentPage(newPagination.current)
    }
    if (newPagination.pageSize) {
      setPageSize(newPagination.pageSize)
      // 当改变页面大小时，重置到第一页
      if (newPagination.pageSize !== pageSize) {
        setCurrentPage(1)
      }
    }
  }

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value)
    // 重置到第一页
    setCurrentPage(1)
  }

  // 处理角色筛选
  const handleRoleChange = (value: string) => {
    setSelectedRole(value)
    // 重置到第一页
    setCurrentPage(1)
  }

  // 处理重置
  const handleReset = () => {
    setSearchText('')
    setSelectedRole('')
    setCurrentPage(1)
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
      title: '身份证号',
      dataIndex: 'idCardNumber',
      key: 'idCardNumber',
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
      dataIndex: 'dept_id',
      key: 'dept_id',
      width: 180,
      render: (_: unknown, record: ApiUser) => {
        const deptName = getDepartmentFinalName(record.dept_id, rawDepartmentTree)
        return deptName || '无部门'
      },
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
      width: 260,
      render: (_: unknown, record: ApiUser) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定要重置此用户的薪资密码吗?"
            onConfirm={() => handleResetSalaryPassword(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" icon={<KeyOutlined />}>
              重置薪资密码
            </Button>
          </Popconfirm>
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
          <Select
            placeholder="选择角色"
            value={selectedRole || undefined}
            onChange={handleRoleChange}
            style={{ width: 150 }}
            allowClear
          >
            {roles.map(role => (
              <Select.Option key={role.code} value={role.code}>
                {role.name}
              </Select.Option>
            ))}
          </Select>
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
          ...userPagination,
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
        confirmLoading={isSubmitting}
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
            name="idCardNumber"
            label="身份证号"
            rules={[
              { required: false, message: '请输入身份证号' },
              {
                pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
                message: '请输入有效的身份证号',
              },
            ]}
          >
            <Input placeholder="请输入身份证号" />
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
