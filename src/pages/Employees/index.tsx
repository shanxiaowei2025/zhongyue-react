import React, { useState, useEffect } from 'react'
import { Button, Card, message, Typography } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { EmployeeSearch } from '../../components/EmployeeSearch'
import { EmployeeTable } from '../../components/EmployeeTable'
import { useEmployeeList, useDeleteEmployee } from '../../hooks/useEmployee'
import { useDebouncedValue } from '../../hooks/useDebounce'
import type { Employee, QueryEmployeeDto } from '../../types/employee'

const { Title } = Typography

interface PaginationState {
  current: number
  pageSize: number
  total: number
}

const Employees: React.FC = () => {
  const navigate = useNavigate()

  // 搜索参数状态
  const [searchParams, setSearchParams] = useState<QueryEmployeeDto>({
    name: '',
    departmentId: undefined,
    employeeType: '',
    position: '',
    rank: '',
    commissionRatePosition: '',
    isResigned: undefined,
    idCardNumber: '',
    actualBirthday: '',
  })

  // 分页状态
  const [current, setCurrent] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 添加防抖搜索参数
  const debouncedSearchParams = useDebouncedValue(searchParams, 500)

  // 构建请求参数
  const requestParams = {
    page: current,
    pageSize,
    ...Object.fromEntries(
      Object.entries(debouncedSearchParams).filter(
        ([key, value]) => value !== undefined && value !== null && value !== ''
      )
    ),
  }

  // 数据获取
  const { employees, total, isLoading, refreshEmployeeList, removeEmployee } =
    useEmployeeList(requestParams)

  // 删除员工
  const { deleteEmployee } = useDeleteEmployee()

  // 当搜索参数变化时，自动重置到第一页
  useEffect(() => {
    if (current !== 1) {
      setCurrent(1)
    }
  }, [
    searchParams.name,
    searchParams.departmentId,
    searchParams.employeeType,
    searchParams.position,
    searchParams.rank,
    searchParams.commissionRatePosition,
    searchParams.isResigned,
    searchParams.idCardNumber,
    searchParams.actualBirthday,
  ])

  // 处理搜索参数变化
  const handleSearchChange = (newSearchParams: QueryEmployeeDto) => {
    setSearchParams(newSearchParams)
  }

  // 处理重置
  const handleReset = () => {
    setSearchParams({
      name: '',
      departmentId: undefined,
      employeeType: '',
      position: '',
      rank: '',
      commissionRatePosition: '',
      isResigned: undefined,
      idCardNumber: '',
      actualBirthday: '',
    })
    setCurrent(1)
  }

  // 处理分页变化
  const handlePaginationChange = (page: number, size?: number) => {
    setCurrent(page)
    if (size && size !== pageSize) {
      setPageSize(size)
    }
  }

  // 处理创建员工
  const handleCreate = () => {
    navigate('/employees/create')
  }

  // 处理查看员工
  const handleView = (employee: Employee) => {
    navigate(`/employees/detail/${employee.id}`)
  }

  // 处理编辑员工
  const handleEdit = (employee: Employee) => {
    navigate(`/employees/edit/${employee.id}`)
  }

  // 处理删除员工
  const handleDelete = async (employee: Employee) => {
    try {
      await deleteEmployee(employee.id)

      // 乐观更新：从列表中移除已删除的员工
      removeEmployee(employee.id)

      // 如果当前页没有数据且不是第一页，跳转到上一页
      if (employees.length === 1 && current > 1) {
        setCurrent(current - 1)
      } else {
        // 刷新当前页数据
        refreshEmployeeList()
      }
    } catch (error) {
      console.error('删除员工失败:', error)
    }
  }

  return (
    <div>
      {/* 搜索表单 */}
      <EmployeeSearch searchParams={searchParams} onSearchChange={handleSearchChange} />

      {/* 操作按钮行 */}
      <div className="flex justify-between items-center mb-4">
        <Button icon={<ReloadOutlined />} onClick={handleReset}>
          重置
        </Button>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          新增员工
        </Button>
      </div>

      {/* 数据表格 */}
      <Card>
        <EmployeeTable
          employees={employees}
          loading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={{
            current,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: handlePaginationChange,
            onShowSizeChange: handlePaginationChange,
          }}
        />
      </Card>
    </div>
  )
}

export default Employees
