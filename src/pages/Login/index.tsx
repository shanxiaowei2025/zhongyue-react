import { Formik, Form, Field, FieldInputProps } from 'formik'
import { Button, Card, Input, message } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import * as Yup from 'yup'
import { useAuthStore } from '../../store/auth'
// import { login } from '../../api/user'
import type { LoginForm, User } from '../../types'

const loginSchema = Yup.object().shape({
  username: Yup.string().required('请输入用户名'),
  password: Yup.string().required('请输入密码'),
})

// 模拟用户数据
const mockUsers = [
  { username: 'admin', password: 'admin', role: 'admin' },
  { username: 'user', password: 'user', role: 'user' },
]

const Login = () => {
  const navigate = useNavigate()
  const { setUser, setToken } = useAuthStore()

  const handleSubmit = async (values: LoginForm) => {
    try {
      // 模拟登录逻辑
      const user = mockUsers.find(
        u => u.username === values.username && u.password === values.password
      )

      if (user) {
        // 模拟成功响应
        const mockResponse = {
          token: `mock-token-${Date.now()}`,
          user: {
            id: 1,
            username: user.username,
            password: user.password,
            nickname: '管理员',
            email: `${user.username}@example.com`,
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg',
            phone: '13800138000',
            sex: 0 as 0 | 1,
            status: 1 as 0 | 1,
            remark: '系统管理员',
            roles: ['admin'],
            user_groups: ['admin'],
            user_permissions: ['all'],
            is_superuser: true,
            is_staff: true,
            is_active: true,
            is_expense_auditor: true,
            date_joined: new Date().toISOString(),
            first_name: 'Admin',
            last_name: 'User',
            create_time: new Date().toISOString(),
            update_time: new Date().toISOString(),
          } as User,
        }

        setToken(mockResponse.token)
        setUser(mockResponse.user)
        message.success('登录成功')
        navigate('/')
      } else {
        throw new Error('用户名或密码错误')
      }
    } catch (error) {
      console.error('登录失败:', error)
      message.error('登录失败，请检查用户名和密码')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-96">
        <h1 className="text-2xl font-bold text-center mb-8">后台管理系统</h1>

        <div className="mb-4 p-3 bg-blue-50 rounded text-blue-700 text-sm">
          <p>可用的测试账号:</p>
          <p>管理员: admin / admin</p>
          <p>普通用户: user / user</p>
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

              <div className="mb-4">
                <Field name="remember" type="checkbox">
                  {({ field }: { field: FieldInputProps<boolean> }) => (
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                      <span>记住我</span>
                    </label>
                  )}
                </Field>
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
