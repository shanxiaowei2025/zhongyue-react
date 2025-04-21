import { useState, useEffect } from 'react'
import { Table, Button, message, Switch, Card, Tabs, Tooltip, Spin } from 'antd'
import { ReloadOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { RolePermissionMatrix, Permission } from '../../types'
import { getPermissionList, updatePermission } from '../../api/permissions'

// 权限管理页面
const Permissions = () => {
  const [activeTab, setActiveTab] = useState<string>('')
  const [pageNames, setPageNames] = useState<string[]>([])
  const [rolePermissions, setRolePermissions] = useState<RolePermissionMatrix[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [permissionsMap, setPermissionsMap] = useState<Record<string, Permission>>({})
  const [permissionsByPage, setPermissionsByPage] = useState<Record<string, Permission[]>>({})

  // 初始化获取数据
  useEffect(() => {
    fetchPermissionData()
  }, [])

  // 设置默认活动的Tab
  useEffect(() => {
    if (pageNames.length > 0 && !activeTab) {
      setActiveTab(pageNames[0])
    }
  }, [pageNames, activeTab])

  // 获取权限数据
  const fetchPermissionData = async () => {
    setLoading(true)
    try {
      // 获取所有权限列表
      const permRes = await getPermissionList()
      const permissionsList = permRes.data || []
      setPermissions(permissionsList)

      // 创建权限ID映射表，用于快速查找
      const permMap: Record<string, Permission> = {}
      permissionsList.forEach(perm => {
        const key = `${perm.role_name}:${perm.permission_name}`
        permMap[key] = perm
      })
      setPermissionsMap(permMap)

      // 按页面名称分组权限
      const permsByPage: Record<string, Permission[]> = {}
      permissionsList.forEach(perm => {
        if (!permsByPage[perm.page_name]) {
          permsByPage[perm.page_name] = []
        }
        permsByPage[perm.page_name].push(perm)
      })
      setPermissionsByPage(permsByPage)

      // 提取页面名称列表，用于标签页
      const uniquePageNames = Array.from(new Set(permissionsList.map(p => p.page_name)))
      setPageNames(uniquePageNames)

      // 提取角色并构建角色权限矩阵
      const roles = Array.from(new Set(permissionsList.map(p => p.role_name))).map(roleName => {
        const rolePerms = permissionsList.filter(p => p.role_name === roleName)
        const roleId = rolePerms.length > 0 ? rolePerms[0].role_id : 0

        const permObj: Record<string, boolean> = {}

        // 设置每个权限的值
        rolePerms.forEach(p => {
          permObj[p.permission_name] = p.permission_value
        })

        return {
          role: {
            id: roleId,
            name: roleName,
            code: roleName.toLowerCase().replace(/\s+/g, '_'),
            status: 1 as 0 | 1,
            remark: '',
            create_time: '',
            update_time: '',
          },
          permissions: permObj,
        }
      })

      setRolePermissions(roles)
    } catch (error) {
      console.error('获取权限数据失败:', error)
      message.error('获取权限数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 切换权限状态
  const handleTogglePermission = async (
    roleName: string,
    permissionName: string,
    checked: boolean
  ) => {
    const key = `${roleName}:${permissionName}`
    const permission = permissionsMap[key]

    if (!permission) {
      message.error('未找到对应权限数据')
      return
    }

    try {
      await updatePermission(permission.id, { permission_value: checked })
      message.success('权限更新成功')

      // 更新本地数据
      setPermissionsMap(prev => ({
        ...prev,
        [key]: { ...permission, permission_value: checked },
      }))

      setRolePermissions(prev =>
        prev.map(rp =>
          rp.role.name === roleName
            ? { ...rp, permissions: { ...rp.permissions, [permissionName]: checked } }
            : rp
        )
      )
    } catch (error) {
      console.error('更新权限失败:', error)
      message.error('更新权限失败')
    }
  }

  // 获取页面下的唯一权限列表
  const getUniquePermissionsForPage = (pageName: string) => {
    const pagePerms = permissionsByPage[pageName] || []
    const uniquePermNameMap = new Map<string, { name: string; description: string }>()

    pagePerms.forEach(perm => {
      if (!uniquePermNameMap.has(perm.permission_name)) {
        uniquePermNameMap.set(perm.permission_name, {
          name: perm.permission_name,
          description: perm.description,
        })
      }
    })

    return Array.from(uniquePermNameMap.values())
  }

  // 渲染特定页面的权限表格
  const renderPermissionTable = (pageName: string) => {
    // 如果没有角色数据，显示提示信息
    if (rolePermissions.length === 0) {
      return <div style={{ textAlign: 'center', padding: '20px' }}>暂无角色数据</div>
    }

    // 获取该页面下所有唯一的权限
    const uniquePermissions = getUniquePermissionsForPage(pageName)

    // 构建表格列，每列对应一个权限
    const columns: ColumnsType<RolePermissionMatrix> = [
      {
        title: '角色',
        dataIndex: ['role', 'name'],
        key: 'roleName',
        fixed: 'left',
        width: 150,
      },
      ...uniquePermissions.map(permission => ({
        title: (
          <div style={{ textAlign: 'center' }}>
            {permission.description}
            <Tooltip title={permission.name}>
              <QuestionCircleOutlined style={{ marginLeft: 4 }} />
            </Tooltip>
          </div>
        ),
        dataIndex: ['permissions', permission.name],
        key: permission.name,
        width: 140,
        align: 'center' as 'center',
        render: (value: boolean, record: RolePermissionMatrix) => (
          <Switch
            checked={!!record.permissions?.[permission.name]}
            onChange={checked => handleTogglePermission(record.role.name, permission.name, checked)}
            checkedChildren="启用"
            unCheckedChildren="禁用"
            size="small"
          />
        ),
      })),
    ]

    return (
      <Table
        rowKey={record => `${record.role.id}_${pageName}`}
        columns={columns}
        dataSource={rolePermissions}
        pagination={false}
        size="middle"
        bordered
        scroll={{ x: 'max-content' }}
      />
    )
  }

  // 构建标签页项目
  const tabItems = pageNames.map(pageName => ({
    label: pageName,
    key: pageName,
    children: renderPermissionTable(pageName),
  }))

  return (
    <Spin spinning={loading}>
      <Card>
        {pageNames.length > 0 ? (
          <Tabs activeKey={activeTab} onChange={setActiveTab} type="card" items={tabItems} />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>暂无权限数据</div>
        )}
      </Card>
    </Spin>
  )
}

export default Permissions
