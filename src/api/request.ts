import axios, { AxiosResponse } from 'axios'
import { message } from 'antd'
import type { ApiResponse } from '../types'

// 从环境变量获取API基础URL，如果未定义则默认为/api
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
console.log('API服务器地址:', import.meta.env.VITE_API_SERVER)
console.log('API配置 - 基础URL:', apiBaseUrl)

// 创建 axios 实例
const instance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: params => {
    // 创建一个URLSearchParams对象用于序列化
    const searchParams = new URLSearchParams()

    // 遍历参数对象的所有key
    Object.entries(params).forEach(([key, value]) => {
      // 过滤掉空值
      if (value !== undefined && value !== null && value !== '') {
        // 如果是对象或数组，转为JSON字符串
        if (typeof value === 'object' && value !== null) {
          searchParams.append(key, JSON.stringify(value))
        } else {
          searchParams.append(key, String(value))
        }
      }
    })

    const queryString = searchParams.toString()
    console.log(`🔍 参数序列化: ${JSON.stringify(params)} → ${queryString}`)
    return queryString
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
      fullUrl: config.baseURL && config.url ? `${config.baseURL}${config.url}` : config.url,
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

    // 后端接口返回的code不为0表示业务逻辑错误
    if (res.code !== 0) {
      console.warn('API业务逻辑错误:', res)

      // 显示错误信息
      message.error(res.message || '请求失败')

      // 特定的错误码可以在这里处理
      if (res.code === 403) {
        // 权限不足
        setTimeout(() => {
          window.location.href = '/403'
        }, 1000)
      }

      return Promise.reject(new Error(res.message || '请求失败'))
    }

    // 返回原始响应，以适应原有代码
    return response
  },
  error => {
    // 添加详细的错误日志
    console.error('API错误详情:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
      config: error.config,
    })

    // 处理401未授权错误
    if (error.response?.status === 401) {
      // 未授权，清除token并跳转到登录页
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // 显示错误信息
      message.error('登录已过期，请重新登录')

      // 延迟跳转，以便用户看到提示
      setTimeout(() => {
        window.location.href = '/login'
      }, 1500)
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
  patch<T>(url: string, data?: object): Promise<T> {
    return instance.patch(url, data).then(res => res.data)
  },
  delete<T>(url: string): Promise<T> {
    return instance.delete(url).then(res => res.data)
  },
}

export default request
