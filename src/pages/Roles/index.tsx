import { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, message, Tree, Tag, Switch } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Role, Permission } from '../../types'
import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  assignRolePermissions,
} from '../../api/auth'
import { getAllPermissions } from '../../api/auth'

const Roles = () => {
  const [form] = Form.useForm()
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false)
  const [currentRole, setCurrentRole] = useState<Role | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const [isEdit, setIsEdit] = useState(false)
  const [currentId, setCurrentId] = useState<number | null>(null)

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
  ]

  // 模拟权限数据
  const mockPermissionData: Permission[] = [
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
    {
      id: 3,
      role_name: '编辑',
      page_name: '内容管理',
      permission_name: 'content:view',
      permission_value: true,
      description: '查看内容列表和详情',
      role_id: 2,
    },
    {
      id: 4,
      role_name: '编辑',
      page_name: '内容管理',
      permission_name: 'content:edit',
      permission_value: true,
      description: '编辑内容信息',
      role_id: 2,
    },
    {
      id: 5,
      role_name: '用户',
      page_name: '内容管理',
      permission_name: 'content:view',
      permission_value: true,
      description: '查看内容列表和详情',
      role_id: 3,
    },
  ]

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  const fetchRoles = async () => {
    setLoading(true)
    try {
      // 实际项目中这里应该使用 API 请求
      // const res = await getAllRoles()
      // setRoles(res)

      // 使用模拟数据
      setRoles(mockRoleData)
    } catch (error) {
      console.error('获取角色列表失败', error)
      message.error('获取角色列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      // 实际项目中这里应该使用 API 请求
      // const res = await getAllPermissions()
      // setPermissions(res)

      // 使用模拟数据
      setPermissions(mockPermissionData)
    } catch (error) {
      console.error('获取权限列表失败', error)
      message.error('获取权限列表失败')
    }
  }

  const handleAdd = () => {
    setCurrentId(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (record: Role) => {
    setCurrentId(record.id)
    form.setFieldsValue(record)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    try {
      // 实际项目中这里应该使用 API 请求
      // await deleteRole(id)
      message.success('删除成功')
      fetchRoles()
    } catch (error) {
      console.error('删除失败:', error)
      message.error('删除失败')
    }
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    form.resetFields()
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      if (currentId) {
        // 更新角色
        // 实际项目中这里应该使用 API 请求
        // await updateRole(currentId, values)
        setRoles(roles.map(role => (role.id === currentId ? { ...role, ...values } : role)))
        message.success('更新成功')
      } else {
        // 创建角色
        // 实际项目中这里应该使用 API 请求
        // const res = await createRole(values)
        const newRole: Role = {
          id: Date.now(),
          ...values,
          status: 1,
          remark: '',
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),
        }
        setRoles([...roles, newRole])
        message.success('创建成功')
      }
      setIsModalOpen(false)
      fetchRoles()
    } catch (error) {
      console.error('操作失败:', error)
      message.error('操作失败')
    }
  }

  const handleAssignPermissions = (record: Role) => {
    setCurrentRole(record)
    // 获取当前角色对应的权限ID列表
    const rolePermissions = permissions.filter(p => p.role_id === record.id).map(p => p.id)
    setSelectedPermissions(rolePermissions)
    setIsPermissionModalOpen(true)
  }

  const handlePermissionCancel = () => {
    setIsPermissionModalOpen(false)
    setSelectedPermissions([])
    setCurrentRole(null)
  }

  const handlePermissionOk = async () => {
    if (!currentRole) return

    try {
      // 实际项目中这里应该使用 API 请求
      // await assignRolePermissions(currentRole.id, selectedPermissions)

      // 更新角色权限
      const updatedRoles = roles.map(role => {
        if (role.id === currentRole.id) {
          const updatedPermissions = permissions.filter(p => selectedPermissions.includes(p.id))
          return { ...role, permissions: updatedPermissions }
        }
        return role
      })

      setRoles(updatedRoles)
      message.success('权限分配成功')
      setIsPermissionModalOpen(false)
      setSelectedPermissions([])
      setCurrentRole(null)
    } catch (error) {
      console.error('分配权限失败', error)
      message.error('分配权限失败')
    }
  }

  // 转换权限数据为 Tree 组件所需格式
  const permissionTreeData = [
    {
      title: '所有权限',
      key: 'all',
      children: permissions.map(p => ({
        title: p.permission_name,
        key: p.id.toString(),
        isLeaf: true,
      })),
    },
  ]

  const columns: ColumnsType<Role> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '角色代码',
      dataIndex: 'code',
      key: 'code',
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
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
    },
    {
      title: '更新时间',
      dataIndex: 'update_time',
      key: 'update_time',
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
          placeholder="搜索角色"
          onSearch={value => console.log(value)}
          className="w-64"
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加角色
        </Button>
      </div>

      <Table columns={columns} dataSource={roles} rowKey="id" loading={loading} />

      <Modal
        title={currentId ? '编辑角色' : '添加角色'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 1,
          }}
        >
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="code"
            label="角色代码"
            rules={[{ required: true, message: '请输入角色代码' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Switch checkedChildren="启用" unCheckedChildren="禁用" defaultChecked />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 权限分配弹窗 */}
      <Modal
        title="分配权限"
        open={isPermissionModalOpen}
        onOk={handlePermissionOk}
        onCancel={handlePermissionCancel}
        width={600}
      >
        <p className="mb-4">当前角色：{currentRole?.name}</p>
        <Tree
          checkable
          defaultExpandAll
          treeData={permissionTreeData}
          checkedKeys={selectedPermissions}
          onCheck={checked => {
            setSelectedPermissions(checked as number[])
          }}
        />
      </Modal>
    </div>
  )
}

export default Roles
