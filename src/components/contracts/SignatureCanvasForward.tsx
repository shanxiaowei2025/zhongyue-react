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

    // 设置默认尺寸 - 改为获取容器尺寸
    const width = canvasProps.width || 700
    const height = canvasProps.height || 300
    const className = canvasProps.className || 'signature-canvas'

    // 修复Canvas坐标和尺寸问题
    useEffect(() => {
      const setupCanvas = () => {
        if (sigCanvas.current && containerRef.current) {
          const canvas = sigCanvas.current.getCanvas()
          const container = containerRef.current

          // 等待DOM更新完成
          setTimeout(() => {
            // 获取容器的实际尺寸
            const containerRect = container.getBoundingClientRect()
            const containerWidth = container.offsetWidth
            const containerHeight = container.offsetHeight

            // 如果容器有实际尺寸，使用容器尺寸，否则使用默认尺寸
            const actualWidth = containerWidth > 0 ? containerWidth : width
            const actualHeight = containerHeight > 0 ? containerHeight : height

            // 设置Canvas的实际像素尺寸
            const devicePixelRatio = window.devicePixelRatio || 1
            canvas.width = actualWidth * devicePixelRatio
            canvas.height = actualHeight * devicePixelRatio

            // 确保CSS尺寸与实际尺寸一致
            canvas.style.width = `${actualWidth}px`
            canvas.style.height = `${actualHeight}px`

            // 缩放绘图上下文以保持笔触与笔迹一致
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.scale(devicePixelRatio, devicePixelRatio)
              ctx.imageSmoothingEnabled = true
              ctx.imageSmoothingQuality = 'high'
            }

            // 重新设置背景
            if (sigCanvas.current) {
              sigCanvas.current.clear()
            }
          }, 100)
        }
      }

      // 初始化设置
      setupCanvas()

      // 监听窗口变化
      window.addEventListener('resize', setupCanvas)
      window.addEventListener('orientationchange', setupCanvas)

      return () => {
        window.removeEventListener('resize', setupCanvas)
        window.removeEventListener('orientationchange', setupCanvas)
      }
    }, [width, height])

    return (
      <div
        ref={containerRef}
        className="w-full"
        style={{
          width: '100%',
          height: `${height}px`,
          overflow: 'hidden',
          padding: 0,
          margin: 0,
          boxSizing: 'border-box',
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
              height: '100%',
              touchAction: 'none',
              display: 'block',
              padding: 0,
              margin: 0,
              border: 'none',
              boxSizing: 'border-box',
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
