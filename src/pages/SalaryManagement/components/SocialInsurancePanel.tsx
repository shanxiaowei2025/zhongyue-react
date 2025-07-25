import React, { useState } from 'react'
import { Card, Descriptions, Button, Form, message, Space } from 'antd'
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import type { SocialInsuranceRecord } from '../../../types/salaryIntegrated'
import AmountInput from './AmountInput'

interface SocialInsurancePanelProps {
  employeeName: string
  yearMonth: string
  data?: SocialInsuranceRecord
  onUpdate: (data: any) => Promise<any>
}

const SocialInsurancePanel: React.FC<SocialInsurancePanelProps> = ({
  employeeName,
  yearMonth,
  data,
  onUpdate,
}) => {
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleEdit = () => {
    if (data) {
      form.setFieldsValue({
        personalMedical: data.personalMedical,
        personalPension: data.personalPension,
        personalUnemployment: data.personalUnemployment,
        companyMedical: data.companyMedical,
        companyPension: data.companyPension,
        companyUnemployment: data.companyUnemployment,
        companyInjury: data.companyInjury,
        remark: data.remark,
      })
    }
    setEditing(true)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      // 计算合计
      const personalTotal =
        (values.personalMedical || 0) +
        (values.personalPension || 0) +
        (values.personalUnemployment || 0)

      const companyTotal =
        (values.companyMedical || 0) +
        (values.companyPension || 0) +
        (values.companyUnemployment || 0) +
        (values.companyInjury || 0)

      const grandTotal = personalTotal + companyTotal

      const updateData = {
        ...values,
        personalTotal,
        companyTotal,
        grandTotal,
        name: employeeName,
        yearMonth,
      }

      if (data) {
        updateData.id = data.id
      }

      await onUpdate(updateData)
      setEditing(false)
      message.success('社保信息已更新')
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
        <div className="text-gray-500 mb-4">暂无社保信息</div>
        <Button type="primary" onClick={handleEdit}>
          添加社保信息
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-medium">社保缴费信息</h4>
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

      {editing ? (
        <Form form={form} layout="vertical">
          <div className="grid grid-cols-2 gap-6">
            <Card title="个人承担部分" size="small">
              <Form.Item label="医疗保险" name="personalMedical">
                <AmountInput />
              </Form.Item>
              <Form.Item label="养老保险" name="personalPension">
                <AmountInput />
              </Form.Item>
              <Form.Item label="失业保险" name="personalUnemployment">
                <AmountInput />
              </Form.Item>
            </Card>

            <Card title="公司承担部分" size="small">
              <Form.Item label="医疗保险" name="companyMedical">
                <AmountInput />
              </Form.Item>
              <Form.Item label="养老保险" name="companyPension">
                <AmountInput />
              </Form.Item>
              <Form.Item label="失业保险" name="companyUnemployment">
                <AmountInput />
              </Form.Item>
              <Form.Item label="工伤保险" name="companyInjury">
                <AmountInput />
              </Form.Item>
            </Card>
          </div>

          <Form.Item label="备注" name="remark" className="mt-4">
            <input className="ant-input" placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          <Card title="个人承担部分" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="医疗保险">
                ¥{data!.personalMedical.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="养老保险">
                ¥{data!.personalPension.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="失业保险">
                ¥{data!.personalUnemployment.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="个人合计">
                <strong className="text-red-500">¥{data!.personalTotal.toLocaleString()}</strong>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="公司承担部分" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="医疗保险">
                ¥{data!.companyMedical.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="养老保险">
                ¥{data!.companyPension.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="失业保险">
                ¥{data!.companyUnemployment.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="工伤保险">
                ¥{data!.companyInjury.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="公司合计">
                <strong className="text-blue-500">¥{data!.companyTotal.toLocaleString()}</strong>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </div>
      )}

      {data && !editing && (
        <Card title="汇总信息" size="small" className="mt-4">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="总合计">
              <span className="text-lg font-bold text-green-600">
                ¥{data.grandTotal.toLocaleString()}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="备注">{data.remark || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  )
}

export default SocialInsurancePanel
