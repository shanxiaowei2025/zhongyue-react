import React from 'react'
import { Modal, Form, Radio, Input, Button } from 'antd'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { ExpenseStatus } from '../../types/expense'
import './audit-modal.css'

interface AuditModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (values: { status: ExpenseStatus; reason?: string }) => void
}

const AuditModal: React.FC<AuditModalProps> = ({ visible, onClose, onConfirm }) => {
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

  return (
    <Modal title="费用审核" open={visible} onCancel={handleCancel} footer={null} width={600}>
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
