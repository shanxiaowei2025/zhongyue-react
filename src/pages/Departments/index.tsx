import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Select,
  message,
  Tag,
  Tree,
  Card,
  Row,
  Col,
  Popover,
  Tooltip,
  Typography,
  Cascader,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  TeamOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { Department, DepartmentTreeNode } from '../../types'
import {
  getDepartmentList,
  getDepartmentTree,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  bulkDeleteDepartments,
  getDepartmentUsers,
  getDepartment,
} from '../../api/department'
import './index.css' // 引入CSS样式文件

const { Option } = Select
const { Search } = Input
const { Text } = Typography

const DepartmentTypes = {
  1: '公司',
  2: '分公司',
  3: '部门',
}

// 定义级联选择器选项类型
interface CascaderOption {
  value: number | null
  label: string
  disabled?: boolean
  children?: CascaderOption[]
}

const Departments = () => {
  const [form] = Form.useForm()
  const [departments, setDepartments] = useState<Department[]>([])
  const [treeData, setTreeData] = useState<DepartmentTreeNode[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [userModalVisible, setUserModalVisible] = useState(false)
  const [currentId, setCurrentId] = useState<number | null>(null)
  const [searchText, setSearchText] = useState('')
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([])
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
  const [departmentUsers, setDepartmentUsers] = useState<any[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([])

  useEffect(() => {
    fetchDepartments()
    fetchDepartmentTree()
  }, [])

  const fetchDepartments = async (params = {}) => {
    setLoading(true)
    try {
      // 获取所有部门
      const res = await getDepartmentTree()
      // 设置分层级部门数据
      setTreeData(res.data || [])

      // 生成所有部门ID作为展开行的键
      const getAllIds = (depts: DepartmentTreeNode[]): number[] => {
        let ids: number[] = []
        depts.forEach(dept => {
          ids.push(dept.id)
          if (dept.children && dept.children.length > 0) {
            ids = [...ids, ...getAllIds(dept.children)]
          }
        })
        return ids
      }

      // 使用树形结构数据作为表格数据源
      setDepartments(res.data || [])

      // 设置所有行默认展开
      const allIds = getAllIds(res.data || [])
      setExpandedRowKeys(allIds)
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
    form.setFieldsValue({
      status: 1,
      sort: 0,
      parent_id: null,
      type: 3,
    })
    setModalVisible(true)
  }

  const handleEdit = (record: Department) => {
    setCurrentId(record.id)
    form.resetFields()

    // 修改这里，处理级联选择器的初始值
    let parentPath: (number | null)[] = []

    // 检查是否有parent_id（接口直接返回的父ID）
    if (record.parent_id) {
      // 递归查找从根部门到父部门的完整路径
      const findParentPath = (
        departments: DepartmentTreeNode[],
        targetId: number,
        path: number[] = []
      ): number[] | null => {
        for (const dept of departments) {
          // 如果当前部门就是目标部门，返回路径
          if (dept.id === targetId) {
            return [...path, dept.id]
          }

          // 如果有子部门，在子部门中继续查找
          if (dept.children && dept.children.length > 0) {
            const foundPath = findParentPath(dept.children, targetId, [...path, dept.id])
            if (foundPath) {
              return foundPath
            }
          }
        }

        return null
      }

      // 查找父部门的完整路径
      const foundPath = findParentPath(treeData, record.parent_id)
      if (foundPath) {
        // 找到完整路径
        parentPath = foundPath
        console.log('找到父部门路径:', parentPath)
      } else {
        // 如果未找到完整路径，至少设置直接父级ID
        parentPath = [record.parent_id]
        console.log('未找到完整路径，使用直接父ID:', parentPath)
      }
    } else {
      // 明确设置为 [null] 表示"无上级部门"选项
      parentPath = [null]
      console.log('无父部门，设置为:', parentPath)
    }

    form.setFieldsValue({
      ...record,
      parent_id: parentPath,
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
          if (selectedKeys.includes(id)) {
            setSelectedKeys([])
          }
        } catch (error: any) {
          console.error('删除失败:', error)
          message.error(error.response?.data?.message || '删除失败')
        }
      },
    })
  }

  const handleBulkDelete = async () => {
    const ids = selectedRowKeys.map(key => Number(key))
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
          setSelectedRowKeys([])
          fetchDepartments()
          fetchDepartmentTree()
        } catch (error: any) {
          console.error('批量删除失败:', error)
          message.error(error.response?.data?.message || '批量删除失败')
        }
      },
    })
  }

  const handleCancel = () => {
    setModalVisible(false)
    form.resetFields()
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()

      // 处理级联选择器的值，取数组的最后一项作为父部门ID
      let parentId = null
      if (values.parent_id) {
        if (Array.isArray(values.parent_id)) {
          // 数组的第一项如果是null，表示选择了"无上级部门"
          if (values.parent_id[0] === null) {
            parentId = null
          } else {
            // 取数组的最后一项作为最终选择的部门ID
            parentId = values.parent_id[values.parent_id.length - 1]
          }
        } else {
          // 如果不是数组（可能是直接设置的值），则直接使用
          parentId = values.parent_id === null ? null : values.parent_id
        }
      }

      console.log('提交的父部门ID:', parentId)

      // 更新提交的数据
      const submitData = {
        ...values,
        parent_id: parentId,
      }

      if (currentId) {
        await updateDepartment(currentId, submitData)
        message.success('更新成功')
      } else {
        await createDepartment(submitData)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchDepartments()
      fetchDepartmentTree()
    } catch (error: any) {
      console.error('操作失败:', error)
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    setSelectedKeys([])

    if (!value) {
      fetchDepartments()
      return
    }

    setLoading(true)

    // 递归搜索符合条件的部门
    const searchDepartments = (departments: DepartmentTreeNode[]): DepartmentTreeNode[] => {
      const result: DepartmentTreeNode[] = []

      departments.forEach(dept => {
        // 创建部门的副本，防止修改原始数据
        const deptCopy: DepartmentTreeNode = { ...dept, children: undefined }

        // 如果部门名称包含搜索关键词
        if (dept.name.toLowerCase().includes(value.toLowerCase())) {
          // 保留完整的子部门
          if (dept.children && dept.children.length > 0) {
            deptCopy.children = [...dept.children]
          }
          result.push(deptCopy)
        }
        // 如果有子部门，递归搜索子部门
        else if (dept.children && dept.children.length > 0) {
          const matchedChildren = searchDepartments(dept.children)
          if (matchedChildren.length > 0) {
            deptCopy.children = matchedChildren
            result.push(deptCopy)
          }
        }
      })

      return result
    }

    // 搜索匹配的部门
    const searchResults = searchDepartments(treeData)
    setDepartments(searchResults as unknown as Department[])
    setLoading(false)
  }

  const handleReset = () => {
    setSearchText('')
    setSelectedKeys([])
    fetchDepartments()
  }

  const handleTreeSelect = (selectedKeys: React.Key[], info: any) => {
    setSelectedKeys(selectedKeys)
    if (selectedKeys.length > 0) {
      const selectedId = selectedKeys[0] as number
      setSearchText('')
      setLoading(true)

      // 从树形数据中找到选中的部门
      const findDepartment = (
        departments: DepartmentTreeNode[],
        id: number
      ): DepartmentTreeNode | null => {
        for (const dept of departments) {
          if (dept.id === id) {
            return dept
          }
          if (dept.children && dept.children.length > 0) {
            const foundInChildren = findDepartment(dept.children, id)
            if (foundInChildren) {
              return foundInChildren
            }
          }
        }
        return null
      }

      // 生成所有部门ID作为展开行的键
      const getAllIds = (depts: DepartmentTreeNode[]): number[] => {
        let ids: number[] = []
        if (!depts) return ids

        depts.forEach(dept => {
          ids.push(dept.id)
          if (dept.children && dept.children.length > 0) {
            ids = [...ids, ...getAllIds(dept.children)]
          }
        })
        return ids
      }

      // 在树形数据中查找选中的部门
      const selectedDept = findDepartment(treeData, selectedId)
      if (selectedDept) {
        // 显示选中的部门及其子部门
        setDepartments([selectedDept as unknown as Department])

        // 确保所有子部门都展开
        const idsToExpand = [selectedDept.id, ...getAllIds(selectedDept.children || [])]
        setExpandedRowKeys(idsToExpand)
      } else {
        // 如果在树形数据中未找到，则通过API获取
        getDepartment(selectedId)
          .then(res => {
            if (res.data) {
              setDepartments([res.data])

              // 确保所有子部门都展开
              const idsToExpand = [res.data.id]
              if (res.data.children) {
                idsToExpand.push(...getAllIds(res.data.children as unknown as DepartmentTreeNode[]))
              }
              setExpandedRowKeys(idsToExpand)
            }
          })
          .catch(error => {
            console.error('获取部门详情失败:', error)
            message.error('获取部门详情失败')
          })
      }
      setLoading(false)
    } else {
      // 如果取消选择，则显示全部部门
      fetchDepartments()
    }
  }

  const handleViewUsers = async (deptId: number) => {
    setCurrentId(deptId)
    setUsersLoading(true)
    try {
      const res = await getDepartmentUsers(deptId)
      setDepartmentUsers(res.data || [])
      setUserModalVisible(true)
    } catch (error) {
      console.error('获取部门用户失败', error)
      message.error('获取部门用户失败')
    } finally {
      setUsersLoading(false)
    }
  }

  const userColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
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
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? '启用' : '禁用'}</Tag>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[], record: any) => (
        <>
          {record.roleNames?.map((roleName: string, index: number) => (
            <Tag color="blue" key={index}>
              {roleName}
            </Tag>
          ))}
        </>
      ),
    },
  ]

  // 转换部门树结构为级联选择器选项
  const transformToCascaderOptions = (departments: DepartmentTreeNode[]): CascaderOption[] => {
    return departments.map(dept => ({
      value: dept.id,
      label: dept.name,
      disabled: dept.id === currentId, // 禁止选择自己作为上级部门
      children:
        dept.children && dept.children.length > 0
          ? transformToCascaderOptions(dept.children)
          : undefined,
    }))
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
      width: 200,
      render: (text, record) => {
        // 获取当前行的层级
        const level = record.type || 3

        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: level === 1 ? 'bold' : 'normal',
            }}
          >
            <span>{text}</span>
          </div>
        )
      },
    },
    {
      title: '部门类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: type => {
        const level = type || 3
        const levelColors = {
          1: '#1890ff', // 一级部门(公司) - 蓝色
          2: '#52c41a', // 二级部门(分公司) - 绿色
          3: '#722ed1', // 三级部门(部门) - 紫色
        }

        return (
          <Tag color={levelColors[level as keyof typeof levelColors]}>
            {DepartmentTypes[level as keyof typeof DepartmentTypes]}
          </Tag>
        )
      },
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 220,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.principal && <Text ellipsis>负责人: {record.principal}</Text>}
          {record.phone && <Text ellipsis>电话: {record.phone}</Text>}
          {record.email && <Text ellipsis>邮箱: {record.email}</Text>}
        </Space>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 70,
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
      render: remark => remark || '-',
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
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="编辑部门">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除部门">
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
          <Tooltip title="查看部门用户">
            <Button
              size="small"
              icon={<TeamOutlined />}
              onClick={() => handleViewUsers(record.id)}
            />
          </Tooltip>
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
                title: (
                  <Tooltip
                    title={`类型: ${DepartmentTypes[item.type as keyof typeof DepartmentTypes]}${item.remark ? `、备注: ${item.remark}` : ''}`}
                  >
                    <span>{item.name}</span>
                  </Tooltip>
                ),
                children: item.children?.map(child => ({
                  key: child.id,
                  title: (
                    <Tooltip
                      title={`类型: ${DepartmentTypes[child.type as keyof typeof DepartmentTypes]}${child.remark ? `、备注: ${child.remark}` : ''}`}
                    >
                      <span>{child.name}</span>
                    </Tooltip>
                  ),
                  children: child.children?.map(subChild => ({
                    key: subChild.id,
                    title: (
                      <Tooltip
                        title={`类型: ${DepartmentTypes[subChild.type as keyof typeof DepartmentTypes]}${subChild.remark ? `、备注: ${subChild.remark}` : ''}`}
                      >
                        <span>{subChild.name}</span>
                      </Tooltip>
                    ),
                  })),
                })),
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
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增部门
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={selectedRowKeys.length === 0}
                onClick={handleBulkDelete}
              >
                批量删除
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  setSelectedKeys([])
                  setSelectedRowKeys([])
                  setSearchText('')
                  fetchDepartments()
                }}
              >
                刷新
              </Button>
              <Search
                placeholder="输入部门名称搜索"
                allowClear
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onSearch={handleSearch}
                style={{ width: 300 }}
              />
            </Space>
          </div>

          <Table
            rowKey="id"
            rowSelection={{
              selectedRowKeys,
              onChange: selectedRowKeys => {
                setSelectedRowKeys(selectedRowKeys)
              },
            }}
            columns={columns}
            dataSource={departments}
            loading={loading}
            pagination={false}
            scroll={{ x: 1300 }}
            expandable={{
              defaultExpandAllRows: true,
              childrenColumnName: 'children',
              indentSize: 24, // 增加缩进值，使层级更明显
              expandedRowKeys: expandedRowKeys,
              onExpandedRowsChange: expandedRows => {
                setExpandedRowKeys([...expandedRows])
              },
            }}
            rowClassName={record => {
              // 根据层级添加不同的样式类
              const level = record.type || 3
              return `department-level-${level}`
            }}
            className="department-table"
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
                type: 3,
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="name"
                    label="部门名称"
                    rules={[{ required: true, message: '请输入部门名称' }]}
                  >
                    <Input placeholder="请输入部门名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="code" label="部门编码">
                    <Input placeholder="请输入部门编码" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="parent_id" label="上级部门">
                    <Cascader
                      placeholder="请选择上级部门"
                      options={[
                        { value: null, label: '无上级部门' },
                        ...transformToCascaderOptions(treeData),
                      ]}
                      changeOnSelect
                      expandTrigger="hover"
                      showSearch={{
                        filter: (inputValue, path) => {
                          return path.some(option => {
                            const label = String(option.label || '')
                            return label.toLowerCase().indexOf(inputValue.toLowerCase()) > -1
                          })
                        },
                      }}
                      displayRender={labels => {
                        if (labels.length === 0) return ''
                        // 如果第一个选项是"无上级部门"
                        if (labels[0] === '无上级部门') return '无上级部门'
                        // 否则返回最后一个标签（即最终选择的部门）
                        return labels[labels.length - 1]
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="type"
                    label="部门类型"
                    rules={[{ required: true, message: '请选择部门类型' }]}
                  >
                    <Select placeholder="请选择部门类型">
                      <Option value={1}>公司</Option>
                      <Option value={2}>分公司</Option>
                      <Option value={3}>部门</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="principal" label="负责人">
                    <Input placeholder="请输入负责人" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="phone" label="联系电话">
                    <Input placeholder="请输入联系电话" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="email" label="邮箱">
                    <Input placeholder="请输入邮箱" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="sort"
                    label="排序"
                    rules={[{ required: true, message: '请输入排序' }]}
                  >
                    <Input type="number" placeholder="请输入排序" />
                  </Form.Item>
                </Col>
              </Row>

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

          <Modal
            title="部门用户列表"
            open={userModalVisible}
            footer={null}
            onCancel={() => setUserModalVisible(false)}
            width={800}
          >
            <Table
              rowKey="id"
              columns={userColumns}
              dataSource={departmentUsers}
              loading={usersLoading}
              pagination={{
                showSizeChanger: true,
                showTotal: total => `共 ${total} 条`,
                pageSize: 10,
              }}
            />
          </Modal>
        </Col>
      </Row>
    </div>
  )
}

export default Departments
