import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Form, DatePicker, Button, Space, Spin, message, Statistic, Select } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { getBusinessStatisticsByLocation, BusinessStatisticsByLocationItem, BusinessStatisticsQueryParams } from '../../api/business-statistics';
import { usePageStates } from '../../store/pageStates';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 页面状态缓存 key
const PAGE_STATE_KEY = 'branchStatisticsFilters';

const BranchStatistics: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BusinessStatisticsByLocationItem[]>([]);
  const [summary, setSummary] = useState<BusinessStatisticsByLocationItem | null>(null);
  const [total, setTotal] = useState(0);

  // 从缓存中获取保存的筛选条件
  const getCachedFilters = useCallback(() => {
    try {
      const cached = usePageStates.getState().getState(PAGE_STATE_KEY);
      if (cached) {
        return cached;
      }
    } catch (error) {
      console.error('获取缓存筛选条件失败:', error);
    }
    return null;
  }, []);

  // 保存筛选条件到缓存
  const saveFiltersToCache = useCallback((values: any) => {
    try {
      usePageStates.getState().setState(PAGE_STATE_KEY, values);
    } catch (error) {
      console.error('保存筛选条件到缓存失败:', error);
    }
  }, []);

  const fetchStatistics = async (params?: BusinessStatisticsQueryParams) => {
    setLoading(true);
    try {
      const rawValues = params || form.getFieldsValue();
      const normalized: any = { ...rawValues };
      if (normalized.dateRange) {
        const dr = normalized.dateRange;
        if (Array.isArray(dr) && dr[0]) {
          normalized.startDate =
            typeof dr[0].format === 'function' ? dr[0].format('YYYY-MM-DD') : dayjs(dr[0]).format('YYYY-MM-DD');
          normalized.endDate =
            typeof dr[1].format === 'function' ? dr[1].format('YYYY-MM-DD') : dayjs(dr[1]).format('YYYY-MM-DD');
        }
        delete normalized.dateRange;
      }

      if (normalized.startDate && typeof normalized.startDate.format === 'function') {
        normalized.startDate = normalized.startDate.format('YYYY-MM-DD');
      }
      if (normalized.endDate && typeof normalized.endDate.format === 'function') {
        normalized.endDate = normalized.endDate.format('YYYY-MM-DD');
      }

      // 保存筛选条件到缓存
      saveFiltersToCache(normalized);

      const response = await getBusinessStatisticsByLocation(normalized);
      if (response.code === 0) {
        const items = response.data.data || [];
        setData(items);
        setSummary(response.data.summary || null);
        setTotal(response.data.total || 0);
      } else {
        message.error(response.message || '获取分公司统计失败');
      }
    } catch (error) {
      console.error('获取分公司统计失败:', error);
      message.error('获取分公司统计失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载数据（尝试从缓存恢复筛选条件）
  useEffect(() => {
    const cachedFilters = getCachedFilters();
    if (cachedFilters) {
      // 恢复筛选条件
      const { startDate, endDate, businessStatus, ...rest } = cachedFilters;
      
      // 设置表单值
      const formValues: any = { ...rest };
      if (startDate && endDate) {
        formValues.dateRange = [dayjs(startDate), dayjs(endDate)];
      }
      if (businessStatus !== undefined) {
        formValues.businessStatus = businessStatus;
      }
      
      form.setFieldsValue(formValues);
      // 使用缓存的筛选条件查询数据
      fetchStatistics(cachedFilters);
    } else {
      fetchStatistics();
    }
  }, []);

  const handleSearch = () => {
    const values = form.getFieldsValue();
    fetchStatistics(values);
  };

  const handleReset = () => {
    form.resetFields();
    fetchStatistics({});
  };

  const handleExport = () => {
    try {
      if (!data || data.length === 0) {
        message.warning('当前没有可导出的数据');
        return;
      }

      const columnsOrder = [
        'salesperson',
        'licenseFee',
        'brandFee',
        'recordSealFee',
        'generalSealFee',
        'agencyFee',
        'accountingSoftwareFee',
        'addressFee',
        'onlineBankingCustodyFee',
        'invoiceSoftwareFee',
        'socialInsuranceAgencyFee',
        'housingFundAgencyFee',
        'statisticalReportFee',
        'customerDataOrganizationFee',
        'changeFee',
        'administrativeLicenseFee',
        'otherBusinessFee',
        'otherBusinessOutsourcingFee',
        'otherBusinessSpecialFee',
        'totalFee',
      ];

      const headerMapping: Record<string, string> = {
        salesperson: '分公司',
        licenseFee: '办照费用',
        brandFee: '牌子费',
        recordSealFee: '备案章费用',
        generalSealFee: '一般刻章费用',
        agencyFee: '代理费',
        accountingSoftwareFee: '记账软件费',
        addressFee: '地址费',
        onlineBankingCustodyFee: '网银托管费',
        invoiceSoftwareFee: '开票软件费',
        socialInsuranceAgencyFee: '社保代理费',
        housingFundAgencyFee: '公积金代理费',
        statisticalReportFee: '统计局报表费',
        customerDataOrganizationFee: '客户资料整理费',
        changeFee: '变更收费',
        administrativeLicenseFee: '行政许可收费',
        otherBusinessFee: '其他业务收费（基础）',
        otherBusinessOutsourcingFee: '其他业务收费',
        otherBusinessSpecialFee: '其他业务收费(特殊)',
        totalFee: '费用总计',
      };

      const escapeCsv = (val: any) => {
        if (val === null || val === undefined) return '';
        const s = typeof val === 'number' ? val.toString() : String(val);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
          return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
      };

      const header = columnsOrder.map(c => headerMapping[c] || c).join(',');
      const rows = data.map(item =>
        columnsOrder.map(col => {
          const v = (item as any)[col];
          return escapeCsv(v);
        }).join(',')
      );

      if (summary) {
        const summaryRow = columnsOrder.map(col => {
          const v = (summary as any)[col];
          return escapeCsv(v);
        }).join(',');
        rows.push(summaryRow);
      }

      const csvContent = '\uFEFF' + [header, ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `分公司统计_${(new Date()).toISOString().slice(0,10)}.csv`;

      if ((navigator as any).msSaveBlob) {
        (navigator as any).msSaveBlob(blob, filename);
      } else {
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      message.success('已开始导出 CSV');
    } catch (err) {
      console.error('导出失败', err);
      message.error('导出失败，请重试');
    }
  };

  const navigate = useNavigate();

  const columns: ColumnsType<BusinessStatisticsByLocationItem> = [
    {
      title: '分公司',
      dataIndex: 'salesperson',
      key: 'salesperson',
      fixed: 'left',
      width: 120,
      render: (v) => v || '未分配',
    },
    {
      title: '办照费用',
      dataIndex: 'licenseFee',
      key: 'licenseFee',
      width: 100,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '牌子费',
      dataIndex: 'brandFee',
      key: 'brandFee',
      width: 100,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '备案章费用',
      dataIndex: 'recordSealFee',
      key: 'recordSealFee',
      width: 120,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '一般刻章费用',
      dataIndex: 'generalSealFee',
      key: 'generalSealFee',
      width: 120,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '代理费',
      dataIndex: 'agencyFee',
      key: 'agencyFee',
      width: 130,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '记账软件费',
      dataIndex: 'accountingSoftwareFee',
      key: 'accountingSoftwareFee',
      width: 120,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '地址费',
      dataIndex: 'addressFee',
      key: 'addressFee',
      width: 100,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '网银托管费',
      dataIndex: 'onlineBankingCustodyFee',
      key: 'onlineBankingCustodyFee',
      width: 120,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '开票软件费',
      dataIndex: 'invoiceSoftwareFee',
      key: 'invoiceSoftwareFee',
      width: 120,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '社保代理费',
      dataIndex: 'socialInsuranceAgencyFee',
      key: 'socialInsuranceAgencyFee',
      width: 120,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '公积金代理费',
      dataIndex: 'housingFundAgencyFee',
      key: 'housingFundAgencyFee',
      width: 130,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '统计局报表费',
      dataIndex: 'statisticalReportFee',
      key: 'statisticalReportFee',
      width: 130,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '客户资料整理费',
      dataIndex: 'customerDataOrganizationFee',
      key: 'customerDataOrganizationFee',
      width: 140,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '变更收费',
      dataIndex: 'changeFee',
      key: 'changeFee',
      width: 100,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '行政许可收费',
      dataIndex: 'administrativeLicenseFee',
      key: 'administrativeLicenseFee',
      width: 120,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '其他业务收费（基础）',
      dataIndex: 'otherBusinessFee',
      key: 'otherBusinessFee',
      width: 140,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '其他业务收费',
      dataIndex: 'otherBusinessOutsourcingFee',
      key: 'otherBusinessOutsourcingFee',
      width: 140,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '其他业务收费(特殊)',
      dataIndex: 'otherBusinessSpecialFee',
      key: 'otherBusinessSpecialFee',
      width: 140,
      align: 'right',
      render: (value) => `¥${(value || 0).toLocaleString()}`,
    },
    {
      title: '费用总计',
      dataIndex: 'totalFee',
      key: 'totalFee',
      width: 120,
      align: 'right',
      fixed: 'right',
      render: (value) => <strong className="text-blue-600">¥{(value || 0).toLocaleString()}</strong>,
    },
  ];

  return (
    <div className="branch-statistics-page">
      <div style={{ marginBottom: 12 }}>
        <Button onClick={() => navigate(-1)}>返回</Button>
      </div>
      {/* 搜索条件 */}
      <Card className="mb-6">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <Form form={form} layout="inline" className="mb-0">
              <Form.Item label="收费日期" name="dateRange" style={{ marginTop: 12}}>
                <RangePicker
                  placeholder={['开始日期', '结束日期']}
                  onChange={(dates) => {
                    if (dates) {
                      form.setFieldsValue({
                        startDate: dates[0]?.format('YYYY-MM-DD'),
                        endDate: dates[1]?.format('YYYY-MM-DD'),
                      });
                    } else {
                      form.setFieldsValue({
                        startDate: undefined,
                        endDate: undefined,
                      });
                    }
                  }}
                />
              </Form.Item>
              <Form.Item label="业务状态" name="businessStatus" style={{ marginTop: 12 }}>
                <Select
                  allowClear
                  placeholder="全部"
                  style={{ width: 120 }}
                >
                  <Option value="新增">新增</Option>
                  <Option value="续费">续费</Option>
                </Select>
              </Form.Item>
              {/* 三个按钮：查询 / 重置 / 导出（放在收费日期下方） */}
              <Form.Item style={{ width: '100%', marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Space>
                    <Button type="primary" onClick={handleSearch} loading={loading}>
                      查询
                    </Button>
                    <Button onClick={handleReset}>
                      <ReloadOutlined />
                      重置
                    </Button>
                    <Button onClick={handleExport}>
                      <DownloadOutlined />
                      导出
                    </Button>
                  </Space>
                </div>
              </Form.Item>
            </Form>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {summary && (
              <>
                <Card size="small" style={{ minWidth: 180 }}>
                  <Statistic title="总分公司数" value={total} suffix="个" valueStyle={{ color: '#3f8600' }} />
                </Card>
                <Card size="small" style={{ minWidth: 200 }}>
                  <Statistic title="总费用" value={summary.totalFee || 0} prefix="¥" valueStyle={{ color: '#1890ff' }} />
                </Card>
                <Card size="small" style={{ minWidth: 200 }}>
                  <Statistic
                    title="平均费用"
                    value={total > 0 ? (summary.totalFee || 0) / total : 0}
                    prefix="¥"
                    precision={2}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Card>
                <Card size="small" style={{ minWidth: 200 }}>
                  <Statistic
                    title="最高费用"
                    value={Math.max(...data.map(item => item.totalFee || 0))}
                    prefix="¥"
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="salesperson"
          // 不启用内部垂直滚动（页面外层滚动），避免表头插入滚动条占位列导致错位
          scroll={{ x: 2460 }}
          pagination={{
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
          summary={() => (
            summary ? (
              <Table.Summary.Row className="bg-blue-50">
                <Table.Summary.Cell index={0} className="font-bold">
                  总计
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} align="right" className="font-bold text-blue-600">
                  ¥{summary.licenseFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right" className="font-bold text-blue-600">
                  ¥{summary.brandFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right" className="font-bold text-blue-600">
                  ¥{summary.recordSealFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right" className="font-bold text-blue-600">
                  ¥{summary.generalSealFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right" className="font-bold text-blue-600">
                  ¥{summary.agencyFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} align="right" className="font-bold text-blue-600">
                  ¥{summary.accountingSoftwareFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={7} align="right" className="font-bold text-blue-600">
                  ¥{summary.addressFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={8} align="right" className="font-bold text-blue-600">
                  ¥{summary.onlineBankingCustodyFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={9} align="right" className="font-bold text-blue-600">
                  ¥{summary.invoiceSoftwareFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={10} align="right" className="font-bold text-blue-600">
                  ¥{summary.socialInsuranceAgencyFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={11} align="right" className="font-bold text-blue-600">
                  ¥{summary.housingFundAgencyFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={12} align="right" className="font-bold text-blue-600">
                  ¥{summary.statisticalReportFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={13} align="right" className="font-bold text-blue-600">
                  ¥{summary.customerDataOrganizationFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={14} align="right" className="font-bold text-blue-600">
                  ¥{summary.changeFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={15} align="right" className="font-bold text-blue-600">
                  ¥{summary.administrativeLicenseFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={16} align="right" className="font-bold text-blue-600">
                  ¥{summary.otherBusinessFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={17} align="right" className="font-bold text-blue-600">
                  ¥{summary.otherBusinessOutsourcingFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={18} align="right" className="font-bold text-blue-600">
                  ¥{summary.otherBusinessSpecialFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
                <Table.Summary.Cell index={19} align="right" className="font-bold text-red-600">
                  ¥{summary.totalFee?.toLocaleString() || 0}
                </Table.Summary.Cell>
              </Table.Summary.Row>
            ) : null
          )}
        />
      </Card>
    </div>
  );
};

export default BranchStatistics;


