import React, { useState } from 'react'
import {
  Tree,
  Button,
  Input,
  Modal,
  message,
  Space,
  Popconfirm,
  Spin,
  Empty,
  Tooltip,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOutlined,
  FileOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import { useAccountingCategories, AccountingFileCategory } from '../../hooks/useAccountingCategories'
import MultiFileUpload from '../MultiFileUpload'
import type { ImageType } from '../../types'
import './index.css'

interface AccountingFileManagerProps {
  customerId: number | null
  files: Array<{
    fileName?: string
    url?: string
    uploadTime?: string
    categoryId?: number
    categoryPath?: string
  }>
  onFilesChange: (files: Array<{
    fileName?: string
    url?: string
    uploadTime?: string
    categoryId?: number
    categoryPath?: string
  }>) => void
  mode?: 'add' | 'edit' | 'view'
}

const AccountingFileManager: React.FC<AccountingFileManagerProps> = ({
  customerId,
  files,
  onFilesChange,
  mode = 'edit',
}) => {
  const {
    categories,
    loading,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchCategories,
  } = useAccountingCategories({
    customerId,
    enabled: !!customerId,
  })

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false)
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<AccountingFileCategory | null>(null)

  // 递归查找分类
  const findCategoryById = (categoryId: number | null | undefined, categoryList: AccountingFileCategory[] = categories): AccountingFileCategory | undefined => {
    if (!categoryId) return undefined
    
    for (const category of categoryList) {
      if (category.id === categoryId) {
        return category
      }
      if (category.children && category.children.length > 0) {
        const found = findCategoryById(categoryId, category.children)
        if (found) return found
      }
    }
    return undefined
  }
  const [editingCategoryName, setEditingCategoryName] = useState('')

  // 获取选中分类下的文件
  const getCategoryFiles = () => {
    if (!selectedCategoryId) return files

    return files.filter((file) => file.categoryId === selectedCategoryId)
  }

  // 创建分类
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      message.error('请输入分类名称')
      return
    }

    const success = await createCategory(newCategoryName, selectedCategoryId || undefined)
    if (success) {
      setNewCategoryName('')
      setIsCreateModalVisible(false)
    }
  }

  // 更新分类
  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategoryName.trim()) {
      message.error('请输入分类名称')
      return
    }

    const success = await updateCategory(editingCategory.id, editingCategoryName)
    if (success) {
      setEditingCategory(null)
      setEditingCategoryName('')
      setIsEditModalVisible(false)
    }
  }

  // 删除分类
  const handleDeleteCategory = async (categoryId: number) => {
    const success = await deleteCategory(categoryId)
    if (success && selectedCategoryId === categoryId) {
      setSelectedCategoryId(null)
    }
  }

  // 处理文件上传
  const handleFilesUpload = async (uploadedFiles: Record<string, ImageType>) => {
    const selectedCategory = findCategoryById(selectedCategoryId)
    
    const newFiles = Object.values(uploadedFiles)
      .filter((file) => file.url)
      .map((file) => ({
        fileName: file.fileName || '未命名文件',
        url: file.url,
        uploadTime: new Date().toISOString(),
        categoryId: selectedCategoryId || undefined,
        categoryPath: selectedCategory?.categoryPath,
      }))

    const allFiles = [...files, ...newFiles]
    onFilesChange(allFiles)
    message.success('文件上传成功')
    
    // 文件上传成功后，重新获取分类树以更新文件数量
    await fetchCategories()
  }

  // 删除文件
  const handleDeleteFile = async (file: {
    fileName?: string
    url?: string
    uploadTime?: string
    categoryId?: number
    categoryPath?: string
  }) => {
    // 根据文件对象找到在全局 files 数组中的索引
    const fileIndex = files.findIndex(
      (f) => f.url === file.url && f.fileName === file.fileName && f.uploadTime === file.uploadTime
    )
    
    if (fileIndex === -1) {
      message.error('文件不存在')
      return
    }
    
    const updatedFiles = files.filter((_, i) => i !== fileIndex)
    onFilesChange(updatedFiles)
    message.success('文件已删除')
    
    // 文件删除成功后，重新获取分类树以更新文件数量
    await fetchCategories()
  }

  // 构建树形数据（计算实时文件数量）
  const buildTreeData = (categoryList: AccountingFileCategory[]): any[] => {
    return categoryList.map((category) => {
      const hasChildren = category.children && category.children.length > 0
      
      // 计算该分类下的实时文件数量（包括未保存的文件）
      const realTimeFileCount = files.filter((file) => file.categoryId === category.id).length
      
      return {
        title: (
          <div className="category-tree-node">
            <FolderOutlined className="mr-2" />
            <span>{category.categoryName}</span>
            <span className="category-file-count">({realTimeFileCount})</span>
          </div>
        ),
        key: category.id,
        children: hasChildren ? buildTreeData(category.children) : [],
        isLeaf: !hasChildren,
      }
    })
  }

  const categoryFiles = getCategoryFiles()

  return (
    <div className="accounting-file-manager">
      <div className="manager-container">
        {/* 左侧分类树 */}
        <div className="category-panel">
          <div className="panel-header">
            <h3>分类管理</h3>
            {mode !== 'view' && (
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  setNewCategoryName('')
                  setIsCreateModalVisible(true)
                }}
              >
                新建分类
              </Button>
            )}
          </div>

          <Spin spinning={loading}>
            {categories.length > 0 ? (
              <Tree
                treeData={buildTreeData(categories)}
                selectedKeys={selectedCategoryId ? [selectedCategoryId] : []}
                onSelect={(keys) => {
                  setSelectedCategoryId(keys.length > 0 ? (keys[0] as number) : null)
                }}
                className="category-tree"
              />
            ) : (
              <Empty
                description="暂无分类"
                style={{ marginTop: '20px' }}
              />
            )}
          </Spin>

          {/* 分类操作按钮 */}
          {selectedCategoryId && mode !== 'view' && (
            <div className="category-actions">
              <Space>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => {
                    const category = findCategoryById(selectedCategoryId)
                    if (category) {
                      setEditingCategory(category)
                      setEditingCategoryName(category.categoryName)
                      setIsEditModalVisible(true)
                    }
                  }}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="删除分类"
                  description="确定要删除此分类吗？"
                  onConfirm={() => handleDeleteCategory(selectedCategoryId)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          )}
        </div>

        {/* 右侧文件管理 */}
        <div className="files-panel">
          <div className="panel-header">
            <h3>
              {selectedCategoryId
                ? `文件列表 (${categoryFiles.length})`
                : '请选择分类'}
            </h3>
          </div>

          {selectedCategoryId && mode !== 'view' && (
            <div className="upload-section">
              <MultiFileUpload
                title="上传文件到此分类"
                value={{}}
                onChange={handleFilesUpload}
                accept="*/*"
                showUploadArea={true}
              />
            </div>
          )}

          {categoryFiles.length > 0 ? (
            <div className="files-list">
              {categoryFiles.map((file) => (
                <div key={`${file.url}-${file.uploadTime}`} className="file-item">
                  <div className="file-info">
                    <FileOutlined className="file-icon" />
                    <div className="file-details">
                      <div className="file-name">
                        {file.categoryPath && (
                          <span className="file-category-path">{file.categoryPath} / </span>
                        )}
                        {file.fileName || '未命名文件'}
                      </div>
                      {file.uploadTime && (
                        <div className="file-time">
                          上传时间: {new Date(file.uploadTime).toLocaleString('zh-CN')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="file-actions">
                    {file.url && (
                      <Tooltip title="下载文件">
                        <Button
                          type="primary"
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => {
                            window.open(file.url, '_blank')
                          }}
                        >
                          查看
                        </Button>
                      </Tooltip>
                    )}
                    {mode !== 'view' && (
                      <Popconfirm
                        title="删除文件"
                        description="确定要删除此文件吗？"
                        onConfirm={() => handleDeleteFile(file)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button danger size="small" icon={<DeleteOutlined />}>
                          删除
                        </Button>
                      </Popconfirm>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : selectedCategoryId ? (
            <Empty description="此分类下暂无文件" style={{ marginTop: '40px' }} />
          ) : (
            <Empty description="请先选择分类" style={{ marginTop: '40px' }} />
          )}
        </div>
      </div>

      {/* 创建分类对话框 */}
      <Modal
        title="创建新分类"
        open={isCreateModalVisible}
        onOk={handleCreateCategory}
        onCancel={() => setIsCreateModalVisible(false)}
        okText="创建"
        cancelText="取消"
      >
        <Input
          placeholder="输入分类名称"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          onPressEnter={handleCreateCategory}
        />
      </Modal>

      {/* 编辑分类对话框 */}
      <Modal
        title="编辑分类"
        open={isEditModalVisible}
        onOk={handleUpdateCategory}
        onCancel={() => setIsEditModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Input
          placeholder="输入分类名称"
          value={editingCategoryName}
          onChange={(e) => setEditingCategoryName(e.target.value)}
          onPressEnter={handleUpdateCategory}
        />
      </Modal>
    </div>
  )
}

export default AccountingFileManager
