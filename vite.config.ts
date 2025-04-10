import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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
          // 不进行路径重写，保留/api前缀
          // rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('代理错误:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('代理请求:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('代理响应:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  }
})
