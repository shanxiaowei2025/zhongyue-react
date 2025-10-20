/**
 * 业务选项管理工具
 * 用于从 localStorage 中获取各种业务类型的自定义选项
 */

// 默认业务选项（固定的选项）
export const DEFAULT_BUSINESS_OPTIONS = [
  { label: '代理费', value: '代理费' },
  { label: '记账软件费', value: '记账软件费' },
  { label: '开票软件费', value: '开票软件费' },
  { label: '地址费', value: '地址费' },
  { label: '社保代理费', value: '社保代理费' },
  { label: '公积金代理费', value: '公积金代理费' },
  { label: '统计局报表费', value: '统计局报表费' },
  { label: '客户资料整理费', value: '客户资料整理费' },
  { label: '办照费用', value: '办照费用' },
  { label: '牌子费', value: '牌子费' },
  { label: '备案章费用', value: '备案章费用' },
  { label: '一般刻章费用', value: '一般刻章费用' },
]

// 变更业务默认选项
export const DEFAULT_CHANGE_BUSINESS_OPTIONS = [
  { label: '地址变更', value: '地址变更' },
  { label: '名称变更', value: '名称变更' },
  { label: '股东变更', value: '股东变更' },
  { label: '监事变更', value: '监事变更' },
  { label: '范围变更', value: '范围变更' },
  { label: '注册资本变更', value: '注册资本变更' },
  { label: '跨区域变更', value: '跨区域变更' },
  { label: '法定代表人变更', value: '法定代表人变更' },
  { label: '个升企', value: '个升企' },
]

// 行政许可默认选项
export const DEFAULT_ADMINISTRATIVE_LICENSE_OPTIONS = [
  { label: '食品经营许可证', value: '食品经营许可证' },
  { label: '卫生许可证', value: '卫生许可证' },
  { label: '酒类经营许可证', value: '酒类经营许可证' },
  { label: '道路运输许可证', value: '道路运输许可证' },
  { label: '医疗器械经营许可证', value: '医疗器械经营许可证' },
  { label: '建筑施工许可证', value: '建筑施工许可证' },
  { label: '特种行业许可证', value: '特种行业许可证' },
]

// 其他业务（基础）默认选项
export const DEFAULT_OTHER_BUSINESS_BASIC_OPTIONS = [
  { label: '非代理企业工商注销', value: '非代理企业工商注销' },
  { label: '非代理企业税务注销', value: '非代理企业税务注销' },
  { label: '非代理企业银行注销', value: '非代理企业银行注销' },
  { label: '税务处理逾期/补充申报', value: '税务处理逾期/补充申报' },
  { label: '工商年报/工商公示', value: '工商年报/工商公示' },
  { label: '补执照', value: '补执照' },
  { label: '报表编制', value: '报表编制' },
  { label: '非代理企业行政许可注销', value: '非代理企业行政许可注销' },
  { label: '银行开户', value: '银行开户' },
  { label: '银行变更', value: '银行变更' },
]

// 其他业务（外包）默认选项
export const DEFAULT_OTHER_BUSINESS_OUTSOURCING_OPTIONS = [
  { label: '代理企业工商注销', value: '代理企业工商注销' },
  { label: '代理企业税务注销', value: '代理企业税务注销' },
  { label: '代理企业银行注销', value: '代理企业银行注销' },
  { label: '代理企业注销', value: '代理企业注销' },
  { label: '解除工商异常', value: '解除工商异常' },
  { label: '解除税务异常', value: '解除税务异常' },
  { label: '代办条形码', value: '代办条形码' },
  { label: '劳务派遣证年检', value: '劳务派遣证年检' },
  { label: '民非证年检', value: '民非证年检' },
  { label: '公司转让', value: '公司转让' },
  { label: '建设项目环境影响登记表', value: '建设项目环境影响登记表' },
  { label: '代办固定污染源排污', value: '代办固定污染源排污' },
]

// 其他业务（特殊）默认选项
export const DEFAULT_OTHER_BUSINESS_SPECIAL_OPTIONS = [
  { label: '代办烟草证', value: '代办烟草证' },
  { label: '出口退税', value: '出口退税' },
  { label: '建筑资质证书', value: '建筑资质证书' },
]

