import React, { useState, useEffect } from 'react'
import { Button, Card, message, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
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
    page: 1,
    pageSize: 10,
  })

  // 分页状态
  const [pagination, setPagination] = useState<PaginationState>({
    current: 1,
    pageSize: 10,
    total: 0,
  })

  // 防抖处理搜索参数
  const debouncedSearchParams = useDebouncedValue(searchParams, 500)

  // 数据获取
  const { employees, total, isLoading, refreshEmployeeList, removeEmployee } =
    useEmployeeList(debouncedSearchParams)

  // 删除员工
  const { deleteEmployee } = useDeleteEmployee()

  // 更新分页状态
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      total,
      current: searchParams.page || 1,
      pageSize: searchParams.pageSize || 10,
    }))
  }, [total, searchParams.page, searchParams.pageSize])

  // 处理搜索
  const handleSearch = (values: QueryEmployeeDto) => {
    const newSearchParams = {
      ...values,
      page: 1,
      pageSize: pagination.pageSize,
    }
    setSearchParams(newSearchParams)
  }

  // 处理重置
  const handleReset = () => {
    const resetParams = {
      page: 1,
      pageSize: pagination.pageSize,
    }
    setSearchParams(resetParams)
  }

  // 处理分页变化
  const handlePaginationChange = (page: number, pageSize?: number) => {
    const newSearchParams = {
      ...searchParams,
      page,
      pageSize: pageSize || searchParams.pageSize || 10,
    }
    setSearchParams(newSearchParams)
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
      if (employees.length === 1 && pagination.current > 1) {
        handlePaginationChange(pagination.current - 1, pagination.pageSize)
      } else {
        // 刷新当前页数据
        refreshEmployeeList()
      }
    } catch (error) {
      console.error('删除员工失败:', error)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <Title level={2} className="m-0">
            员工管理
          </Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新增员工
          </Button>
        </div>
      </div>

      {/* 搜索表单 */}
      <EmployeeSearch
        onSearch={handleSearch}
        onReset={handleReset}
        loading={isLoading}
        initialValues={searchParams}
      />

      {/* 数据表格 */}
      <Card>
        <EmployeeTable
          employees={employees}
          loading={isLoading}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
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
