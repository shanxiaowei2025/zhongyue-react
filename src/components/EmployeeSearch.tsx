import React from 'react'
import { Form, Input, Select, Cascader, AutoComplete, Row, Col } from 'antd'
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
  { label: '账务部主管', value: '账务部主管' },
  { label: '内账部主管', value: '内账部主管' },
  { label: '顾问会计', value: '顾问会计' },
  { label: '记账会计', value: '记账会计' },
  { label: '开票员', value: '开票员' },
  { label: '行政部主管', value: '行政部主管' },
  { label: '行政文员', value: '行政文员' },
  { label: '行政专员', value: '行政专员' },
  { label: '社保专员', value: '社保专员' },
  { label: '注册外勤', value: '注册外勤' },
  { label: '销售专员', value: '销售专员' },
  { label: '业务专员', value: '业务专员' },
  { label: '雄安分公司负责人', value: '雄安分公司负责人' },
  { label: '高碑店分公司负责人', value: '高碑店分公司负责人' },
]

// 生成职级选项 P0-1 到 P7-4，每个级别都有4个子级别
const generateRankOptions = () => {
  const options = []
  for (let i = 0; i <= 7; i++) {
    for (let j = 1; j <= 4; j++) {
      options.push({ label: `P${i}-${j}`, value: `P${i}-${j}` })
    }
  }
  return options
}

const rankOptions = generateRankOptions()

const commissionRatePositionOptions = [
  { label: '顾问', value: '顾问' },
  { label: '销售', value: '销售' },
  { label: '其他', value: '其他' },
]

export const EmployeeSearch: React.FC<EmployeeSearchProps> = ({ searchParams, onSearchChange }) => {
  const { departments, rawDepartments } = useDepartments()

  return (
    <div className="bg-white">
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
                  className="w-full"
                />
              </Form.Item>

              <Form.Item label="所属部门" className="mb-2">
                <Cascader
                  options={departments}
                  placeholder="请选择部门"
                  value={searchParams.departmentIds}
                  onChange={value => {
                    const departmentIds =
                      value && value.length > 0 ? (value as number[]) : undefined
                    // 为了向后兼容，同时设置departmentId（取最后一个）
                    const departmentId =
                      departmentIds && departmentIds.length > 0
                        ? departmentIds[departmentIds.length - 1]
                        : undefined
                    onSearchChange({ ...searchParams, departmentIds, departmentId })
                  }}
                  allowClear
                  showSearch
                  changeOnSelect={true}
                  className="w-full"
                />
              </Form.Item>

              <Form.Item label="员工类型" className="mb-2">
                <Select
                  placeholder="请选择员工类型"
                  value={searchParams.employeeType || undefined}
                  onChange={value => onSearchChange({ ...searchParams, employeeType: value })}
                  allowClear
                  className="w-full"
                >
                  {employeeTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="职位" className="mb-2">
                <AutoComplete
                  placeholder="请选择或输入职位"
                  value={searchParams.position || undefined}
                  onChange={value => onSearchChange({ ...searchParams, position: value })}
                  options={positionOptions}
                  allowClear
                  filterOption={(inputValue, option) =>
                    (option?.label?.toString().toLowerCase().includes(inputValue.toLowerCase()) ||
                      option?.value?.toString().toLowerCase().includes(inputValue.toLowerCase())) ??
                    false
                  }
                  className="w-full"
                />
              </Form.Item>

              <Form.Item label="职级" className="mb-2">
                <Select
                  placeholder="请选择职级"
                  value={searchParams.rank || undefined}
                  onChange={value => onSearchChange({ ...searchParams, rank: value })}
                  allowClear
                  className="w-full"
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
                  className="w-full"
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
                  className="w-full"
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
                  className="w-full"
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
                  className="w-full"
                />
              </Form.Item>
            </div>
          </div>
        </Form>
      </div>
    </div>
  )
}