// localStorage 键名映射
export const STORAGE_KEYS = {
  CHANGE_BUSINESS: 'expense_change_business_options',
  ADMINISTRATIVE_LICENSE: 'expense_administrative_license_options',
  OTHER_BUSINESS_BASIC: 'expense_other_business_basic_options',
  OTHER_BUSINESS_OUTSOURCING: 'expense_other_business_outsourcing_options',
  OTHER_BUSINESS_SPECIAL: 'expense_other_business_special_options',
}

/**
 * 从 localStorage 加载自定义选项
 */
export const loadCustomOptions = (storageKey: string): string[] => {
  try {
    const stored = localStorage.getItem(storageKey)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error(`加载自定义选项失败 (${storageKey}):`, error)
    return []
  }
}

/**
 * 获取所有业务选项（包括默认选项和自定义选项）
 */
export const getAllBusinessOptions = (): { label: string; value: string }[] => {
  // 获取所有自定义选项
  const changeBusinessCustom = loadCustomOptions(STORAGE_KEYS.CHANGE_BUSINESS)
  const adminLicenseCustom = loadCustomOptions(STORAGE_KEYS.ADMINISTRATIVE_LICENSE)
  const otherBusinessBasicCustom = loadCustomOptions(STORAGE_KEYS.OTHER_BUSINESS_BASIC)
  const otherBusinessOutsourcingCustom = loadCustomOptions(STORAGE_KEYS.OTHER_BUSINESS_OUTSOURCING)
  const otherBusinessSpecialCustom = loadCustomOptions(STORAGE_KEYS.OTHER_BUSINESS_SPECIAL)

  // 合并所有选项（去重）
  const allOptions = [
    ...DEFAULT_BUSINESS_OPTIONS,
    ...DEFAULT_CHANGE_BUSINESS_OPTIONS,
    ...DEFAULT_ADMINISTRATIVE_LICENSE_OPTIONS,
    ...DEFAULT_OTHER_BUSINESS_BASIC_OPTIONS,
    ...DEFAULT_OTHER_BUSINESS_OUTSOURCING_OPTIONS,
    ...DEFAULT_OTHER_BUSINESS_SPECIAL_OPTIONS,
    ...changeBusinessCustom.map(opt => ({ label: opt, value: opt })),
    ...adminLicenseCustom.map(opt => ({ label: opt, value: opt })),
    ...otherBusinessBasicCustom.map(opt => ({ label: opt, value: opt })),
    ...otherBusinessOutsourcingCustom.map(opt => ({ label: opt, value: opt })),
    ...otherBusinessSpecialCustom.map(opt => ({ label: opt, value: opt })),
  ]

  // 去重：使用 Map 来确保 value 唯一
  const uniqueOptionsMap = new Map<string, { label: string; value: string }>()
  allOptions.forEach(opt => {
    if (!uniqueOptionsMap.has(opt.value)) {
      uniqueOptionsMap.set(opt.value, opt)
    }
  })

  // 转换为数组并按 label 排序
  return Array.from(uniqueOptionsMap.values()).sort((a, b) => a.label.localeCompare(b.label))
}

/**
 * 创建一个 localStorage 变化监听器
 * 当 localStorage 中的业务选项发生变化时，触发回调
 */
export const createBusinessOptionsListener = (callback: () => void) => {
  const handleStorageChange = (e: StorageEvent) => {
    // 检查是否是业务选项相关的键发生了变化
    if (
      e.key === STORAGE_KEYS.CHANGE_BUSINESS ||
      e.key === STORAGE_KEYS.ADMINISTRATIVE_LICENSE ||
      e.key === STORAGE_KEYS.OTHER_BUSINESS_BASIC ||
      e.key === STORAGE_KEYS.OTHER_BUSINESS_OUTSOURCING ||
      e.key === STORAGE_KEYS.OTHER_BUSINESS_SPECIAL
    ) {
      callback()
    }
  }

  window.addEventListener('storage', handleStorageChange)

  // 返回清理函数
  return () => {
    window.removeEventListener('storage', handleStorageChange)
  }
}

/**
 * 手动触发 storage 事件（用于同一页面内的更新）
 * 因为 storage 事件只在不同标签页之间触发，同一页面需要手动触发
 */
export const triggerBusinessOptionsUpdate = () => {
  // 派发自定义事件
  window.dispatchEvent(new CustomEvent('businessOptionsUpdated'))
}

