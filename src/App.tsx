import { Suspense, version as reactVersion } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, Spin, version as antdVersion } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { router } from './routes'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import customParseFormat from 'dayjs/plugin/customParseFormat'
// 导入 Ant Design v5 与 React 19 的兼容补丁
import './utils/antdCompatible'
import './index.css'

// 设置 dayjs 全局配置
dayjs.locale('zh-cn')
dayjs.extend(customParseFormat)

// 打印版本信息，帮助排查兼容性问题
console.log('React 版本:', reactVersion)
console.log('Ant Design 版本:', antdVersion)
console.info('已应用 @ant-design/v5-patch-for-react-19 补丁，解决兼容性问题')

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      form={{
        validateMessages: {
          required: '${label}不能为空',
        },
      }}
    >
      <Suspense
        fallback={
          <div className="flex h-screen w-screen items-center justify-center">
            <Spin size="large" />
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
    </ConfigProvider>
  )
}

export default App
