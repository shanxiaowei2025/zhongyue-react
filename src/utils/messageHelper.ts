import { message } from 'antd'
import { MESSAGES } from '../constants/messages'

/**
 * Message工具函数，提供统一的消息提示接口
 */

// 模板字符串替换函数
const interpolate = (template: string, params: Record<string, string | number>): string => {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match
  })
}

// 成功提示的快捷方法
export const showSuccess = {
  save: () => message.success(MESSAGES.SUCCESS.SAVE),
  create: () => message.success(MESSAGES.SUCCESS.CREATE),
  delete: () => message.success(MESSAGES.SUCCESS.DELETE),
  update: () => message.success(MESSAGES.SUCCESS.UPDATE),
  export: () => message.success(MESSAGES.SUCCESS.EXPORT),
  upload: () => message.success(MESSAGES.SUCCESS.UPLOAD),
  copy: () => message.success(MESSAGES.SUCCESS.COPY),

  // 动态参数的成功提示
  fileUpload: (fileName: string) => message.success(`${fileName} ${MESSAGES.SUCCESS.UPLOAD}`),
  fileDownload: (fileName: string) => message.success(`${fileName} ${MESSAGES.SUCCESS.DOWNLOAD}`),

  // 业务特定成功提示
  enterpriseInfoFilled: () => message.success(MESSAGES.BUSINESS.ENTERPRISE_INFO_FILLED),
  passwordChanged: () => message.success(MESSAGES.SUCCESS.PASSWORD_CHANGED),
  passwordSet: () => message.success(MESSAGES.SUCCESS.SALARY_PASSWORD_SET),
  verification: () => message.success(MESSAGES.SUCCESS.VERIFICATION_SUCCESS),
  contractUpdate: () => message.success(MESSAGES.SUCCESS.CONTRACT_UPDATED),
  contractSigned: () => message.success(MESSAGES.SUCCESS.CONTRACT_SIGNED),
  linkCopied: () => message.success(MESSAGES.SUCCESS.LINK_COPIED),
  contentCopied: () => message.success(MESSAGES.SUCCESS.CONTENT_COPIED),
}

// 错误提示的快捷方法
export const showError = {
  save: () => message.error(MESSAGES.ERROR.SAVE_FAILED),
  create: () => message.error(MESSAGES.ERROR.CREATE_FAILED),
  delete: () => message.error(MESSAGES.ERROR.DELETE_FAILED),
  update: () => message.error(MESSAGES.ERROR.UPDATE_FAILED),
  export: () => message.error(MESSAGES.ERROR.EXPORT_FAILED),
  upload: () => message.error(MESSAGES.ERROR.UPLOAD_FAILED),

  // 动态参数的错误提示
  fileUpload: (fileName: string) => message.error(`${fileName} ${MESSAGES.ERROR.UPLOAD_FAILED}`),
  fileLoadRetry: (fileName: string, maxRetries: number) =>
    message.error(
      interpolate('文件 {fileName} 加载失败，已尝试{maxRetries}次重新加载', {
        fileName,
        maxRetries,
      })
    ),
  maxFilesExceeded: (maxCount: number) =>
    message.error(interpolate(MESSAGES.VALIDATION.MAX_FILES_EXCEEDED, { maxCount })),

  // 网络和系统错误
  network: () => message.error(MESSAGES.ERROR.NETWORK_ERROR),
  system: () => message.error(MESSAGES.ERROR.SYSTEM_ERROR),

  // 业务特定错误
  invalidId: () => message.error(MESSAGES.VALIDATION.INVALID_CONTRACT_ID),
  unsupportedContractType: () => message.error(MESSAGES.VALIDATION.INVALID_CONTRACT_TYPE),
  verification: () => message.error('验证失败'),
  passwordSet: () => message.error('密码设置失败'),
  passwordChange: () => message.error('密码修改失败'),
  contractUpdate: () => message.error(MESSAGES.VALIDATION.UPDATE_FAILED_CHECK_CONTENT),
}

