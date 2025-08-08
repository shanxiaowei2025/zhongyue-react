import React, { useState } from 'react'
import {
  Card,
  Descriptions,
  Button,
  Form,
  message,
  Space,
  Tag,
  Collapse,
  Input,
  Checkbox,
} from 'antd'
import { EditOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import type {
  AttendanceDeductionRecord,
  FriendCirclePaymentRecord,
} from '../../../types/salaryIntegrated'
import AmountInput from './AmountInput'

interface DeductionPanelProps {
  type: 'attendance' | 'friendCircle'
  employeeName: string
  yearMonth: string
  data?: AttendanceDeductionRecord | FriendCirclePaymentRecord
  onUpdate: (data: any) => Promise<any>
}

const DeductionPanel: React.FC<DeductionPanelProps> = ({
  type,
  employeeName,
  yearMonth,
  data,
  onUpdate,
}) => {
  const [editing, setEditing] = useState(false)
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const isAttendance = type === 'attendance'
  const title = isAttendance ? '考勤扣款' : '朋友圈扣款'

  const handleEdit = () => {
    if (data) {
      if (isAttendance) {
        const attendanceData = data as AttendanceDeductionRecord
        form.setFieldsValue({
          attendanceDeduction: attendanceData.attendanceDeduction,
          fullAttendanceBonus: attendanceData.fullAttendanceBonus,
          remark: attendanceData.remark,
        })
      } else {
        const friendCircleData = data as FriendCirclePaymentRecord
        form.setFieldsValue({
          weekOne: friendCircleData.weekOne,
          weekTwo: friendCircleData.weekTwo,
          weekThree: friendCircleData.weekThree,
          weekFour: friendCircleData.weekFour,
          payment: friendCircleData.payment,
          isCompleted: friendCircleData.isCompleted,
        })
      }
    }
    setEditing(true)
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      let updateData

      if (isAttendance) {
        updateData = {
          ...values,
          name: employeeName,
          yearMonth,
        }
      } else {
        // 计算朋友圈总数
        const totalCount =
          (values.weekOne || 0) +
          (values.weekTwo || 0) +
          (values.weekThree || 0) +
          (values.weekFour || 0)

        updateData = {
          ...values,
          totalCount,
          name: employeeName,
          yearMonth,
        }
      }

      if (data) {
        updateData.id = data.id
      }

      await onUpdate(updateData)
      setEditing(false)
      message.success(`${title}信息已更新`)
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
        <div className="text-gray-500 mb-4">暂无{title}信息</div>
        <Button type="primary" onClick={handleEdit}>
          添加{title}信息
        </Button>
      </div>
    )
  }

  const renderAttendanceContent = () => {
    const attendanceData = data as AttendanceDeductionRecord

    return editing ? (
      <Form form={form} layout="vertical">
        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="考勤扣款" name="attendanceDeduction">
            <AmountInput />
          </Form.Item>
          <Form.Item label="全勤奖励" name="fullAttendanceBonus">
            <AmountInput />
          </Form.Item>
        </div>
        <Form.Item label="备注" name="remark">
          <Input placeholder="请输入备注信息" />
        </Form.Item>
      </Form>
    ) : (
      <Card title="考勤明细" size="small">
        <Descriptions column={2} size="small">
          <Descriptions.Item label="考勤扣款">
            <span className="text-red-500 font-medium">
              -¥{attendanceData!.attendanceDeduction.toLocaleString()}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="全勤奖励">
            <span className="text-green-500 font-medium">
              +¥{attendanceData!.fullAttendanceBonus.toLocaleString()}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>
            {attendanceData!.remark || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    )
  }

  const renderFriendCircleContent = () => {
    const friendCircleData = data as FriendCirclePaymentRecord

    return editing ? (
      <Form form={form} layout="vertical">
        <Card title="周度完成情况" size="small" className="mb-4">
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="第一周" name="weekOne">
              <AmountInput showCurrency={false} precision={0} />
            </Form.Item>
            <Form.Item label="第二周" name="weekTwo">
              <AmountInput showCurrency={false} precision={0} />
            </Form.Item>
            <Form.Item label="第三周" name="weekThree">
              <AmountInput showCurrency={false} precision={0} />
            </Form.Item>
            <Form.Item label="第四周" name="weekFour">
              <AmountInput showCurrency={false} precision={0} />
            </Form.Item>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Form.Item label="扣款金额" name="payment">
            <AmountInput />
          </Form.Item>
          <Form.Item label="是否完成" name="isCompleted" valuePropName="checked">
            <Checkbox />
          </Form.Item>
        </div>
      </Form>
    ) : (
      <>
        <Card title="周度完成情况" size="small" className="mb-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-gray-500 text-sm mb-1">第一周</div>
              <div className="text-lg font-bold">{friendCircleData!.weekOne}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm mb-1">第二周</div>
              <div className="text-lg font-bold">{friendCircleData!.weekTwo}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm mb-1">第三周</div>
              <div className="text-lg font-bold">{friendCircleData!.weekThree}</div>
            </div>
            <div>
              <div className="text-gray-500 text-sm mb-1">第四周</div>
              <div className="text-lg font-bold">{friendCircleData!.weekFour}</div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <div className="text-gray-500 text-sm mb-1">总计</div>
            <div className="text-2xl font-bold text-blue-600">{friendCircleData!.totalCount}</div>
          </div>
        </Card>

        <Card title="扣款信息" size="small">
          <Descriptions column={2} size="small">
            <Descriptions.Item label="扣款金额">
              <span className="text-red-500 font-medium text-lg">
                -¥{friendCircleData!.payment.toLocaleString()}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="完成状态">
              <Tag color={friendCircleData!.isCompleted ? 'green' : 'orange'}>
                {friendCircleData!.isCompleted ? '已完成' : '未完成'}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-center">
          <h4 className="font-medium">{title}</h4>
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
        {isAttendance ? renderAttendanceContent() : renderFriendCircleContent()}
      </div>
    </div>
  )
}

export default DeductionPanel
