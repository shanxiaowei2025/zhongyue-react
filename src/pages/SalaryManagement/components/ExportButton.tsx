import React, { useState } from 'react'
import { Button, Dropdown, message } from 'antd'
import { ExportOutlined, DownOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import type { ExportType } from '../../../types/salaryIntegrated'

interface ExportButtonProps {
  yearMonth: string
  onExport: (type: ExportType, params?: any) => Promise<void>
  disabled?: boolean
  types?: ExportType[]
  showDropdown?: boolean
}

const ExportButton: React.FC<ExportButtonProps> = ({
  yearMonth,
  onExport,
  disabled = false,
  types = ['salary', 'socialInsurance', 'subsidy', 'attendance', 'friendCircle'],
  showDropdown = true,
}) => {
  const [exporting, setExporting] = useState<Record<ExportType, boolean>>({
    salary: false,
    socialInsurance: false,
    subsidy: false,
    attendance: false,
    friendCircle: false,
  })

  const typeNames: Record<ExportType, string> = {
    salary: '薪资数据',
    socialInsurance: '社保数据',
    subsidy: '补贴数据',
    attendance: '考勤数据',
    friendCircle: '朋友圈数据',
  }

  const handleExport = async (type: ExportType) => {
    try {
      setExporting(prev => ({ ...prev, [type]: true }))
      await onExport(type, { yearMonth })
    } catch (error: any) {
      message.error(`导出${typeNames[type]}失败: ${error.message}`)
    } finally {
      setExporting(prev => ({ ...prev, [type]: false }))
    }
  }

  // 如果只有一种类型或不显示下拉菜单，直接显示单个按钮
  if (!showDropdown || types.length === 1) {
    const singleType = types[0]
    return (
      <Button
        icon={<ExportOutlined />}
        onClick={() => handleExport(singleType)}
        loading={exporting[singleType]}
        disabled={disabled}
      >
        导出{typeNames[singleType]}
      </Button>
    )
  }

  const menuItems: MenuProps['items'] = types.map(type => ({
    key: type,
    label: (
      <div className="flex items-center justify-between min-w-32">
        <span>导出{typeNames[type]}</span>
        {exporting[type] && <span className="text-blue-500">导出中...</span>}
      </div>
    ),
    onClick: () => handleExport(type),
    disabled: exporting[type],
  }))

  const isAnyExporting = Object.values(exporting).some(Boolean)

  return (
    <Dropdown menu={{ items: menuItems }} disabled={disabled || isAnyExporting} trigger={['click']}>
      <Button
        icon={<ExportOutlined />}
        disabled={disabled || isAnyExporting}
        loading={isAnyExporting}
      >
        导出数据 <DownOutlined />
      </Button>
    </Dropdown>
  )
}

export default ExportButton
