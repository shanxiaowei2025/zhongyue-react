import axios, { AxiosResponse, ResponseType } from 'axios'
import { message } from 'antd'
import type { ApiResponse } from '../types'

// 从环境变量获取API基础URL，如果未定义则默认为/api
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
// API服务器配置完成

// 创建 axios 实例
const instance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 0, // 不设置超时时间
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: params => {
    // 创建一个URLSearchParams对象用于序列化
    const searchParams = new URLSearchParams()

    // 遍历参数对象的所有key
    Object.entries(params).forEach(([key, value]) => {
      // 过滤掉空值，但保留空字符串（用于业务类型的空值查询）
      if (value !== undefined && value !== null) {
        // 对象类型处理 - 数组我们需要特殊处理
        if (Array.isArray(value)) {
          // 数组值处理：对于多选参数，使用相同的参数名
          value.forEach(item => {
            searchParams.append(key, String(item))
          })
        } else if (typeof value === 'object' && value !== null) {
          // 避免将对象序列化为JSON字符串，而是展平对象的属性
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (subValue !== undefined && subValue !== null) {
              searchParams.append(subKey, String(subValue))
            }
          })
        } else if (value !== '') {
          // 非空字符串直接添加
          searchParams.append(key, String(value))
        } else if (value === '' && key === 'businessType') {
          // 特殊处理：业务类型的空字符串需要发送
          searchParams.append(key, '')
        }
      }
    })

    const queryString = searchParams.toString()
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

    // 请求配置处理完成

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

    // 响应数据处理

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

    // 判断是否是薪资密码验证请求
    const isSalaryPasswordRequest = requestUrl.includes('/auth/salary/verify')

    // 统一错误信息提取：优先使用后端返回的message，其次使用默认错误信息
    const backendMessage = error.response?.data?.message
    const statusCode = error.response?.status

    // 处理不同HTTP状态码错误
    if (statusCode === 401) {
      // 根据不同请求类型处理401错误
      if (isLoginRequest) {
        // 登录失败，显示后端返回的错误信息
        const errorMessage = backendMessage || '登录失败，请检查用户名和密码'
        message.error(errorMessage)
      } else if (isChangePasswordRequest) {
        // 修改密码错误，显示后端返回的错误信息
        const errorMessage = backendMessage || '修改密码失败'
        message.error(errorMessage)
      } else if (isSalaryPasswordRequest) {
        // 薪资密码验证错误，不清除token，不跳转登录页，让组件自己处理
        // 这里不显示message，让SalaryAuthModal组件自己处理错误显示
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
    } else if (statusCode === 403) {
      // 处理403错误，显示后端返回的错误消息
      const errorMessage = backendMessage || '导出失败，请联系管理员添加导出权限'
      message.error(errorMessage)
    } else if (statusCode) {
      // 处理其他HTTP错误状态码（400, 500等），统一显示后端返回的错误信息
      const errorMessage = backendMessage || `请求失败 (${statusCode})`
      message.error(errorMessage)
    } else {
      // 网络错误或其他非HTTP错误
      const errorMessage = error.message || '网络错误，请检查网络连接'
      message.error(errorMessage)
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
  post<T>(url: string, data?: object, responseType?: ResponseType): Promise<T> {
    // 对于FormData，让浏览器自动设置Content-Type（包含boundary）
    const config =
      data instanceof FormData
        ? { headers: { 'Content-Type': undefined }, responseType }
        : { responseType }
    return instance.post(url, data, config).then(res => {
      // 如果是blob类型，直接返回response.data
      if (responseType === 'blob') {
        return res.data as T
      }
      return res.data
    })
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

// 创建不需要认证的axios实例（用于合同token相关API）
const publicInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 0, // 不设置超时时间
  headers: {
    'Content-Type': 'application/json',
  },
})

// 公共实例的响应拦截器（不处理401认证错误）
publicInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 如果是blob类型，直接返回响应
    if (response.config.responseType === 'blob') {
      return response
    }

    // 公共API响应处理

    const res = response.data as ApiResponse<unknown>

    // 后端接口返回的code不为0表示业务逻辑错误
    if (res.code !== 0) {
      console.warn('公共API业务逻辑错误:', res)
      // 对于公共API，不显示错误信息，让调用方处理
      return Promise.reject(new Error(res.message || '请求失败'))
    }

    return response
  },
  error => {
    console.error('公共API错误:', error)
    // 对于公共API，不处理401认证错误，直接返回错误
    return Promise.reject(error)
  }
)

// 不需要认证的请求方法
export const publicRequest = {
  get<T>(url: string, params?: object): Promise<T> {
    return publicInstance.get(url, { params }).then(res => res.data)
  },
  post<T>(url: string, data?: object): Promise<T> {
    const config = data instanceof FormData ? { headers: { 'Content-Type': undefined } } : {}
    return publicInstance.post(url, data, config).then(res => res.data)
  },
}

// 创建静默请求实例（不显示任何成功或错误消息）
const silentInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 0,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: params => {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach(item => {
            searchParams.append(key, String(item))
          })
        } else if (typeof value === 'object' && value !== null) {
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (subValue !== undefined && subValue !== null) {
              searchParams.append(subKey, String(subValue))
            }
          })
        } else if (value !== '') {
          searchParams.append(key, String(value))
        } else if (value === '' && key === 'businessType') {
          searchParams.append(key, '')
        }
      }
    })
    return searchParams.toString()
  },
})

// 静默实例的请求拦截器
silentInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('静默请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 静默实例的响应拦截器（不显示任何消息）
silentInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    if (response.config.responseType === 'blob') {
      return response
    }
    const res = response.data as ApiResponse<unknown>
    if (res.code !== 0) {
      console.warn('静默API业务逻辑错误:', res)
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return response
  },
  error => {
    console.error('静默API错误:', error)
    const statusCode = error.response?.status
    if (statusCode === 401) {
      const requestUrl = error.config?.url || ''
      const requestMethod = error.config?.method || ''
      const isLoginRequest =
        requestUrl.includes('/auth/login') && requestMethod.toLowerCase() === 'post'
      if (!isLoginRequest) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        const currentPath = window.location.pathname
        if (currentPath !== '/login') {
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
        }
      }
    }
    return Promise.reject(error)
  }
)

// 静默请求方法
export const silentRequest = {
  get<T>(url: string, params?: object, responseType?: ResponseType): Promise<T> {
    return silentInstance.get(url, { params, responseType }).then(res => {
      if (responseType === 'blob') {
        return res.data as T
      }
      return res.data
    })
  },
  post<T>(url: string, data?: object): Promise<T> {
    const config = data instanceof FormData ? { headers: { 'Content-Type': undefined } } : {}
    return silentInstance.post(url, data, config).then(res => res.data)
  },
  put<T>(url: string, data?: object): Promise<T> {
    return silentInstance.put(url, data).then(res => res.data)
  },
  patch<T>(url: string, data?: object): Promise<T> {
    return silentInstance.patch(url, data).then(res => res.data)
  },
  delete<T>(url: string): Promise<T> {
    return silentInstance.delete(url).then(res => res.data)
  },
}

export default request
