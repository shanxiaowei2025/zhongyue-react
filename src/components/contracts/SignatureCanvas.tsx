import React, { useRef, useState } from 'react';
import SignaturePad from 'react-signature-canvas';
import { Button, Space, message, Typography } from 'antd';
import { ClearOutlined, SaveOutlined } from '@ant-design/icons';
import { uploadFile } from '../../api/upload';

const { Title } = Typography;

interface SignatureCanvasProps {
  onSave: (imageUrl: string) => void;
  width?: number;
  height?: number;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ 
  onSave, 
  width = 600, 
  height = 200 
}) => {
  const sigCanvas = useRef<SignaturePad>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [uploading, setUploading] = useState(false);

  // 清除签名
  const handleClear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
    }
  };

  // 检查签名是否为空
  const checkIfEmpty = () => {
    if (sigCanvas.current) {
      setIsEmpty(sigCanvas.current.isEmpty());
      return sigCanvas.current.isEmpty();
    }
    return true;
  };

  // 保存签名为图片并上传
  const handleSave = async () => {
    if (checkIfEmpty()) {
      message.error('请先签名后再保存');
      return;
    }

    try {
      setUploading(true);
      
      // 1. 获取签名的数据URL
      if (!sigCanvas.current) {
        throw new Error('签名画布不可用');
      }
      
      const signatureDataUrl = sigCanvas.current.toDataURL('image/png');
      
      // 2. 将数据URL转换为Blob对象
      const byteString = atob(signatureDataUrl.split(',')[1]);
      const mimeString = signatureDataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      
      const blob = new Blob([ab], { type: mimeString });
      
      // 3. 创建File对象
      const timestamp = new Date().getTime();
      const filename = `signature_${timestamp}.png`;
      const file = new File([blob], filename, { type: 'image/png' });
      
      // 4. 直接上传文件
      const uploadResponse = await uploadFile(file, 'contracts/signatures');
      
      // 添加详细的日志来调试
      console.log('上传响应:', uploadResponse);
      console.log('响应类型:', typeof uploadResponse);
      console.log('success字段:', uploadResponse.success, '类型:', typeof uploadResponse.success);
      console.log('data字段:', uploadResponse.data);
      
      if (!uploadResponse.success || !uploadResponse.data) {
        console.error('上传失败检查:', {
          success: uploadResponse.success,
          hasData: !!uploadResponse.data,
          fullResponse: uploadResponse
        });
        throw new Error('上传签名图片失败');
      }
      
      // 5. 返回成功的图片URL
      onSave(uploadResponse.data.url);
      message.success('签名已保存');
      
    } catch (error) {
      console.error('保存签名失败:', error);
      message.error('保存签名失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="signature-canvas-container">
      <Title level={5} className="mb-2">请在下方框内签名</Title>
      
      <div 
        style={{ 
          border: '1px solid #d9d9d9', 
          borderRadius: '4px',
          background: '#fff',
          marginBottom: '16px'
        }}
      >
        <SignaturePad
          ref={sigCanvas}
          canvasProps={{
            width,
            height,
            className: 'signature-canvas',
            style: { width: '100%', height: `${height}px` },
          }}
          backgroundColor="rgba(255, 255, 255, 0)"
          onEnd={checkIfEmpty}
        />
      </div>
      
      <Space>
        <Button 
          icon={<ClearOutlined />} 
          onClick={handleClear}
        >
          清除
        </Button>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          onClick={handleSave}
          disabled={isEmpty}
          loading={uploading}
        >
          保存签名
        </Button>
      </Space>
    </div>
  );
};

export default SignatureCanvas; 