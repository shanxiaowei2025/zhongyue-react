import { useState, useEffect } from 'react'
import { Table, Button, Input, Space, Modal, Form, Select, message, Tag, Card, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Role } from '../../types'
import { getRoleList, createRole, updateRole, deleteRole } from '../../api/roles'
import dayjs from 'dayjs'

const { Option } = Select
const { Search } = Input

const Roles = () => {
  const [form] = Form.useForm()
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    fetchRoles()
  }, [])

  // 获取角色列表
  const fetchRoles = async () => {
    setLoading(true)
    try {
      const res = await getRoleList()
      setRoles(res.data || [])
    } catch (error) {
      console.error('获取角色列表失败', error)
      message.error('获取角色列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 添加角色
  const handleAdd = () => {
    setCurrentId(null)
    form.resetFields()
    setModalVisible(true)
  }

  // 编辑角色
  const handleEdit = (record: Role) => {
    setCurrentId(record.id)
    form.setFieldsValue({
      ...record,
    })
    setModalVisible(true)
  }

  // 删除角色
  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个角色吗？这可能会影响关联的用户。',
      onOk: async () => {
        try {
          await deleteRole(id)
          message.success('删除成功')
          fetchRoles()
        } catch (error) {
          console.error('删除失败:', error)
          message.error('删除失败')
        }
      },
    })
  }

  // 关闭角色表单弹窗
  const handleCancel = () => {
    setModalVisible(false)
    form.resetFields()
  }

  // 保存角色表单
  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      if (currentId) {
        await updateRole(currentId, values)
        message.success('更新成功')
      } else {
        await createRole(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchRoles()
    } catch (error) {
      console.error('操作失败:', error)
      message.error('操作失败')
    }
  }

  // 重置搜索
  const handleReset = () => {
    setSearchText('')
    fetchRoles()
  }

  // 格式化时间显示
  const formatTime = (timeString: string) => {
    return dayjs(timeString).format('YYYY-MM-DD HH:mm:ss')
  }

  // 统计权限数量
  const countPermissions = (role: Role) => {
    if (!role.permissions) return 0
    return role.permissions.length
  }

  // 表格列定义
  const columns: ColumnsType<Role> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '角色编码',
      dataIndex: 'code',
      key: 'code',
      width: 180,
    },
    {
      title: '权限数量',
      key: 'permissionCount',
      width: 100,
      render: (_, record) => {
        const count = countPermissions(record)
        return (
          <Tooltip title={`该角色拥有 ${count} 个权限`}>
            <Tag color={count > 0 ? 'blue' : 'gray'}>{count}</Tag>
          </Tooltip>
        )
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: status => (
        <Tag color={status === 1 ? 'green' : 'red'}>{status === 1 ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      width: 180,
      render: time => formatTime(time),
    },
    {
      title: '更新时间',
      dataIndex: 'update_time',
      key: 'update_time',
      width: 180,
      render: time => formatTime(time),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            disabled={record.code === 'super_admin'} // 禁止删除超级管理员
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  // 排序和过滤查询结果
  const filteredRoles = roles
    .filter(role =>
      searchText
        ? role.name.toLowerCase().includes(searchText.toLowerCase()) ||
          role.code.toLowerCase().includes(searchText.toLowerCase()) ||
          (role.remark && role.remark.toLowerCase().includes(searchText.toLowerCase()))
        : true
    )
    .sort((a, b) => a.id - b.id) // 按ID升序排序

  return (
    <div>
      <Card bordered={false}>
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增角色
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchRoles}>
              刷新
            </Button>
            <Search
              placeholder="输入角色名称、编码或备注搜索"
              allowClear
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 300 }}
            />
            {searchText && (
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            )}
          </Space>
        </div>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredRoles}
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: total => `共 ${total} 条`,
            position: ['bottomCenter'],
          }}
        />

        {/* 角色表单弹窗 */}
        <Modal
          title={currentId ? '编辑角色' : '新增角色'}
          open={modalVisible}
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
              <Input placeholder="请输入角色名称" />
            </Form.Item>

            <Form.Item
              name="code"
              label="角色编码"
              rules={[{ required: true, message: '请输入角色编码' }]}
            >
              <Input placeholder="请输入角色编码" />
            </Form.Item>

            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                <Option value={1}>启用</Option>
                <Option value={0}>禁用</Option>
              </Select>
            </Form.Item>

            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={4} placeholder="请输入备注" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  )
}

export default Roles
