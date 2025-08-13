// 统一的归属地选项配置
export const LOCATION_OPTIONS = [
  { label: '定兴总公司', value: '定兴总公司' },
  { label: '高碑店分公司', value: '高碑店分公司' },
  { label: '雄安分公司', value: '雄安分公司' },
  { label: '其他', value: '其他' },
]

// 获取归属地选项的标签映射
export const LOCATION_LABEL_MAP: Record<string, string> = {
  定兴总公司: '定兴总公司',
  高碑店分公司: '高碑店分公司',
  雄安分公司: '雄安分公司',
  其他: '其他',
}

// 检查是否为有效的归属地值
export const isValidLocation = (location: string): boolean => {
  return LOCATION_OPTIONS.some(option => option.value === location)
}
