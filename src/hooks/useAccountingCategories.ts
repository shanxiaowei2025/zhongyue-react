import { useState, useEffect, useCallback } from 'react'
import { message } from 'antd'

export interface AccountingFileCategory {
  id: number
  categoryName: string
  categoryPath: string
  parentId: number | null
  fileCount: number
  children: AccountingFileCategory[]
}

interface UseAccountingCategoriesOptions {
  customerId: number | null
  enabled?: boolean
}

export const useAccountingCategories = ({
  customerId,
  enabled = true,
}: UseAccountingCategoriesOptions) => {
  const [categories, setCategories] = useState<AccountingFileCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取分类树
  const fetchCategories = useCallback(async () => {
    if (!customerId || !enabled) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/customer/${customerId}/accounting-categories`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('获取分类列表失败')
      }

      const response_data = await response.json()
      console.log('获取分类树原始数据:', response_data.data)
      console.log('分类树数量:', response_data.data ? response_data.data.length : 0)
      if (response_data.data && response_data.data.length > 0) {
        console.log('第一个分类:', response_data.data[0])
        console.log('第一个分类的children:', response_data.data[0].children)
      }
      setCategories(response_data.data || [])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '获取分类列表失败'
      setError(errorMsg)
      message.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [customerId, enabled])

  // 创建分类
  const createCategory = async (
    categoryName: string,
    parentId?: number | null
  ): Promise<AccountingFileCategory | null> => {
    if (!customerId) return null

    try {
      const response = await fetch(
        `/api/customer/${customerId}/accounting-categories`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            categoryName,
            parentId: parentId || null,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('创建分类失败')
      }

      const response_data = await response.json()
      message.success('分类创建成功')
      
      // 重新获取分类列表
      await fetchCategories()
      
      return response_data.data
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '创建分类失败'
      message.error(errorMsg)
      return null
    }
  }

  // 更新分类
  const updateCategory = async (
    categoryId: number,
    categoryName: string
  ): Promise<boolean> => {
    if (!customerId) return false

    try {
      const response = await fetch(
        `/api/customer/${customerId}/accounting-categories/${categoryId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ categoryName }),
        }
      )

      if (!response.ok) {
        throw new Error('更新分类失败')
      }

      message.success('分类更新成功')
      
      // 重新获取分类列表
      await fetchCategories()
      
      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '更新分类失败'
      message.error(errorMsg)
      return false
    }
  }

  // 删除分类
  const deleteCategory = async (categoryId: number): Promise<boolean> => {
    if (!customerId) return false

    try {
      const response = await fetch(
        `/api/customer/${customerId}/accounting-categories/${categoryId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('删除分类失败')
      }

      message.success('分类删除成功')
      
      // 重新获取分类列表
      await fetchCategories()
      
      return true
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '删除分类失败'
      message.error(errorMsg)
      return false
    }
  }

  // 初始化时获取分类
  useEffect(() => {
    if (customerId && enabled) {
      fetchCategories()
    }
  }, [customerId, enabled, fetchCategories])

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}
