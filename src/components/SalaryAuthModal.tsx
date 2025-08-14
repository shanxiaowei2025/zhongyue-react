import React, { useState } from 'react'
import { Modal, Form, Input, Button, message, Alert, Space } from 'antd'
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { salaryAuthApi } from '../api/salaryAuth'
import { useSalaryAuthStore } from '../store/salaryAuth'

interface SalaryAuthModalProps {
  visible: boolean
  onSuccess: () => void
  onCancel?: () => void
  title?: string
  description?: string
}

const SalaryAuthModal: React.FC<SalaryAuthModalProps> = ({
  visible,
  onSuccess,
  onCancel,
  title = '薪资密码验证',
  description = '请输入您的薪资查看密码以访问薪资信息',
}) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const { setToken } = useSalaryAuthStore()

  // 检查用户是否已设置薪资密码
  const checkPasswordStatus = async () => {
    setCheckingStatus(true)
    try {
      const status = await salaryAuthApi.checkSalaryPasswordStatus()
      setHasPassword(status.hasPassword)
      return status.hasPassword
    } catch (error: any) {
      console.error('检查密码状态失败:', error)
      // 错误处理由拦截器统一处理
      return false
    } finally {
      setCheckingStatus(false)
    }
  }

  // 当弹窗打开时检查密码状态
  React.useEffect(() => {
    if (visible) {
      checkPasswordStatus()
      // 延迟重置表单，避免form还未渲染完成
      setTimeout(() => {
        form.resetFields()
      }, 0)
    }
  }, [visible, form])

  // 设置薪资密码
  const handleSetPassword = async (values: { salaryPassword: string; confirmPassword: string }) => {
    if (values.salaryPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      const result = await salaryAuthApi.setSalaryPassword(values.salaryPassword)
      if (result.success) {
        message.success('薪资密码设置成功')
        setHasPassword(true)
        form.resetFields()
        // 设置密码后自动验证
        await handleVerifyPassword({ salaryPassword: values.salaryPassword })
      } else {
        throw new Error(result.message || '设置失败')
      }
    } catch (error: any) {
      console.error('设置薪资密码失败:', error)
      message.error(error?.response?.data?.message || '设置失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 验证薪资密码
  const handleVerifyPassword = async (values: { salaryPassword: string }) => {
    setLoading(true)
    try {
      const result = await salaryAuthApi.verifySalaryPassword(values.salaryPassword)
      if (result.success) {
        // 存储token信息 - 根据实际API响应结构
        const expiresAt = Date.now() + result.data.expiresIn * 1000 // expiresIn是秒数，转换为时间戳
        setToken({
          token: result.data.salaryAccessToken,
          expiresAt: expiresAt,
        })

        message.success('验证成功')
        onSuccess()
      } else {
        message.error(result.message || '密码错误')
      }
    } catch (error: any) {
      console.error('验证薪资密码失败:', error)
      message.error(error?.response?.data?.message || '验证失败，请检查密码是否正确')
    } finally {
      setLoading(false)
    }
  }

  // 渲染设置密码表单
  const renderSetPasswordForm = () => (
    <Form form={form} layout="vertical" onFinish={handleSetPassword} autoComplete="off">
      <Alert
        message="首次设置薪资密码"
        description="您还没有设置薪资查看密码，请先设置一个6-20位的密码用于保护您的薪资信息。"
        type="info"
        showIcon
        className="mb-4"
      />

      <Form.Item
        name="salaryPassword"
        label="薪资密码"
        rules={[
          { required: true, message: '请输入薪资密码' },
          { min: 6, message: '密码长度不能少于6位' },
          { max: 20, message: '密码长度不能超过20位' },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="请输入6-20位薪资密码"
          iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        label="确认密码"
        rules={[
          { required: true, message: '请确认薪资密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('salaryPassword') === value) {
                return Promise.resolve()
              }
              return Promise.reject(new Error('两次输入的密码不一致'))
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="请再次输入密码确认"
          iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        />
      </Form.Item>

      <Form.Item className="mb-0">
        <Space className="w-full justify-end">
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            设置密码
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )

  // 渲染验证密码表单
  const renderVerifyForm = () => (
    <Form form={form} layout="vertical" onFinish={handleVerifyPassword} autoComplete="off">
      <Alert
        message="薪资信息需要验证"
        description={description}
        type="warning"
        showIcon
        className="mb-4"
      />

      <Form.Item
        name="salaryPassword"
        label="薪资密码"
        rules={[{ required: true, message: '请输入薪资密码' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="请输入您的薪资查看密码"
          iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          onPressEnter={() => form.submit()}
        />
      </Form.Item>

      <Form.Item className="mb-0">
        <Space className="w-full justify-end">
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            验证
          </Button>
        </Space>
      </Form.Item>
    </Form>
  )

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={480}
      centered
      maskClosable={false}
      destroyOnClose
    >
      {checkingStatus ? (
        <div className="text-center py-8">
          <div className="text-gray-500">正在检查密码状态...</div>
        </div>
      ) : hasPassword === false ? (
        renderSetPasswordForm()
      ) : (
        renderVerifyForm()
      )}
    </Modal>
  )
}

export default SalaryAuthModal
