import axios, { AxiosResponse, ResponseType } from 'axios'
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
        // 对象类型处理 - 数组我们需要特殊处理
        if (Array.isArray(value)) {
          // 数组值按照标准RESTful API约定处理
          value.forEach(item => {
            searchParams.append(`${key}[]`, String(item))
          })
        } else if (typeof value === 'object' && value !== null) {
          // 避免将对象序列化为JSON字符串，而是展平对象的属性
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (subValue !== undefined && subValue !== null && subValue !== '') {
              searchParams.append(subKey, String(subValue))
            }
          })
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
    // 如果是blob类型，直接返回响应
    if (response.config.responseType === 'blob') {
      return response
    }
    
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

    // 获取请求URL和方法
    const requestUrl = error.config?.url || ''
    const requestMethod = error.config?.method || ''

    // 判断是否是登录请求
    const isLoginRequest =
      requestUrl.includes('/auth/login') && requestMethod.toLowerCase() === 'post'

    // 判断是否是修改密码请求
    const isChangePasswordRequest = requestUrl.includes('change-password')

    // 处理不同HTTP状态码错误
    if (error.response?.status === 401) {
      // 根据不同请求类型处理401错误
      if (isLoginRequest) {
        // 登录失败，不需要清除token或跳转
        // 错误信息已由后端提供，不需额外处理
      } else if (isChangePasswordRequest) {
        // 修改密码错误，不需要清除token或跳转
        // 错误信息已由后端提供，不需额外处理
      } else {
        // 其他API的401错误，表示登录已过期
        // 清除token并跳转到登录页
        localStorage.removeItem('token')
        localStorage.removeItem('user')

        // 显示错误信息
        message.error('登录已过期，请重新登录')

        // 避免在登录页面上重复跳转，造成无限循环
        const currentPath = window.location.pathname
        if (currentPath !== '/login') {
          // 延迟跳转，以便用户看到提示
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
        }
      }
    } else if (error.response?.status === 403) {
      // 处理403错误，显示后端返回的错误消息
      const errorMessage = error.response?.data?.message || '权限不足，无法执行此操作'
      message.error(errorMessage)
      
      // 可以根据需要跳转到403页面，但不要阻止显示错误消息
      // 已经注释掉以下代码，因为我们希望用户看到确切的错误消息
      // setTimeout(() => {
      //   window.location.href = '/403'
      // }, 1500)
    }

    return Promise.reject(error)
  }
)

// 封装 HTTP 请求方法
const request = {
  get<T>(url: string, params?: object, responseType?: ResponseType): Promise<T> {
    // 直接使用params作为请求参数，不额外包装
    return instance.get(url, { params, responseType }).then(res => {
      // 如果是blob类型，直接返回response.data
      if (responseType === 'blob') {
        return res.data as T
      }
      return res.data
    })
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
