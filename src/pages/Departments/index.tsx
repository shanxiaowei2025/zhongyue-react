import { useState, useEffect } from 'react'
import { Table, Button, Input, Space, Modal, Form, Select, message, Tag, Tree, Card, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Department, DepartmentTreeNode } from '../../types'
import { getDepartmentList, getDepartmentTree, createDepartment, updateDepartment, deleteDepartment, bulkDeleteDepartments } from '../../api/department'

const { Option } = Select
const { Search } = Input

const Departments = () => {
  const [form] = Form.useForm()
  const [departments, setDepartments] = useState<Department[]>([])
  const [treeData, setTreeData] = useState<DepartmentTreeNode[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [searchText, setSearchText] = useState('')
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])

  useEffect(() => {
    fetchDepartments()
    fetchDepartmentTree()
  }, [])

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const res = await getDepartmentList({ keyword: searchText })
      setDepartments(res.data || [])
    } catch (error) {
      console.error('获取部门列表失败', error)
      message.error('获取部门列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartmentTree = async () => {
    try {
      const res = await getDepartmentTree()
      setTreeData(res.data || [])
      // 默认展开第一级节点
      const rootKeys = res.data?.map(item => item.id) || []
      setExpandedKeys(rootKeys)
    } catch (error) {
      console.error('获取部门树失败', error)
      message.error('获取部门树失败')
    }
  }

  const handleAdd = () => {
    setCurrentId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Department) => {
    setCurrentId(record.id)
    form.setFieldsValue({
      ...record,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个部门吗？这可能会影响关联的用户。',
      onOk: async () => {
        try {
          await deleteDepartment(id)
          message.success('删除成功')
          fetchDepartments()
          fetchDepartmentTree()
        } catch (error) {
          console.error('删除失败:', error)
          message.error('删除失败')
        }
      }
    })
  }

  const handleBulkDelete = async (ids: number[]) => {
    if (!ids.length) {
      message.warning('请至少选择一个部门')
      return
    }

    Modal.confirm({
      title: '确认批量删除',
      content: `确定要删除选中的 ${ids.length} 个部门吗？这可能会影响关联的用户。`,
      onOk: async () => {
        try {
          const res = await bulkDeleteDepartments(ids)
          message.success(`删除成功: ${res.data.success} 个，失败: ${res.data.failed} 个`)
          fetchDepartments()
          fetchDepartmentTree()
        } catch (error) {
          console.error('批量删除失败:', error)
          message.error('批量删除失败')
        }
      }
    })
  }

  const handleCancel = () => {
    setModalVisible(false)
    form.resetFields()
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      if (currentId) {
        await updateDepartment(currentId, values)
        message.success('更新成功')
      } else {
        await createDepartment(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchDepartments()
      fetchDepartmentTree()
    } catch (error) {
      console.error('操作失败:', error)
      message.error('操作失败')
    }
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    fetchDepartments()
  }

  const handleReset = () => {
    setSearchText('')
    fetchDepartments()
  }

  const handleTreeSelect = (selectedKeys: React.Key[]) => {
    setSelectedKeys(selectedKeys)
    if (selectedKeys.length > 0) {
      const selectedId = selectedKeys[0] as number
      setSearchText('')
      // 如果选择了树节点，过滤部门列表以显示这个部门及其子部门
      const filterDeptsByParentId = async () => {
        setLoading(true)
        try {
          const res = await getDepartmentList({ parent_id: selectedId })
          setDepartments(res.data || [])
        } catch (error) {
          console.error('获取子部门失败', error)
          message.error('获取子部门失败')
        } finally {
          setLoading(false)
        }
      }
      filterDeptsByParentId()
    } else {
      fetchDepartments()
    }
  }

  const columns: ColumnsType<Department> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '部门名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '部门编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
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
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
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
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card title="部门结构" style={{ marginBottom: 16 }}>
            <Tree
              treeData={treeData.map(item => ({
                key: item.id,
                title: item.name,
                children: item.children?.map(child => ({
                  key: child.id,
                  title: child.name,
                  children: child.children?.map(subChild => ({
                    key: subChild.id,
                    title: subChild.name,
                  }))
                }))
              }))}
              expandedKeys={expandedKeys}
              selectedKeys={selectedKeys}
              onExpand={expandedKeys => setExpandedKeys(expandedKeys)}
              onSelect={handleTreeSelect}
            />
          </Card>
        </Col>
        <Col span={18}>
          <div style={{ marginBottom: 16 }}>
            <Space>
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAdd}
              >
                新增部门
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => {
                  setSelectedKeys([])
                  fetchDepartments()
                }}
              >
                刷新
              </Button>
              <Search
                placeholder="输入部门名称或编码搜索"
                allowClear
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onSearch={handleSearch}
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
            dataSource={departments}
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />

          <Modal
            title={currentId ? '编辑部门' : '新增部门'}
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
                sort: 0,
                parent_id: null,
              }}
            >
              <Form.Item
                name="name"
                label="部门名称"
                rules={[{ required: true, message: '请输入部门名称' }]}
              >
                <Input placeholder="请输入部门名称" />
              </Form.Item>

              <Form.Item
                name="code"
                label="部门编码"
                rules={[{ required: true, message: '请输入部门编码' }]}
              >
                <Input placeholder="请输入部门编码" />
              </Form.Item>

              <Form.Item
                name="parent_id"
                label="上级部门"
              >
                <Select placeholder="请选择上级部门" allowClear>
                  <Option value={null}>无上级部门</Option>
                  {departments.map(dept => (
                    <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="sort"
                label="排序"
                rules={[{ required: true, message: '请输入排序' }]}
              >
                <Input type="number" placeholder="请输入排序" />
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

              <Form.Item
                name="remark"
                label="备注"
              >
                <Input.TextArea rows={4} placeholder="请输入备注" />
              </Form.Item>
            </Form>
          </Modal>
        </Col>
      </Row>
    </div>
  )
}

export default Departments 