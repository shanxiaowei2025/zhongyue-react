import axios, { AxiosResponse } from 'axios'
import type { ApiResponse } from '../types'

console.log('当前API基础URL:', import.meta.env.VITE_API_BASE_URL)

// 创建 axios 实例
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加日志
    console.log('API请求:', {
      url: config.url,
      method: config.method,
      data: config.data,
      headers: config.headers,
      baseURL: config.baseURL,
      fullUrl: config.baseURL && config.url ? `${config.baseURL}${config.url}` : config.url
    })
    
    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 添加响应日志
    console.log('API响应原始数据:', response.data)
    
    const res = response.data as ApiResponse<unknown>
    // 后端接口返回的 code 为 0 表示成功
    if (res.code !== 0) {
      console.error('响应错误:', res)
      // 处理错误
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    // 返回原始响应，适应AxiosResponse类型
    return Promise.resolve(response)
  },
  error => {
    // 添加详细的错误日志
    console.error('API错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      config: error.config
    })
    
    // 处理错误
    if (error.response?.status === 401) {
      // 未授权，清除 token 并跳转到登录页
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 封装 HTTP 请求方法
const request = {
  get<T>(url: string, params?: object): Promise<T> {
    return instance.get(url, { params }).then(res => res.data)
  },
  post<T>(url: string, data?: object): Promise<T> {
    return instance.post(url, data).then(res => res.data)
  },
  put<T>(url: string, data?: object): Promise<T> {
    return instance.put(url, data).then(res => res.data)
  },
  delete<T>(url: string): Promise<T> {
    return instance.delete(url).then(res => res.data)
  },
}

export default request
