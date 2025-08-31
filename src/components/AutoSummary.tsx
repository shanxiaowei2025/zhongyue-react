import React, { useMemo } from 'react'
import { Row, Col, Card, Statistic } from 'antd'
import type { AutoSummaryProps, SummaryMetric, AggregationType } from '../types/advancedServerTable'

const AutoSummary = <T extends Record<string, any> = any>({
  data,
  metrics,
}: AutoSummaryProps<T>) => {
  // 计算统计值
  const calculatedMetrics = useMemo(() => {
    if (!data?.list || data.list.length === 0) {
      return metrics.map(metric => ({ ...metric, value: 0 }))
    }

    return metrics.map(metric => {
      const { key, field = key, aggregation = 'count' } = metric

      let value: number

      switch (aggregation) {
        case 'count':
          value = data.list.length
          break

        case 'sum':
          value = data.list.reduce((acc, item) => acc + (Number(item[field]) || 0), 0)
          break

        case 'avg':
          const sum = data.list.reduce((acc, item) => acc + (Number(item[field]) || 0), 0)
          value = sum / data.list.length
          break

        case 'min':
          value = Math.min(...data.list.map(item => Number(item[field]) || 0))
          break

        case 'max':
          value = Math.max(...data.list.map(item => Number(item[field]) || 0))
          break

        default:
          value = 0
      }

      return { ...metric, value }
    })
  }, [data, metrics])

  // 格式化显示值
  const formatValue = (metric: SummaryMetric & { value: number }) => {
    const { value, formatter, precision } = metric

    if (typeof formatter === 'function') {
      return formatter(value, data)
    }

    switch (formatter) {
      case 'currency':
        return value.toLocaleString('zh-CN')
      case 'percentage':
        return `${value.toFixed(precision ?? 1)}%`
      case 'number':
        return value.toLocaleString('zh-CN')
      default:
        if (precision !== undefined) {
          return value.toFixed(precision)
        }
        return Math.round(value).toLocaleString('zh-CN')
    }
  }

  if (metrics.length === 0) {
    return null
  }

  return (
    <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
      {calculatedMetrics.map((metric, index) => {
        const colSpan = 24 / Math.min(metrics.length, 4) // 最多4列

        return (
          <Col xs={24} sm={12} lg={colSpan} key={metric.key}>
            <Card
              style={{
                borderRadius: 16,
                boxShadow: metric.color
                  ? `0 4px 16px ${metric.color}25`
                  : '0 4px 16px rgba(0, 0, 0, 0.08)',
              }}
            >
              <Statistic
                title={metric.title}
                value={formatValue(metric)}
                prefix={metric.prefix}
                suffix={metric.suffix}
                valueStyle={{
                  color: metric.color || '#262626',
                  fontSize: 24,
                  fontWeight: 700,
                }}
              />
            </Card>
          </Col>
        )
      })}
    </Row>
  )
}

export default AutoSummary
