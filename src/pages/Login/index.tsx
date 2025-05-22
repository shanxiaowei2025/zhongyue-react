import { Formik, Form, Field, FieldInputProps } from 'formik'
import { Button, Card, Input, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate, Navigate } from 'react-router-dom'
import * as Yup from 'yup'
import { useAuthStore } from '../../store/auth'
import { login } from '../../api/auth'
import type { LoginForm, ApiResponse } from '../../types'

const loginSchema = Yup.object().shape({
  username: Yup.string().required('请输入用户名'),
  password: Yup.string().required('请输入密码'),
})

const Login = () => {
  const navigate = useNavigate()
  const { setUser, setToken, isAuthenticated, startTimer, setPasswordUpdatedAt, showPasswordModal } = useAuthStore()

  // 如果用户已登录，则自动重定向到主页
  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (values: LoginForm) => {
    try {
      // 调用实际的登录API
      const response = (await login(values)) as ApiResponse<{
        access_token: string
        user_info: {
          id: number
          username: string
          roles: string[]
          phone: string | null
          email: string
          passwordUpdatedAt?: string
        }
      }>

      console.log('登录响应完整数据:', response)

      // 判断是否有数据
      if (response && response.code === 0 && response.data) {
        // access_token 和 user_info 在response.data里面
        const { access_token, user_info } = response.data

        console.log('获取到token和用户信息:', { access_token, user_info })

        // 保存token
        setToken(access_token)

        // 将用户信息转换为应用需要的格式
        const user = {
          id: user_info.id,
          username: user_info.username,
          email: user_info.email,
          phone: user_info.phone || '',
          roles: user_info.roles,
          // 以下是必要的字段，但API没有返回，设置默认值
          password: '',
          nickname: user_info.username,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg',
          sex: 0 as 0 | 1,
          status: 1 as 0 | 1,
          remark: '',
          user_groups: user_info.roles,
          user_permissions: [],
          is_superuser: user_info.roles.includes('admin'),
          is_staff: true,
          is_active: true,
          is_expense_auditor: false,
          date_joined: new Date().toISOString(),
          first_name: '',
          last_name: '',
          create_time: new Date().toISOString(),
          update_time: new Date().toISOString(),
        }

        setUser(user)
        
        // 保存密码最后更新时间
        if (user_info.passwordUpdatedAt) {
          setPasswordUpdatedAt(user_info.passwordUpdatedAt)
          
          // 检查密码是否过期 (3个月)
          const lastUpdate = new Date(user_info.passwordUpdatedAt)
          const now = new Date()
          const diffTime = now.getTime() - lastUpdate.getTime()
          const threeMonths = 90 * 24 * 60 * 60 * 1000
          
          if (diffTime > threeMonths) {
            // 密码过期，显示修改密码弹窗
            showPasswordModal()
          }
        }
        
        // 启动自动登出计时器
        startTimer()
        
        message.success('登录成功')
        navigate('/')
      } else {
        console.error('登录响应格式不符合预期:', response)
        throw new Error(response?.message || '登录失败，响应数据格式不正确')
      }
    } catch (error: any) {
      console.error('登录失败:', error)

      // 显示更详细的错误信息
      let errorMessage = '登录失败，请检查用户名和密码'

      if (error.response?.data?.message) {
        // 使用后端返回的错误信息
        errorMessage = error.response.data.message
      } else if (error.message) {
        // 使用错误对象的消息
        errorMessage = error.message
      }

      message.error(errorMessage)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-96">
        <div className="flex justify-center mb-8">
          <img src="/images/logo.png" alt="中岳会计" className="w-48 h-auto" />
        </div>

        <Formik
          initialValues={{ username: '', password: '', remember: false }}
          validationSchema={loginSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched }) => (
            <Form>
              <div className="mb-4">
                <Field name="username">
                  {({ field }: { field: FieldInputProps<string> }) => (
                    <Input {...field} prefix={<UserOutlined />} placeholder="用户名" size="large" />
                  )}
                </Field>
                {errors.username && touched.username && (
                  <div className="text-red-500 text-sm mt-1">{errors.username}</div>
                )}
              </div>

              <div className="mb-4">
                <Field name="password">
                  {({ field }: { field: FieldInputProps<string> }) => (
                    <Input.Password
                      {...field}
                      prefix={<LockOutlined />}
                      placeholder="密码"
                      size="large"
                    />
                  )}
                </Field>
                {errors.password && touched.password && (
                  <div className="text-red-500 text-sm mt-1">{errors.password}</div>
                )}
              </div>

              <div className="mb-4 text-sm text-gray-500">
                注意：系统将在30分钟无操作后自动登出
              </div>

              <Button type="primary" htmlType="submit" block size="large">
                登录
              </Button>
            </Form>
          )}
        </Formik>
      </Card>
    </div>
  )
}

export default Login
