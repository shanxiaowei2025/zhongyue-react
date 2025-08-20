import { io, Socket } from 'socket.io-client'
import type { WebSocketNotificationData } from '../types/notification'

export type NotificationEventCallback = (data: WebSocketNotificationData) => void
export type ConnectionEventCallback = () => void
export type ErrorEventCallback = (error: Error) => void

class WebSocketService {
  private socket: Socket | null = null
  private isConnecting = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 3
  private reconnectDelay = 2000 // 2秒
  private maxReconnectDelay = 10000 // 10秒

  // 事件回调
  private onNotificationCallbacks: NotificationEventCallback[] = []
  private onConnectCallbacks: ConnectionEventCallback[] = []
  private onDisconnectCallbacks: ConnectionEventCallback[] = []
  private onErrorCallbacks: ErrorEventCallback[] = []

  // 获取WebSocket服务器地址
  private getServerUrl(): string {
    const hostname = window.location.hostname
    const port = window.location.port
    const protocol = window.location.protocol

    // 开发环境：使用localhost直连WebSocket服务器
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'ws://127.0.0.1:3000/ws'
    }

    // 生产环境：根据当前协议确定WebSocket协议
    if (protocol === 'https:') {
      // HTTPS环境下使用WSS协议，通过当前域名连接
      return `wss://${hostname}${port ? `:${port}` : ''}/ws`
    } else {
      // HTTP环境下使用WS协议
      return `ws://${hostname}${port ? `:${port}` : ''}/ws`
    }
  }

  // 连接WebSocket
  connect(): void {
    if (this.socket?.connected || this.isConnecting) {
      console.log('WebSocket已连接或正在连接中')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('未找到认证token，无法建立WebSocket连接')
      return
    }

    this.isConnecting = true
    const serverUrl = this.getServerUrl()

    console.log('正在连接WebSocket服务器:', serverUrl)

    this.socket = io(serverUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'], // 支持降级到polling
      timeout: 10000, // 减少超时时间到10秒
      forceNew: true,
      reconnection: true, // 启用自动重连
      reconnectionAttempts: 3, // 减少最大重连次数
      reconnectionDelay: 2000, // 增加重连延迟到2秒
      reconnectionDelayMax: 10000, // 增加最大重连延迟到10秒
    })

    this.setupEventListeners()
  }

  // 设置事件监听器
  private setupEventListeners(): void {
    if (!this.socket) return

    // 连接成功
    this.socket.on('connect', () => {
      console.log('WebSocket连接成功, Socket ID:', this.socket?.id)
      this.isConnecting = false
      this.reconnectAttempts = 0
      this.onConnectCallbacks.forEach(callback => callback())
    })

    // 连接失败
    this.socket.on('connect_error', error => {
      console.error('WebSocket连接失败:', error.message)
      this.isConnecting = false
      this.handleReconnect()
      this.onErrorCallbacks.forEach(callback => callback(error))
    })

    // 断开连接
    this.socket.on('disconnect', reason => {
      console.log('WebSocket连接断开:', reason)
      this.isConnecting = false
      this.onDisconnectCallbacks.forEach(callback => callback())

      // 如果不是主动断开，尝试重连
      if (reason !== 'io client disconnect') {
        this.handleReconnect()
      }
    })

    // 监听新通知事件
    this.socket.on('new-notification', (data: WebSocketNotificationData) => {
      console.log('收到新通知:', data)
      this.onNotificationCallbacks.forEach(callback => callback(data))
    })
  }

  // 处理重连逻辑
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('WebSocket重连次数已达上限，停止重连')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    )

    console.log(`WebSocket将在${delay}ms后进行第${this.reconnectAttempts}次重连`)

    setTimeout(() => {
      if (!this.socket?.connected) {
        this.connect()
      }
    }, delay)
  }

  // 断开连接
  disconnect(): void {
    if (this.socket) {
      console.log('主动断开WebSocket连接')
      this.socket.disconnect()
      this.socket = null
    }
    this.isConnecting = false
    this.reconnectAttempts = 0
  }

  // 检查连接状态
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  // 注册新通知回调
  onNotification(callback: NotificationEventCallback): () => void {
    this.onNotificationCallbacks.push(callback)
    // 返回取消注册函数
    return () => {
      const index = this.onNotificationCallbacks.indexOf(callback)
      if (index > -1) {
        this.onNotificationCallbacks.splice(index, 1)
      }
    }
  }

  // 注册连接成功回调
  onConnect(callback: ConnectionEventCallback): () => void {
    this.onConnectCallbacks.push(callback)
    return () => {
      const index = this.onConnectCallbacks.indexOf(callback)
      if (index > -1) {
        this.onConnectCallbacks.splice(index, 1)
      }
    }
  }

  // 注册断开连接回调
  onDisconnect(callback: ConnectionEventCallback): () => void {
    this.onDisconnectCallbacks.push(callback)
    return () => {
      const index = this.onDisconnectCallbacks.indexOf(callback)
      if (index > -1) {
        this.onDisconnectCallbacks.splice(index, 1)
      }
    }
  }

  // 注册错误回调
  onError(callback: ErrorEventCallback): () => void {
    this.onErrorCallbacks.push(callback)
    return () => {
      const index = this.onErrorCallbacks.indexOf(callback)
      if (index > -1) {
        this.onErrorCallbacks.splice(index, 1)
      }
    }
  }
}

// 导出单例实例
export const webSocketService = new WebSocketService()
export default webSocketService
