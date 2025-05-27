import React, { useState, useEffect } from 'react'
import { Modal, Form, Input, Button, message } from 'antd'
import { useAuthStore } from '../store/auth'
import { changePassword } from '../api/auth'

interface PasswordExpiredModalProps {
  visible: boolean
}

const PasswordExpiredModal: React.FC<PasswordExpiredModalProps> = ({ visible }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [submitDisabled, setSubmitDisabled] = useState(true)
  const { setPasswordUpdatedAt, hidePasswordModal } = useAuthStore()

  // 在组件顶层使用 Form.useWatch 监听表单值变化
  const formValues = Form.useWatch([], form)

  // 监控表单字段变化，更新按钮状态
  useEffect(() => {
    // 创建一个验证函数
    const validateFields = async () => {
      try {
        // 对表单进行验证
        await form.validateFields({ validateOnly: true })

        // 检查所有必填字段是否有值
        const values = form.getFieldsValue(['oldPassword', 'newPassword', 'confirmPassword'])
        const hasAllValues = values.oldPassword && values.newPassword && values.confirmPassword

        // 检查新密码与旧密码是否相同
        const passwordsDifferent = values.oldPassword !== values.newPassword

        // 检查新密码与确认密码是否一致
        const passwordsMatch = values.newPassword === values.confirmPassword

        // 检查新密码长度
        const validLength = values.newPassword && values.newPassword.length >= 6

        // 所有条件都满足时启用按钮
        setSubmitDisabled(!(hasAllValues && passwordsDifferent && passwordsMatch && validLength))
      } catch (error) {
        // 如果出现任何错误，禁用按钮
        setSubmitDisabled(true)
      }
    }

    validateFields()
  }, [form, formValues]) // 依赖 formValues，当表单值变化时重新验证

  // 禁止用户通过点击蒙层或ESC键关闭Modal
  const handleCancel = () => {
    message.warning('您的密码已过期，必须修改密码才能继续使用系统')
  }

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的新密码不一致')
        return
      }

      // 验证新密码不能与旧密码相同
      if (values.oldPassword === values.newPassword) {
        message.error('新密码不能与当前密码相同')
        return
      }

      setLoading(true)

      const response = await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })

      if (response && response.code === 0) {
        message.success('密码修改成功')

        // 更新密码修改时间为当前时间
        const now = new Date().toISOString()
        setPasswordUpdatedAt(now)

        // 重置表单
        form.resetFields()

        // 隐藏弹窗
        hidePasswordModal()
      } else {
        message.error(response?.message || '密码修改失败，请稍后重试')
      }
    } catch (error: any) {
      console.error('修改密码失败', error)
      message.error(
        error?.response?.data?.message || error?.message || '修改密码失败，请检查原密码是否正确'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title="密码已过期，请修改密码"
      open={visible}
      onCancel={handleCancel}
      maskClosable={false} // 禁止点击蒙层关闭
      keyboard={false} // 禁止按ESC关闭
      closable={false} // 不显示关闭按钮
      footer={[
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleOk}
          disabled={submitDisabled}
        >
          修改密码
        </Button>,
      ]}
    >
      <div className="mb-4 text-red-500">
        您的密码已超过3个月未修改，出于安全考虑，必须修改密码后才能继续使用系统。
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          name="oldPassword"
          label="当前密码"
          rules={[{ required: true, message: '请输入当前密码' }]}
        >
          <Input.Password placeholder="请输入当前密码" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度不能少于6位' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('oldPassword') !== value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('新密码不能与当前密码相同'))
              },
            }),
          ]}
        >
          <Input.Password placeholder="请输入新密码，至少6位" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          rules={[
            { required: true, message: '请确认新密码' },
            { min: 6, message: '密码长度不能少于6位' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致'))
              },
            }),
          ]}
        >
          <Input.Password placeholder="请再次输入新密码" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default PasswordExpiredModal