// 验证错误提示的快捷方法
export const showValidationError = {
  passwordMismatch: () => message.error(MESSAGES.VALIDATION.PASSWORD_MISMATCH),
  newPasswordMismatch: () => message.error(MESSAGES.VALIDATION.NEW_PASSWORD_MISMATCH),
  passwordSameAsOld: () => message.error(MESSAGES.VALIDATION.PASSWORD_SAME_AS_OLD),
  invalidFileFormat: () => message.error(MESSAGES.VALIDATION.INVALID_FILE_FORMAT),
  invalidImageFormat: () => message.error(MESSAGES.VALIDATION.INVALID_IMAGE_FORMAT),
  invalidExcelFormat: () => message.error(MESSAGES.VALIDATION.INVALID_EXCEL_FORMAT),
  fileSizeExceeded: () => message.error(MESSAGES.VALIDATION.FILE_SIZE_EXCEEDED),
  imageSizeExceeded: () => message.error(MESSAGES.VALIDATION.IMAGE_SIZE_EXCEEDED),
  contractComponentNotReady: () => message.error(MESSAGES.VALIDATION.CONTRACT_COMPONENT_NOT_READY),
  invalidContractType: () => message.error(MESSAGES.VALIDATION.INVALID_CONTRACT_TYPE),
  signatureRequired: () => message.error(MESSAGES.VALIDATION.SIGNATURE_REQUIRED),

  // 必填字段验证
  requiredCompanyName: () => message.error(MESSAGES.VALIDATION.REQUIRED_COMPANY_NAME),
  requiredCreditCode: () => message.error(MESSAGES.VALIDATION.REQUIRED_CREDIT_CODE),
  requiredContactPersonA: () => message.error(MESSAGES.VALIDATION.REQUIRED_CONTACT_PERSON_A),
  requiredContactPersonB: () => message.error(MESSAGES.VALIDATION.REQUIRED_CONTACT_PERSON_B),
  requiredContactPhoneA: () => message.error(MESSAGES.VALIDATION.REQUIRED_CONTACT_PHONE_A),
  requiredContactPhoneB: () => message.error(MESSAGES.VALIDATION.REQUIRED_CONTACT_PHONE_B),
  requiredLocation: () => message.error(MESSAGES.VALIDATION.REQUIRED_LOCATION),
  requiredTotalFee: () => message.error(MESSAGES.VALIDATION.REQUIRED_TOTAL_FEE),
  requiredBusinessServiceFee: () =>
    message.error(MESSAGES.VALIDATION.REQUIRED_BUSINESS_SERVICE_FEE),
}

// 权限提示的快捷方法
export const showPermissionError = {
  noCreateCustomer: () => message.error(MESSAGES.PERMISSION.NO_CREATE_CUSTOMER),
  noEditCustomer: () => message.error(MESSAGES.PERMISSION.NO_EDIT_CUSTOMER),
  noDeleteCustomer: () => message.error(MESSAGES.PERMISSION.NO_DELETE_CUSTOMER),
  noCreateExpense: () => message.error(MESSAGES.PERMISSION.NO_CREATE_EXPENSE),
  noEditExpense: () => message.error(MESSAGES.PERMISSION.NO_EDIT_EXPENSE),
  noDeleteExpense: () => message.error(MESSAGES.PERMISSION.NO_DELETE_EXPENSE),
  noViewReceipt: () => message.error(MESSAGES.PERMISSION.NO_VIEW_RECEIPT),
  noAuditExpense: () => message.error(MESSAGES.PERMISSION.NO_AUDIT_EXPENSE),
  noCancelAudit: () => message.error(MESSAGES.PERMISSION.NO_CANCEL_AUDIT),
}

// 警告提示的快捷方法
export const showWarning = {
  passwordExpired: () => message.warning(MESSAGES.BUSINESS.PASSWORD_EXPIRED_WARNING),
  loginExpired: () => message.warning(MESSAGES.BUSINESS.LOGIN_EXPIRED),
  autoLogout: () => message.warning(MESSAGES.BUSINESS.AUTO_LOGOUT),
  contractAlreadyAdded: () => message.warning(MESSAGES.BUSINESS.CONTRACT_ALREADY_ADDED),
  fileLinkNotExist: () => message.warning(MESSAGES.BUSINESS.FILE_LINK_NOT_EXIST),
}

// 信息提示的快捷方法
export const showInfo = {
  deviceOrientation: () => message.info(MESSAGES.BUSINESS.DEVICE_ORIENTATION_TIP),
  contactAdminReset: () => message.info(MESSAGES.BUSINESS.CONTACT_ADMIN_RESET),
  contactAdmin: () => message.info('请联系管理员重置薪资密码'),
  accountSettings: () => message.info(MESSAGES.COMING_SOON.ACCOUNT_SETTINGS),
  notificationCenter: () => message.info(MESSAGES.COMING_SOON.NOTIFICATION_CENTER),
  helpCenter: () => message.info(MESSAGES.COMING_SOON.HELP_CENTER),
}
