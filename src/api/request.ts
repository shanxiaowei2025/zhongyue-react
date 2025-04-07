import axios, { AxiosResponse } from 'axios'
import type { ApiResponse } from '../types'

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
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data as ApiResponse<unknown>
    if (res.code !== 200) {
      // 处理错误
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return Promise.resolve(res.data) as unknown as AxiosResponse
  },
  error => {
    // 处理错误
    if (error.response?.status === 401) {
      // 未授权，清除 token 并跳转到登录页
      localStorage.removeItem('token')
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
