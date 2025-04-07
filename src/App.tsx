import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { router } from './routes'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// 设置 dayjs 全局配置
dayjs.locale('zh-cn')
dayjs.extend(customParseFormat)

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
