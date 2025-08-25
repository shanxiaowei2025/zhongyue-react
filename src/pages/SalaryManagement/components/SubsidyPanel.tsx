import React, { useState } from 'react'
import { Descriptions, Button, Form, message, Space, Collapse } from 'antd'
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import type { SubsidySummaryRecord } from '../../../types/salaryIntegrated'
import AmountInput from './AmountInput'

interface SubsidyPanelProps {
  employeeName: string
  yearMonth: string
  data?: SubsidySummaryRecord
  onUpdate: (data: any) => Promise<any>
}

const SubsidyPanel: React.FC<SubsidyPanelProps> = ({ employeeName, yearMonth, data, onUpdate }) => {
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleEdit = () => {
    if (data) {
      form.setFieldsValue({
        department: data.department,
        position: data.position,
        departmentHeadSubsidy: data.departmentHeadSubsidy,
        positionAllowance: data.positionAllowance,
        oilSubsidy: data.oilSubsidy,
        mealSubsidy: data.mealSubsidy,
      })
    }
    setEditing(true)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      // 计算补贴合计
      const totalSubsidy =
        (values.departmentHeadSubsidy || 0) +
        (values.positionAllowance || 0) +
        (values.oilSubsidy || 0) +
        (values.mealSubsidy || 0)

      const updateData = {
        ...values,
        totalSubsidy,
        name: employeeName,
        yearMonth,
      }

      if (data) {
        updateData.id = data.id
      }

      await onUpdate(updateData)
      setEditing(false)
      message.success('补贴信息已更新')
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    form.resetFields()
  }

  if (!data && !editing) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-500 mb-4">暂无补贴信息</div>
        <Button type="primary" onClick={handleEdit}>
          添加补贴信息
        </Button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">补贴明细</h4>
          <Space>
            {editing ? (
              <>
                <Button
                  icon={<SaveOutlined />}
                  type="primary"
                  size="small"
                  onClick={handleSave}
                  loading={loading}
                >
                  保存
                </Button>
                <Button icon={<CloseOutlined />} size="small" onClick={handleCancel}>
                  取消
                </Button>
              </>
            ) : (
              <Button icon={<EditOutlined />} size="small" onClick={handleEdit}>
                编辑
              </Button>
            )}
          </Space>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {editing ? (
          <Form form={form} layout="vertical">
            <Collapse defaultActiveKey={['basic', 'subsidy']} ghost>
              <Collapse.Panel header="基础信息" key="basic">
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item label="部门" name="department">
                    <input className="ant-input" placeholder="请输入部门" />
                  </Form.Item>
                  <Form.Item label="职位" name="position">
                    <input className="ant-input" placeholder="请输入职位" />
                  </Form.Item>
                </div>
              </Collapse.Panel>

              <Collapse.Panel header="补贴项目" key="subsidy">
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item label="部门负责人补贴" name="departmentHeadSubsidy">
                    <AmountInput />
                  </Form.Item>
                  <Form.Item label="岗位津贴" name="positionAllowance">
                    <AmountInput />
                  </Form.Item>
                  <Form.Item label="油补" name="oilSubsidy">
                    <AmountInput />
                  </Form.Item>
                  <Form.Item label="餐补(8元/天)" name="mealSubsidy">
                    <AmountInput />
                  </Form.Item>
                </div>
              </Collapse.Panel>
            </Collapse>
          </Form>
        ) : (
          <Collapse defaultActiveKey={['basic', 'subsidy', 'total']} ghost>
            <Collapse.Panel header="基础信息" key="basic">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="部门">{data!.department}</Descriptions.Item>
                <Descriptions.Item label="职位">{data!.position}</Descriptions.Item>
              </Descriptions>
            </Collapse.Panel>

            <Collapse.Panel
              header={
                <div className="flex justify-between items-center">
                  <span>补贴明细</span>
                  <strong className="text-green-600">¥{data!.totalSubsidy.toLocaleString()}</strong>
                </div>
              }
              key="subsidy"
            >
              <Descriptions column={2} size="small">
                <Descriptions.Item label="部门负责人补贴">
                  ¥{data!.departmentHeadSubsidy.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="岗位津贴">
                  ¥{data!.positionAllowance.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="油补">
                  ¥{data!.oilSubsidy.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="餐补(8元/天)">
                  ¥{data!.mealSubsidy.toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </Collapse.Panel>
          </Collapse>
        )}
      </div>
    </div>
  )
}

export default SubsidyPanel
