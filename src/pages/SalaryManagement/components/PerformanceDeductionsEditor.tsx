import React from 'react'
import { Table, InputNumber, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'

const { Text } = Typography

interface PerformanceDeductionsEditorProps {
  value?: number[]
  onChange?: (value: number[]) => void
  disabled?: boolean
}

interface DeductionItem {
  key: number
  standard: string
  value: number
  editable: boolean
}

// 14项绩效扣除标准
const DEDUCTION_STANDARDS = [
  '因账目问题导致漏报逾期、造成税款问题：本项绩效-50%；涉及税金及重大严重者当月全部绩效清零并配合客户解决问题，并由自己承担因此造成的税款及罚款',
  '要求认真、负责、专业地做好客户账目服务，做好日常岗位职责，并配合账目复核、报税等工作的进行，出现日常的工作失误及错误、不积极配合等，扣除绩效50%,由于工作衔接或沟通不及时造成错报、漏报、工作延误等扣除绩效50%，涉及问题严重者扣除全部绩效',
  '客户凭证资料归档、保管，材料丢失-10%/份',
  '不定时稽查账务安全，在稽查中账务出现问题，-10%/处',
  '试用期前两个自然月暂不考核、转岗人员前两个自然月暂不考核',
  '客户调整,必须有交接表,做好衔接及账面检查,如后期抽查发现无交接明细及注意事项说明，账面发现有明显错误,交接后前两个月不扣绩效,后期扣除10%,如有重大错记,漏报扣除责任会计50%绩效并由自己承担因此造成的税款及款',
  '任何客户因服务态度以及专业知识等产生的投诉至销售部、上级领导部门的事件，且非客户问题，发生一次此项绩效-30%，严重者本月绩效清零。特殊情况部门领导酌情处理，并且配合行政部门存档',
  '按时参加部门培训及专业考试；考试不合格-10%；无故不参加培训、迟到培训-10%',
  '不及时更正抽查发现的账面错误扣除30%（当天或最迟一周内更正完成）',
  '对企业政策解释错误造成工作失误扣除20%',
  '对公司培训多次指出的风险点，实际账务处理中仍出现记账错误的-30%',
  '由于账面问题造成客户流失-50%',
  '每月统计凭证装订进度上报行政组，每月至少完成本月进度50%，季度末80%；月度未完成总进度50%-10%绩效，30%以下-20%绩效',
  '按照岗责定期抽查填报系统未完成-20%',
]

const PerformanceDeductionsEditor: React.FC<PerformanceDeductionsEditorProps> = ({
  value = new Array(14).fill(0),
  onChange,
  disabled = false,
}) => {
  // 确保数组长度为14，并将所有非数字值设为0
  const safeValue = new Array(14).fill(0).map((_, index) => {
    const val = value[index]
    return typeof val === 'number' ? val : 0
  })
  const handleValueChange = (index: number, newValue: number | null) => {
    if (!onChange) return

    const updatedValues = [...safeValue]
    updatedValues[index] = newValue !== null ? newValue : 0
    onChange(updatedValues)
  }

  // 创建数据源，如果是只读模式且值为0，则不包含该项
  const data: DeductionItem[] = DEDUCTION_STANDARDS.map((standard, index) => ({
    key: index,
    standard,
    value: safeValue[index],
    editable: index < 13, // 前13项可编辑，第14项不可编辑
  })).filter(item => !disabled || item.value > 0)

  const columns: ColumnsType<DeductionItem> = [
    {
      title: '序号',
      dataIndex: 'key',
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: '绩效扣除标准',
      dataIndex: 'standard',
      render: text => <Text style={{ fontSize: '12px', lineHeight: '1.4' }}>{text}</Text>,
    },
    {
      title: '扣除比例',
      dataIndex: 'value',
      width: 120,
      render: (value, record) => {
        // 第14项不可编辑，但要显示值
        if (!record.editable) {
          if (disabled) {
            return <Text>{value > 0 ? `${(value * 100).toFixed(1)}%` : '0%'}</Text>
          } else {
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Text style={{ fontSize: '12px', marginBottom: 2 }}>
                  {value > 0 ? `${(value * 100).toFixed(1)}%` : '0%'}
                </Text>
                <Text type="secondary" style={{ fontSize: '10px' }}>
                  不可编辑
                </Text>
              </div>
            )
          }
        }

        if (disabled) {
          return <Text>{value > 0 ? `${(value * 100).toFixed(1)}%` : '0%'}</Text>
        }

        return (
          <InputNumber
            size="small"
            min={0}
            max={1}
            step={0.01}
            precision={3}
            value={value}
            onChange={newValue => handleValueChange(record.key, newValue)}
            formatter={val => `${((val || 0) * 100).toFixed(1)}%`}
            parser={val => Number(val?.replace('%', '')) / 100}
            style={{ width: '100%' }}
            placeholder="0%"
          />
        )
      },
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <div>
            <Text strong style={{ color: '#d32f2f' }}>
              绩效扣除明细
            </Text>
            <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
              前13项可编辑，不扣除填0
            </Text>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Text strong style={{ fontSize: '16px', color: '#d32f2f' }}>
              总扣除比例: {(safeValue.reduce((sum, v) => sum + v, 0) * 100).toFixed(1)}%
            </Text>
          </div>
        </div>
      </div>
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        size="small"
        bordered
        scroll={{ y: 300 }}
        rowKey="key"
      />
    </div>
  )
}

export default PerformanceDeductionsEditor
