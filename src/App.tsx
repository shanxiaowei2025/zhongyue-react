import { Suspense } from 'react'
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { router } from './routes'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import './index.css'

// 设置 dayjs 全局配置
dayjs.locale('zh-cn')
dayjs.extend(customParseFormat)

// 定义主题色
const theme = {
  token: {
    colorPrimary: '#9B2C2C', // 主题色改为暗红色
    colorLink: '#9B2C2C', // 链接色
    colorLinkHover: '#822727', // 链接悬浮色
    colorPrimaryHover: '#822727', // 主题色悬浮
    colorPrimaryActive: '#63171B', // 主题色激活
    colorError: '#E53E3E', // 错误色保持鲜红色
    colorErrorHover: '#C53030', // 错误色悬浮
    colorErrorActive: '#9B2C2C', // 错误色激活
  },
  components: {
    Button: {
      colorPrimary: '#9B2C2C',
      algorithm: true,
      // 危险按钮使用鲜红色
      dangerColor: '#E53E3E',
    },
    Menu: {
      colorItemBg: 'transparent',
      colorItemText: '#4A5568',
      colorItemTextSelected: '#9B2C2C',
      colorItemBgSelected: '#FFF5F5',
    },
    Form: {
      labelRequiredMarkColor: '#E53E3E', // 必填项标记使用鲜红色
    },
  },
}

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={theme}
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
