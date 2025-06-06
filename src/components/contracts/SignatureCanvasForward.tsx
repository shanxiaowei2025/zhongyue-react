import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect } from 'react'
import SignaturePad from 'react-signature-canvas'
import { Button, Space } from 'antd'
import { ClearOutlined } from '@ant-design/icons'

interface SignatureCanvasProps {
  canvasProps?: {
    width?: number
    height?: number
    className?: string
  }
}

export interface SignatureCanvasRef {
  clear: () => void
  isEmpty: () => boolean
  toDataURL: (type?: string, encoderOptions?: number) => string
}

const SignatureCanvasForward = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  ({ canvasProps = {} }, ref) => {
    const sigCanvas = useRef<SignaturePad>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isEmpty, setIsEmpty] = useState(true)

    // 向父组件暴露方法
    useImperativeHandle(ref, () => ({
      clear: () => {
        if (sigCanvas.current) {
          sigCanvas.current.clear()
          setIsEmpty(true)
        }
      },
      isEmpty: () => {
        if (sigCanvas.current) {
          return sigCanvas.current.isEmpty()
        }
        return true
      },
      toDataURL: (type = 'image/png', encoderOptions = 0.92) => {
        if (sigCanvas.current) {
          return sigCanvas.current.toDataURL(type, encoderOptions)
        }
        return ''
      },
    }))

    // 检查签名是否为空
    const checkIfEmpty = () => {
      if (sigCanvas.current) {
        setIsEmpty(sigCanvas.current.isEmpty())
      }
    }

    // 清除签名
    const handleClear = () => {
      if (sigCanvas.current) {
        sigCanvas.current.clear()
        setIsEmpty(true)
      }
    }

    // 设置默认尺寸
    const width = canvasProps.width || 450
    const height = canvasProps.height || 200
    const className = canvasProps.className || 'signature-canvas'

    // 修复Canvas坐标偏移问题
    useEffect(() => {
      const resizeCanvas = () => {
        if (sigCanvas.current && containerRef.current) {
          const canvas = sigCanvas.current.getCanvas()
          const container = containerRef.current
          const rect = container.getBoundingClientRect()

          // 计算实际可用宽度（取最小值避免超出）
          const availableWidth = Math.min(width, rect.width)

          // 设置Canvas的实际像素尺寸
          const devicePixelRatio = window.devicePixelRatio || 1
          canvas.width = availableWidth * devicePixelRatio
          canvas.height = height * devicePixelRatio

          // 设置Canvas的CSS显示尺寸
          canvas.style.width = `${availableWidth}px`
          canvas.style.height = `${height}px`

          // 缩放绘图上下文以匹配设备像素比
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.scale(devicePixelRatio, devicePixelRatio)
          }

          // 清除并重新设置背景
          sigCanvas.current.clear()
        }
      }

      // 初始化
      const timer = setTimeout(resizeCanvas, 100)

      // 监听窗口大小变化
      window.addEventListener('resize', resizeCanvas)
      window.addEventListener('orientationchange', resizeCanvas)

      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', resizeCanvas)
        window.removeEventListener('orientationchange', resizeCanvas)
      }
    }, [width, height])

    return (
      <div
        ref={containerRef}
        className="w-full"
        style={{
          maxWidth: '100%',
          height: `${height}px`,
          overflow: 'hidden',
        }}
      >
        <SignaturePad
          ref={sigCanvas}
          canvasProps={{
            width,
            height,
            className,
            style: {
              width: '100%',
              maxWidth: `${width}px`,
              height: `${height}px`,
              touchAction: 'none',
              display: 'block',
            },
          }}
          backgroundColor="rgba(255, 255, 255, 1)"
          onEnd={checkIfEmpty}
          dotSize={1.5}
          minWidth={0.8}
          maxWidth={2.5}
          throttle={16}
        />
      </div>
    )
  }
)

export default SignatureCanvasForward
