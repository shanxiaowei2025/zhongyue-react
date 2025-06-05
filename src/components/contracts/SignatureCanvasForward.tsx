import React, { forwardRef, useRef, useState, useImperativeHandle } from 'react'
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

    return (
      <div className="w-full">
        <SignaturePad
          ref={sigCanvas}
          canvasProps={{
            width,
            height,
            className,
            style: { width: '100%', height: `${height}px` },
          }}
          backgroundColor="rgba(255, 255, 255, 1)"
          onEnd={checkIfEmpty}
        />
      </div>
    )
  }
)

export default SignatureCanvasForward
