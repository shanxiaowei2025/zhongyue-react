import { FormInstance } from 'antd'

/**
 * 安全地获取表单嵌套字段值
 * @param form 表单实例
 * @param path 字段路径数组
 * @returns 表单字段值
 */
export const safeGetFieldValue = (form: FormInstance, path: string[]): any => {
  try {
    return form.getFieldValue(path)
  } catch (error) {
    console.error('获取表单字段值出错:', error)
    return undefined
  }
}

/**
 * 安全地设置表单嵌套字段值
 * @param form 表单实例
 * @param path 字段路径数组
 * @param value 要设置的值
 */
export const safeSetFieldValue = (form: FormInstance, path: string[], value: any): void => {
  try {
    form.setFieldValue(path, value)
  } catch (error) {
    console.error('设置表单字段值出错:', error)
  }
}
