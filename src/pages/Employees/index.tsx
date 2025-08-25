import React, { useEffect, useRef } from 'react'
import { Button, Card } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { EmployeeSearch } from '../../components/EmployeeSearch'
import { EmployeeTable } from '../../components/EmployeeTable'
import { useEmployeeList, useDeleteEmployee } from '../../hooks/useEmployee'
import { useDebouncedValue } from '../../hooks/useDebounce'
import { usePageStates } from '../../hooks/usePageStates'
import type { Employee, QueryEmployeeDto } from '../../types/employee'

const Employees: React.FC = () => {
  const navigate = useNavigate()

  // 页面状态管理 - 使用正确的hook方式
  const [searchParams, setSearchParamsState] = usePageStates('employees_searchParams', {
    name: '',
    departmentId: undefined,
    departmentIds: undefined,
    employeeType: '',
    position: '',
    rank: '',
    commissionRatePosition: '',
    isResigned: undefined,
    idCardNumber: '',
    actualBirthday: '',
  } as QueryEmployeeDto)

  const [current, setCurrentState] = usePageStates('employees_current', 1)
  const [pageSize, setPageSizeState] = usePageStates('employees_pageSize', 10)

  // 添加防抖搜索参数
  const debouncedSearchParams = useDebouncedValue(searchParams, 500)

  // 用于跟踪上一次的防抖搜索参数，避免不必要的页码重置
  const prevDebouncedSearchParamsRef = useRef(debouncedSearchParams)

  // 构建请求参数
  const requestParams = {
    page: current,
    pageSize,
    ...Object.fromEntries(
      Object.entries(debouncedSearchParams).filter(
        ([, value]) => value !== undefined && value !== null && value !== ''
      )
    ),
  }

  // 数据获取
  const { employees, total, isLoading, removeEmployee } = useEmployeeList(requestParams)

  // 删除员工
  const { deleteEmployee } = useDeleteEmployee()

  // 当搜索参数变化时，自动重置到第一页
  useEffect(() => {
    const prevParams = prevDebouncedSearchParamsRef.current
    const currentParams = debouncedSearchParams

    // 检查搜索参数是否真的发生了变化
    const hasChanged =
      prevParams.name !== currentParams.name ||
      prevParams.departmentId !== currentParams.departmentId ||
      JSON.stringify(prevParams.departmentIds) !== JSON.stringify(currentParams.departmentIds) ||
      prevParams.employeeType !== currentParams.employeeType ||
      prevParams.position !== currentParams.position ||
      prevParams.rank !== currentParams.rank ||
      prevParams.commissionRatePosition !== currentParams.commissionRatePosition ||
      prevParams.isResigned !== currentParams.isResigned ||
      prevParams.idCardNumber !== currentParams.idCardNumber ||
      prevParams.actualBirthday !== currentParams.actualBirthday

    if (hasChanged && current !== 1) {
      setCurrentState(1)
    }

    // 更新前一次的搜索参数引用
    prevDebouncedSearchParamsRef.current = currentParams
  }, [debouncedSearchParams, current, setCurrentState])

  // 处理搜索参数变化
  const handleSearchChange = (newSearchParams: QueryEmployeeDto) => {
    setSearchParamsState(newSearchParams)
  }

  // 处理重置
  const handleReset = () => {
    const resetSearchParams = {
      name: '',
      departmentId: undefined,
      departmentIds: undefined,
      employeeType: '',
      position: '',
      rank: '',
      commissionRatePosition: '',
      isResigned: undefined,
      idCardNumber: '',
      actualBirthday: '',
    }
    setSearchParamsState(resetSearchParams)
    setCurrentState(1)
  }

  // 处理分页变化
  const handlePaginationChange = (page: number, size?: number) => {
    setCurrentState(page)
    if (size && size !== pageSize) {
      setPageSizeState(size)
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
        const newPage = current - 1
        setCurrentState(newPage)
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
