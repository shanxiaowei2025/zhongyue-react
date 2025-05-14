import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())
  const apiServer = env.VITE_API_SERVER || 'http://localhost:3000'

  console.log('API服务器地址:', apiServer)

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        // 开发环境代理配置
        '/api': {
          target: apiServer,
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('代理错误:', err)
            })
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('代理请求:', req.method, req.url)
            })
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('代理响应:', proxyRes.statusCode, req.url)
            })
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    build: {
      // 启用source map，方便调试
      sourcemap: mode !== 'production',
      // 配置构建优化
      chunkSizeWarningLimit: 2000,
      // 启用CSS代码分割
      cssCodeSplit: true,
      // 配置Rollup选项
      rollupOptions: {
        output: {
          // 自定义构建后静态资源的目录
          assetFileNames: 'assets/[name].[hash].[ext]',
          // 入口文件的打包配置
          entryFileNames: 'assets/[name].[hash].js',
          // 代码分割的块文件名配置
          chunkFileNames: 'assets/[name].[hash].js',
          // 手动分块策略
          manualChunks: {
            // 将React相关的库单独打包
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            // 将Ant Design单独打包
            'antd-vendor': ['antd', '@ant-design/icons'],
            // 工具库单独打包
            'utils-vendor': ['axios', 'dayjs', 'formik', 'yup', 'zustand']
          }
        }
      },
      // 生成manifest文件，用于资源分析
      manifest: true,
      // 清理构建目录
      emptyOutDir: true
    }
  }
})
