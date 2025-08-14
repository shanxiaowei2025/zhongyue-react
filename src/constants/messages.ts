/**
 * 统一的消息提示常量
 * 用于避免重复定义相同的提示信息，便于维护和国际化
 */

export const MESSAGES = {
  // ========== 操作成功提示 ==========
  SUCCESS: {
    SAVE: '保存成功',
    CREATE: '创建成功',
    DELETE: '删除成功',
    UPDATE: '更新成功',
    EXPORT: '导出成功',
    IMPORT: '导入成功',
    UPLOAD: '上传成功',
    DOWNLOAD: '下载成功',
    COPY: '复制成功',
    REFRESH: '刷新成功',

    // 业务特定成功提示
    LOGIN: '登录成功',
    PASSWORD_CHANGED: '密码修改成功',
    SIGNATURE_SAVED: '签名已保存',
    CONTRACT_SIGNED: '合同签署成功',
    EMPLOYEE_CREATED: '员工创建成功',
    EMPLOYEE_UPDATED: '员工信息更新成功',
    CUSTOMER_DELETED: '客户及相关图片已成功删除',
    AVATAR_UPLOADED: '头像上传成功',
    AVATAR_DELETED: '头像删除成功',
    SALARY_PASSWORD_SET: '薪资密码设置成功',
    SALARY_PASSWORD_CHANGED: '薪资密码修改成功',
    SALARY_CONFIRMED: '薪资确认成功',
    PDF_DOWNLOADED: 'PDF下载成功',
    CONTRACT_IMAGE_DOWNLOADED: '合同图片下载成功',
    SIGN_LINK_GENERATED: '签署链接生成成功',
    CONTENT_COPIED: '内容已复制到剪贴板',
    LINK_COPIED: '链接已复制到剪贴板',
    DATA_CLEARED: '已清除保存的合同数据',
    VERIFICATION_SUCCESS: '验证成功',
    CONTRACT_UPDATED: '合同更新成功！',
  },

  // ========== 操作失败提示 ==========
  ERROR: {
    SAVE_FAILED: '保存失败',
    CREATE_FAILED: '创建失败',
    DELETE_FAILED: '删除失败',
    UPDATE_FAILED: '更新失败',
    EXPORT_FAILED: '导出失败',
    IMPORT_FAILED: '导入失败',
    UPLOAD_FAILED: '上传失败',
    DOWNLOAD_FAILED: '下载失败',
    COPY_FAILED: '复制失败',

    // 网络和系统错误
    NETWORK_ERROR: '网络错误，请检查网络连接',
    SYSTEM_ERROR: '系统错误，请稍后重试',
    TIMEOUT_ERROR: '请求超时，请稍后重试',

    // 业务特定错误提示
    AVATAR_UPLOAD_FAILED: '头像上传失败',
    AVATAR_DELETE_FAILED: '头像删除失败',
    IMAGE_CROP_FAILED: '图片裁剪失败',
    IMAGE_LOAD_FAILED: '图片加载失败',
    PDF_EXPORT_FAILED: '导出PDF失败，请重试',
    IMAGE_EXPORT_FAILED: '导出合同图片失败，请重试',
    SIGN_LINK_FAILED: '生成签署链接失败，请重试',
    VIEW_LINK_FAILED: '获取查看链接失败，请重试',
    COPY_MANUAL: '复制失败，请手动复制',
    SIGNATURE_SAVE_FAILED: '保存签名失败，请重试',
    IMAGE_GENERATION_FAILED: '生成图片失败，请重试',
    DATA_CLEAR_FAILED: '清理数据失败',
    FILE_LOAD_FAILED: '文件加载失败',
    CONTRACT_CONTENT_UNAVAILABLE: '无法获取合同内容，请稍后重试',
    CONTRACT_DATA_NOT_EXIST: '合同数据不存在',
    CONTRACT_NO_VIEW_LINK: '该合同暂无查看链接',
    RECEIPT_CONTENT_NOT_FOUND: '无法找到收据内容',
  },

  // ========== 表单验证提示 ==========
  VALIDATION: {
    // 密码相关验证
    PASSWORD_MISMATCH: '两次输入的密码不一致',
    NEW_PASSWORD_MISMATCH: '两次输入的新密码不一致',
    PASSWORD_SAME_AS_OLD: '新密码不能与当前密码相同',

    // 必填字段验证
    REQUIRED_COMPANY_NAME: '请填写甲方公司名称',
    REQUIRED_CREDIT_CODE: '请填写甲方统一社会信用代码',
    REQUIRED_CONTACT_PERSON_A: '请填写甲方联系人',
    REQUIRED_CONTACT_PERSON_B: '请填写乙方联系人',
    REQUIRED_CONTACT_PHONE_A: '请填写甲方联系电话',
    REQUIRED_CONTACT_PHONE_B: '请填写乙方联系电话',
    REQUIRED_LOCATION: '请选择企业归属地',
    REQUIRED_TOTAL_FEE: '请填写费用总计',
    REQUIRED_BUSINESS_SERVICE_FEE: '已勾选工商服务项目，请填写工商服务费',
    REQUIRED_BANK_SERVICE_FEE: '已勾选银行服务项目，请填写银行服务费',
    REQUIRED_LICENSE_SERVICE_FEE: '已勾选许可业务项目，请填写许可业务服务费',
    REQUIRED_COMPANY_ADDRESS: '请填写甲方地址',
    REQUIRED_PARTY_A_NAME: '请填写甲方名称',

    // 文件格式验证
    INVALID_FILE_FORMAT: '文件格式不支持！',
    INVALID_IMAGE_FORMAT: '只能上传图片文件！',
    INVALID_EXCEL_FORMAT: '只能上传Excel或CSV文件！',
    FILE_SIZE_EXCEEDED: '文件大小不能超过10MB！',
    IMAGE_SIZE_EXCEEDED: '图片大小不能超过10MB！',
    MAX_FILES_EXCEEDED: '最多只能上传{maxCount}个文件',

    // 业务逻辑验证
    INVALID_CONTRACT_ID: '无效的合同ID',
    INVALID_CONTRACT_TYPE: '不支持的合同类型',
    CONTRACT_COMPONENT_NOT_READY: '合同组件未准备就绪',
    INVALID_SIGNATURE: '签名无效或合同信息不完整',
    SIGNATURE_REQUIRED: '请先进行签名',
    SIGNATURE_REQUIRED_BEFORE_SAVE: '请先签名后再保存',
    CUSTOMER_INFO_NOT_EXIST: '客户信息不存在',
    FORM_VALIDATION_FAILED: '请检查表单填写是否正确',
    SUBMIT_FAILED_CHECK_CONTENT: '提交失败，请检查填写内容后重试',
    UPDATE_FAILED_CHECK_CONTENT: '更新失败，请检查填写内容后重试',
    FORM_SUBMIT_ERROR: '表单验证失败，请检查输入',
  },

  // ========== 权限相关提示 ==========
  PERMISSION: {
    NO_CREATE_CUSTOMER: '您没有创建客户的权限',
    NO_EDIT_CUSTOMER: '您没有编辑客户的权限',
    NO_DELETE_CUSTOMER: '您没有删除客户的权限',
    NO_CREATE_EXPENSE: '您没有创建费用的权限',
    NO_EDIT_EXPENSE: '您没有编辑费用的权限',
    NO_DELETE_EXPENSE: '您没有删除费用的权限',
    NO_VIEW_RECEIPT: '您没有查看收据的权限',
    NO_AUDIT_EXPENSE: '您没有审核费用的权限',
    NO_CANCEL_AUDIT: '您没有取消审核的权限',
  },

  // ========== 业务特定提示 ==========
  BUSINESS: {
    ENTERPRISE_INFO_FILLED: '企业信息已自动填入',
    PASSWORD_EXPIRED_WARNING: '您的密码已过期，必须修改密码才能继续使用系统',
    LOGIN_EXPIRED: '您的登录已过期，请重新登录',
    AUTO_LOGOUT: '长时间未操作，已自动退出登录，请重新登录',
    DEVICE_ORIENTATION_TIP: '请将设备横置以获得更好的签名体验',
    CONTACT_ADMIN_RESET: '请联系管理员重置薪资密码',
    CONTRACT_ALREADY_ADDED: '该合同已添加',
    FILE_LINK_NOT_EXIST: '文件链接不存在',
    NO_SELECTED_EXPENSE_TO_AUDIT: '未选择要审核的费用',
  },

  // ========== 功能开发中提示 ==========
  COMING_SOON: {
    ACCOUNT_SETTINGS: '账号设置功能即将上线',
    NOTIFICATION_CENTER: '通知中心功能即将上线',
    HELP_CENTER: '帮助中心功能即将上线',
  },
} as const

// 类型定义
export type MessageType = typeof MESSAGES
export type SuccessMessageKey = keyof typeof MESSAGES.SUCCESS
export type ErrorMessageKey = keyof typeof MESSAGES.ERROR
export type ValidationMessageKey = keyof typeof MESSAGES.VALIDATION
export type PermissionMessageKey = keyof typeof MESSAGES.PERMISSION
export type BusinessMessageKey = keyof typeof MESSAGES.BUSINESS
export type ComingSoonMessageKey = keyof typeof MESSAGES.COMING_SOON
