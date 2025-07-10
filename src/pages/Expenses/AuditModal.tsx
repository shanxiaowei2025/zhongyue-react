import React from 'react'
import { Modal, Form, Radio, Input, Button, Descriptions, Tag } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Expense, ExpenseStatus } from '../../types/expense'
import dayjs from 'dayjs'
import './audit-modal.css'

interface AuditModalProps {
  visible: boolean
  expense?: Expense | null
  onClose: () => void
  onConfirm: (values: { status: ExpenseStatus; reason?: string }) => void
}

const AuditModal: React.FC<AuditModalProps> = ({ visible, expense, onClose, onConfirm }) => {
  const [form] = Form.useForm()

  const handleSubmit = () => {
    form.validateFields().then(values => {
      onConfirm(values)
      form.resetFields()
    })
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  // 渲染其他业务字段（如果有值的话）
  const renderOtherBusinessFields = () => {
    if (!expense) return null

    const items: any[] = []

    // 其他业务（自有）
    if (
      expense.otherBusiness &&
      Array.isArray(expense.otherBusiness) &&
      expense.otherBusiness.length > 0
    ) {
      items.push({
        key: 'otherBusiness',
        label: '其他业务（自有）',
        children: expense.otherBusiness.map((item: string, index: number) => (
          <Tag key={index} color="blue">
            {item}
          </Tag>
        )),
      })
    }

    // 其他业务收费（自有）
    if (expense.otherBusinessFee !== undefined && expense.otherBusinessFee !== null) {
      const fee =
        typeof expense.otherBusinessFee === 'string'
          ? parseFloat(expense.otherBusinessFee || '0')
          : Number(expense.otherBusinessFee || 0)
      items.push({
        key: 'otherBusinessFee',
        label: '其他业务收费（自有）',
        children: `¥${fee.toFixed(2)}`,
      })
    }

    // 其他业务（外包）
    if (
      expense.otherBusinessOutsourcing &&
      Array.isArray(expense.otherBusinessOutsourcing) &&
      expense.otherBusinessOutsourcing.length > 0
    ) {
      items.push({
        key: 'otherBusinessOutsourcing',
        label: '其他业务（外包）',
        children: expense.otherBusinessOutsourcing.map((item: string, index: number) => (
          <Tag key={index} color="orange">
            {item}
          </Tag>
        )),
      })
    }

    // 其他业务收费（外包）
    if (
      expense.otherBusinessOutsourcingFee !== undefined &&
      expense.otherBusinessOutsourcingFee !== null
    ) {
      const fee =
        typeof expense.otherBusinessOutsourcingFee === 'string'
          ? parseFloat(expense.otherBusinessOutsourcingFee || '0')
          : Number(expense.otherBusinessOutsourcingFee || 0)
      items.push({
        key: 'otherBusinessOutsourcingFee',
        label: '其他业务收费（外包）',
        children: `¥${fee.toFixed(2)}`,
      })
    }

    return items.length > 0 ? items : null
  }

  const otherBusinessItems = renderOtherBusinessFields()

  return (
    <Modal title="费用审核" open={visible} onCancel={handleCancel} footer={null} width={800}>
      {/* 费用详情 */}
      {expense && (
        <div className="mb-6">
          <h4 className="mb-4">费用详情</h4>
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="企业名称" span={2}>
              {expense.companyName}
            </Descriptions.Item>
            <Descriptions.Item label="统一社会信用代码">
              {expense.unifiedSocialCreditCode || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="总费用">
              ¥
              {typeof expense.totalFee === 'string'
                ? parseFloat(expense.totalFee).toFixed(2)
                : Number(expense.totalFee || 0).toFixed(2)}
            </Descriptions.Item>
            <Descriptions.Item label="业务类型">{expense.businessType || '-'}</Descriptions.Item>
            <Descriptions.Item label="收费日期">
              {expense.chargeDate ? dayjs(expense.chargeDate).format('YYYY-MM-DD') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="收费方式">{expense.chargeMethod || '-'}</Descriptions.Item>
            <Descriptions.Item label="业务员">{expense.salesperson || '-'}</Descriptions.Item>
          </Descriptions>

          {/* 其他业务详情 */}
          {otherBusinessItems && (
            <div className="mt-4">
              <h5 className="mb-3">其他业务详情</h5>
              <Descriptions bordered size="small" column={1} items={otherBusinessItems} />
            </div>
          )}
        </div>
      )}

      <Form form={form} layout="vertical" initialValues={{ status: ExpenseStatus.Approved }}>
        <div className="text-center mb-6">
          <Form.Item name="status" className="mb-8">
            <Radio.Group
              buttonStyle="solid"
              size="large"
              className="audit-button-group"
              optionType="button"
            >
              <Radio.Button value={ExpenseStatus.Approved} className="audit-button-approved">
                <CheckOutlined style={{ marginRight: '8px' }} />
                审核通过
              </Radio.Button>
              <Radio.Button value={ExpenseStatus.Rejected} className="audit-button-rejected">
                <CloseOutlined style={{ marginRight: '8px' }} />
                审核退回
              </Radio.Button>
            </Radio.Group>
          </Form.Item>
        </div>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}
        >
          {({ getFieldValue }) =>
            getFieldValue('status') === ExpenseStatus.Rejected && (
              <Form.Item
                name="reason"
                label="退回原因"
                rules={[{ required: true, message: '请输入退回原因' }]}
              >
                <Input.TextArea rows={4} placeholder="请输入退回原因" />
              </Form.Item>
            )
          }
        </Form.Item>

        <Form.Item className="text-right mb-0 mt-6">
          <Button onClick={handleCancel} className="mr-2">
            取消
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            确认
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default AuditModal
