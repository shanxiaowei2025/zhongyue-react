import React from 'react'
import { Form, Input, Select, Cascader, Row, Col } from 'antd'
import { useDepartments } from '../hooks/useDepartments'
import type { QueryEmployeeDto } from '../types/employee'

const { Option } = Select

interface EmployeeSearchProps {
  searchParams: QueryEmployeeDto
  onSearchChange: (params: QueryEmployeeDto) => void
}

const employeeTypeOptions = [
  { label: '正式', value: '正式' },
  { label: '实习', value: '实习' },
  { label: '临时', value: '临时' },
  { label: '外包', value: '外包' },
]

const positionOptions = [
  { label: '项目经理', value: '项目经理' },
  { label: '会计师', value: '会计师' },
  { label: '记账会计', value: '记账会计' },
  { label: '顾问会计', value: '顾问会计' },
  { label: '税务专员', value: '税务专员' },
  { label: '客户经理', value: '客户经理' },
  { label: '销售专员', value: '销售专员' },
]

const rankOptions = [
  { label: 'P1', value: 'P1' },
  { label: 'P2', value: 'P2' },
  { label: 'P3', value: 'P3' },
  { label: 'P4', value: 'P4' },
  { label: 'P5', value: 'P5' },
  { label: 'M1', value: 'M1' },
  { label: 'M2', value: 'M2' },
  { label: 'M3', value: 'M3' },
]

const commissionRatePositionOptions = [
  { label: '初级顾问', value: '初级顾问' },
  { label: '中级顾问', value: '中级顾问' },
  { label: '高级顾问', value: '高级顾问' },
  { label: '资深顾问', value: '资深顾问' },
  { label: '首席顾问', value: '首席顾问' },
]

export const EmployeeSearch: React.FC<EmployeeSearchProps> = ({ searchParams, onSearchChange }) => {
  const { departments } = useDepartments()

  // 构建部门层级数据（如果需要从数字转换为数组）
  const getDepartmentIds = (departmentId?: number): number[] | undefined => {
    if (!departmentId) return undefined
    // 这里可能需要根据实际的部门数据结构来转换
    // 暂时返回单个部门ID的数组
    return [departmentId]
  }

  return (
    <div className="bg-white rounded-lg shadow-sm mb-4">
      <div className="p-4">
        <Form layout="inline" className="employee-search-form">
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-2">
              <Form.Item label="员工姓名" className="mb-2">
                <Input
                  placeholder="请输入员工姓名"
                  value={searchParams.name}
                  onChange={e => onSearchChange({ ...searchParams, name: e.target.value })}
                  allowClear
                  className="w-40"
                />
              </Form.Item>

              <Form.Item label="所属部门" className="mb-2">
                <Cascader
                  options={departments}
                  placeholder="请选择部门"
                  value={getDepartmentIds(searchParams.departmentId)}
                  onChange={value => {
                    const departmentId =
                      value && value.length > 0 ? (value[value.length - 1] as number) : undefined
                    onSearchChange({ ...searchParams, departmentId })
                  }}
                  allowClear
                  showSearch
                  changeOnSelect={false}
                  className="w-40"
                />
              </Form.Item>

              <Form.Item label="员工类型" className="mb-2">
                <Select
                  placeholder="请选择员工类型"
                  value={searchParams.employeeType || undefined}
                  onChange={value => onSearchChange({ ...searchParams, employeeType: value })}
                  allowClear
                  className="w-40"
                >
                  {employeeTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="职位" className="mb-2">
                <Select
                  placeholder="请选择职位"
                  value={searchParams.position || undefined}
                  onChange={value => onSearchChange({ ...searchParams, position: value })}
                  allowClear
                  showSearch
                  className="w-40"
                >
                  {positionOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="职级" className="mb-2">
                <Select
                  placeholder="请选择职级"
                  value={searchParams.rank || undefined}
                  onChange={value => onSearchChange({ ...searchParams, rank: value })}
                  allowClear
                  className="w-40"
                >
                  {rankOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="提成比率职位" className="mb-2">
                <Select
                  placeholder="请选择提成比率职位"
                  value={searchParams.commissionRatePosition || undefined}
                  onChange={value =>
                    onSearchChange({ ...searchParams, commissionRatePosition: value })
                  }
                  allowClear
                  className="w-40"
                >
                  {commissionRatePositionOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="在职状态" className="mb-2">
                <Select
                  placeholder="请选择在职状态"
                  value={searchParams.isResigned}
                  onChange={value => onSearchChange({ ...searchParams, isResigned: value })}
                  allowClear
                  className="w-40"
                >
                  <Option value={false}>在职</Option>
                  <Option value={true}>已离职</Option>
                </Select>
              </Form.Item>

              <Form.Item label="身份证号" className="mb-2">
                <Input
                  placeholder="请输入身份证号"
                  value={searchParams.idCardNumber}
                  onChange={e => onSearchChange({ ...searchParams, idCardNumber: e.target.value })}
                  allowClear
                  className="w-40"
                />
              </Form.Item>

              <Form.Item label="实际生日" className="mb-2">
                <Input
                  placeholder="请输入实际生日描述"
                  value={searchParams.actualBirthday}
                  onChange={e =>
                    onSearchChange({ ...searchParams, actualBirthday: e.target.value })
                  }
                  allowClear
                  className="w-40"
                />
              </Form.Item>
            </div>
          </div>
        </Form>
      </div>
    </div>
  )
}
