import React, { useState, useEffect } from 'react'
import { Card, Button, Form, Input, message, Alert, Descriptions, Space, Modal } from 'antd'
import {
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { showValidationError, showSuccess, showError, showInfo } from '../utils/messageHelper'
import { salaryAuthApi } from '../api/salaryAuth'
import type { SalaryPasswordStatus } from '../types/salaryAuth'
import dayjs from 'dayjs'

const SalaryPasswordManagement: React.FC = () => {
  const [setPasswordForm] = Form.useForm()
  const [changePasswordForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [passwordStatus, setPasswordStatus] = useState<SalaryPasswordStatus | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  // 获取密码状态
  const fetchPasswordStatus = async () => {
    setLoadingStatus(true)
    try {
      const status = await salaryAuthApi.checkSalaryPasswordStatus()
      setPasswordStatus(status)
    } catch (error: any) {
      console.error('获取薪资密码状态失败:', error)
      // 错误处理由拦截器统一处理
    } finally {
      setLoadingStatus(false)
    }
  }

  useEffect(() => {
    fetchPasswordStatus()
  }, [])

  // 设置薪资密码
  const handleSetPassword = async (values: { salaryPassword: string; confirmPassword: string }) => {
    if (values.salaryPassword !== values.confirmPassword) {
      showValidationError.passwordMismatch()
      return
    }

    setLoading(true)
    try {
      const result = await salaryAuthApi.setSalaryPassword(values.salaryPassword)
      if (result.success) {
        showSuccess.passwordSet()
        setPasswordForm.resetFields()
        await fetchPasswordStatus() // 刷新状态
      } else {
        showError.passwordSet()
      }
    } catch (error: any) {
      console.error('设置薪资密码失败:', error)
      // 错误处理由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  // 修改薪资密码
  const handleChangePassword = async (values: {
    currentSalaryPassword: string
    newSalaryPassword: string
    confirmPassword: string
  }) => {
    if (values.newSalaryPassword !== values.confirmPassword) {
      showValidationError.newPasswordMismatch()
      return
    }

    if (values.currentSalaryPassword === values.newSalaryPassword) {
      showValidationError.passwordSameAsOld()
      return
    }

    setLoading(true)
    try {
      const result = await salaryAuthApi.changeSalaryPassword(
        values.currentSalaryPassword,
        values.newSalaryPassword
      )
      if (result.success) {
        showSuccess.passwordChanged()
        changePasswordForm.resetFields()
        await fetchPasswordStatus() // 刷新状态
      } else {
        showError.passwordChange()
      }
    } catch (error: any) {
      console.error('修改薪资密码失败:', error)
      // 错误处理由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  // 重置密码确认
  const handleResetPassword = () => {
    Modal.confirm({
      title: '确认重置薪资密码',
      icon: <ExclamationCircleOutlined />,
      content: (
        <div>
          <p>重置后您需要重新设置薪资密码。</p>
          <p className="text-red-500">此操作不可撤销，请谨慎操作！</p>
        </div>
      ),
      okText: '确认重置',
      okType: 'danger',
      cancelText: '取消',
      onOk() {
        showInfo.contactAdmin()
      },
    })
  }

  if (loadingStatus) {
    return (
      <Card title="薪资密码管理" loading={true}>
        <div className="text-center py-8">
          <div className="text-gray-500">正在加载密码状态...</div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 密码状态信息 */}
      <Card title="薪资密码状态">
        <Descriptions bordered size="small">
          <Descriptions.Item label="密码状态" span={3}>
            {passwordStatus?.hasPassword ? (
              <div className="flex items-center text-green-600">
                <CheckCircleOutlined className="mr-2" />
                已设置
              </div>
            ) : (
              <div className="flex items-center text-orange-600">
                <ExclamationCircleOutlined className="mr-2" />
                未设置
              </div>
            )}
          </Descriptions.Item>
          {passwordStatus?.hasPassword && passwordStatus.passwordSetAt && (
            <Descriptions.Item label="设置时间" span={3}>
              {dayjs(passwordStatus.passwordSetAt).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          )}
        </Descriptions>

        <Alert
          message="薪资密码说明"
          description={
            <div>
              <p>• 薪资密码用于保护您的薪资信息，独立于登录密码</p>
              <p>• 访问薪资信息时需要验证薪资密码</p>
              <p>• 密码长度：6-20位字符</p>
              <p>• 为了安全，建议定期更换薪资密码</p>
            </div>
          }
          type="info"
          showIcon
          className="mt-4"
        />
      </Card>

      {/* 设置或修改密码 */}
      {!passwordStatus?.hasPassword ? (
        // 首次设置密码
        <Card title="设置薪资密码">
          <Alert
            message="首次设置"
            description="您还没有设置薪资密码，请设置一个密码来保护您的薪资信息。"
            type="warning"
            showIcon
            className="mb-4"
          />

          <Form
            form={setPasswordForm}
            layout="vertical"
            onFinish={handleSetPassword}
            autoComplete="off"
          >
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

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                设置密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ) : (
        // 修改密码
        <Card title="修改薪资密码">
          <Form
            form={changePasswordForm}
            layout="vertical"
            onFinish={handleChangePassword}
            autoComplete="off"
          >
            <Form.Item
              name="currentSalaryPassword"
              label="当前薪资密码"
              rules={[{ required: true, message: '请输入当前薪资密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入当前薪资密码"
                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item
              name="newSalaryPassword"
              label="新薪资密码"
              rules={[
                { required: true, message: '请输入新薪资密码' },
                { min: 6, message: '密码长度不能少于6位' },
                { max: 20, message: '密码长度不能超过20位' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('currentSalaryPassword') !== value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('新密码不能与当前密码相同'))
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请输入6-20位新薪资密码"
                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              rules={[
                { required: true, message: '请确认新薪资密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newSalaryPassword') === value) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('两次输入的新密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="请再次输入新密码确认"
                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={loading}>
                  修改密码
                </Button>
                <Button onClick={handleResetPassword} danger>
                  重置密码
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  )
}

export default SalaryPasswordManagement
