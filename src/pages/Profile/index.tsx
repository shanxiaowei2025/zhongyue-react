import { useState, useEffect } from 'react'
import { Card, Button, Form, Input, message, Tabs, Spin, Tag, Descriptions } from 'antd'
import { UserOutlined, LockOutlined, PhoneOutlined } from '@ant-design/icons'
import { useAuthStore } from '../../store/auth'
import { getUserProfile, updateUserProfile, changePassword } from '../../api/auth'
import type { User } from '../../types'
import { useRoleNames } from '../../constants/roles'
import AvatarUpload from '../../components/AvatarUpload'
import SalaryPasswordManagement from '../../components/SalaryPasswordManagement'

const { TabPane } = Tabs

const Profile = () => {
  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const { user, setUser } = useAuthStore()
  const { getRoleNameFromMap, loading: rolesLoading } = useRoleNames()

  useEffect(() => {
    fetchUserInfo()
  }, [])

  const fetchUserInfo = async () => {
    if (!user) return

    setLoading(true)
    try {
      // 从后端获取用户信息
      const response = await getUserProfile()
      console.log('获取到的用户资料:', response)

      if (response && response.code === 0 && response.data) {
        setUserProfile(response.data)

        // 设置表单初始值
        profileForm.setFieldsValue({
          username: response.data.username,
          idCardNumber: response.data.idCardNumber || '',
          phone: response.data.phone || '',
        })
      } else {
        message.error('获取用户资料失败')
      }
    } catch (error) {
      console.error('获取用户信息失败', error)
      message.error('获取用户信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (values: Partial<User>) => {
    setLoading(true)
    try {
      const response = await updateUserProfile(0, {
        idCardNumber: values.idCardNumber,
        phone: values.phone || undefined,
        avatar: userProfile?.avatar || user?.avatar || '',
      })

      if (response && response.code === 0) {
        message.success('个人资料更新成功')
        // 重新获取用户信息
        fetchUserInfo()
        // 更新全局状态
        if (user) {
          setUser({
            ...user,
            idCardNumber: values.idCardNumber || user.idCardNumber,
            phone: values.phone || user.phone,
          })
        }
      } else {
        // 显示具体的错误信息
        message.error(response?.message || '更新个人资料失败，请稍后重试')
      }
    } catch (error: any) {
      console.error('更新个人资料失败', error)
      // 显示更详细的错误信息
      message.error(
        error?.response?.data?.message || error?.message || '更新个人资料失败，请检查网络连接'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (values: {
    oldPassword: string
    newPassword: string
    confirmPassword: string
  }) => {
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
    try {
      const response = await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      })

      if (response && response.code === 0) {
        message.success('密码修改成功')
        passwordForm.resetFields()

        // 更新密码修改时间
        const now = new Date().toISOString()
        useAuthStore.getState().setPasswordUpdatedAt(now)
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

  // 处理头像上传成功
  const handleAvatarUploadSuccess = async (avatarData: { fileName: string; url: string }) => {
    try {
      // 先调用API保存头像
      const response = await updateUserProfile(0, {
        avatar: avatarData.fileName, // 保存文件名到后端
      })

      if (response && response.code === 0) {
        // API保存成功后，更新本地状态
        if (user) {
          setUser({
            ...user,
            avatar: avatarData.fileName,
          })
        }

        if (userProfile) {
          setUserProfile({
            ...userProfile,
            avatar: avatarData.fileName,
          })
        }

        message.success('头像更新成功')
      } else {
        message.error('头像保存失败')
      }
    } catch (error) {
      console.error('保存头像失败:', error)
      message.error('头像保存失败')
    }
  }

  // 处理头像删除
  const handleAvatarRemove = async () => {
    try {
      // 先调用API删除头像
      const response = await updateUserProfile(0, {
        avatar: '',
      })

      if (response && response.code === 0) {
        // API删除成功后，更新本地状态
        if (user) {
          setUser({
            ...user,
            avatar: null,
          })
        }

        if (userProfile) {
          setUserProfile({
            ...userProfile,
            avatar: null,
          })
        }

        message.success('头像删除成功')
      } else {
        message.error('头像删除失败')
      }
    } catch (error) {
      console.error('删除头像失败:', error)
      message.error('头像删除失败')
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">个人资料</h1>
      <Tabs defaultActiveKey="1">
        <TabPane tab="基本信息" key="1">
          <Card>
            <Spin spinning={loading || rolesLoading}>
              <div className="mb-6 flex items-center">
                <div className="mr-6">
                  <AvatarUpload
                    value={
                      userProfile?.avatar || user?.avatar
                        ? {
                            fileName: userProfile?.avatar || user?.avatar || '',
                            url: userProfile?.avatar || user?.avatar || '',
                          }
                        : undefined
                    }
                    onChange={value => {
                      if (value) {
                        handleAvatarUploadSuccess(value)
                      } else {
                        handleAvatarRemove()
                      }
                    }}
                    onSuccess={isAutoSave => {
                      if (!isAutoSave) {
                        // 只有在不是自动保存时才重新获取用户信息
                        fetchUserInfo()
                      }
                    }}
                    size={96}
                    showDragArea={false}
                    disabled={loading}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-medium">{userProfile?.username || user?.username}</h2>
                  <p className="text-gray-500">用户ID: {userProfile?.id || user?.id}</p>
                  <div className="mt-1">
                    {userProfile?.roles &&
                      userProfile.roles.map((role: string) => (
                        <Tag color={role === 'admin' ? 'red' : 'blue'} key={role}>
                          {getRoleNameFromMap(role)}
                        </Tag>
                      ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    点击头像或上传按钮来更换头像，支持图片裁剪
                  </p>
                </div>
              </div>

              {userProfile && (
                <Descriptions title="用户详情" bordered className="mb-6">
                  <Descriptions.Item label="用户ID" span={3}>
                    {userProfile.id}
                  </Descriptions.Item>
                  <Descriptions.Item label="用户名" span={3}>
                    {userProfile.username}
                  </Descriptions.Item>
                  <Descriptions.Item label="身份证号" span={3}>
                    <div className="flex items-center">
                      <UserOutlined className="mr-2" />
                      {userProfile.idCardNumber || '未设置'}
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="手机号码" span={3}>
                    <div className="flex items-center">
                      <PhoneOutlined className="mr-2" />
                      {userProfile.phone || '未设置'}
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="角色" span={3}>
                    {userProfile.roles &&
                      userProfile.roles.map((role: string) => (
                        <Tag color={role === 'admin' ? 'red' : 'blue'} key={role} className="mr-1">
                          {getRoleNameFromMap(role)}
                        </Tag>
                      ))}
                  </Descriptions.Item>
                </Descriptions>
              )}

              <Form form={profileForm} layout="vertical" onFinish={handleUpdateProfile}>
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="用户名" disabled />
                </Form.Item>
                <Form.Item
                  name="idCardNumber"
                  label="身份证号"
                  rules={[
                    {
                      pattern: /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/,
                      message: '请输入有效的身份证号码',
                      validateTrigger: 'onBlur',
                    },
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder="身份证号（选填）" />
                </Form.Item>
                <Form.Item
                  name="phone"
                  label="手机号码"
                  rules={[
                    {
                      pattern: /^1[3-9]\d{9}$/,
                      message: '请输入有效的手机号码',
                      validateTrigger: 'onBlur',
                    },
                  ]}
                >
                  <Input prefix={<PhoneOutlined />} placeholder="手机号码" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    保存修改
                  </Button>
                </Form.Item>
              </Form>
            </Spin>
          </Card>
        </TabPane>

        <TabPane tab="修改密码" key="2">
          <Card>
            <Spin spinning={loading}>
              <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
                <Form.Item
                  name="oldPassword"
                  label="原密码"
                  rules={[{ required: true, message: '请输入原密码' }]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="原密码" />
                </Form.Item>
                <Form.Item
                  name="newPassword"
                  label="新密码"
                  rules={[
                    { required: true, message: '请输入新密码' },
                    { min: 6, message: '密码长度不能少于 6 位' },
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
                  <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="确认新密码"
                  rules={[
                    { required: true, message: '请确认新密码' },
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
                  <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    修改密码
                  </Button>
                </Form.Item>
              </Form>
            </Spin>
          </Card>
        </TabPane>

        <TabPane tab="薪资密码" key="3">
          <SalaryPasswordManagement />
        </TabPane>
      </Tabs>
    </div>
  )
}

export default Profile
