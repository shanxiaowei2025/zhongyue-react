import request from './request';
import type { ApiResponse } from '../types';

export interface BusinessStatisticsQueryParams {
  startDate?: string;
  endDate?: string;
  salesperson?: string;
  /** 业务状态筛选：新增/续费 */
  businessStatus?: '新增' | '续费';
}

export interface BusinessStatisticsItem {
  salesperson: string;
  licenseFee: number;
  brandFee: number;
  recordSealFee: number;
  generalSealFee: number;
  agencyFee: number;
  accountingSoftwareFee: number;
  addressFee: number;
  onlineBankingCustodyFee: number;
  invoiceSoftwareFee: number;
  socialInsuranceAgencyFee: number;
  housingFundAgencyFee: number;
  statisticalReportFee: number;
  customerDataOrganizationFee: number;
  changeFee: number;
  administrativeLicenseFee: number;
  otherBusinessFee: number;
  otherBusinessOutsourcingFee: number;
  otherBusinessSpecialFee: number;
  totalFee: number;
}

// 按公司地点统计的项目接口
export interface BusinessStatisticsByLocationItem {
  companyLocation: string;
  licenseFee: number;
  brandFee: number;
  recordSealFee: number;
  generalSealFee: number;
  agencyFee: number;
  accountingSoftwareFee: number;
  addressFee: number;
  onlineBankingCustodyFee: number;
  invoiceSoftwareFee: number;
  socialInsuranceAgencyFee: number;
  housingFundAgencyFee: number;
  statisticalReportFee: number;
  customerDataOrganizationFee: number;
  changeFee: number;
  administrativeLicenseFee: number;
  otherBusinessFee: number;
  otherBusinessOutsourcingFee: number;
  otherBusinessSpecialFee: number;
  totalFee: number;
}

export interface BusinessStatisticsResponse {
  data: BusinessStatisticsItem[];
  summary: BusinessStatisticsItem;
  total: number;
}

// 按公司地点统计的响应接口
export interface BusinessStatisticsByLocationResponse {
  data: BusinessStatisticsByLocationItem[];
  summary: BusinessStatisticsByLocationItem;
  total: number;
}

/**
 * 获取业务统计数据
 */
export const getBusinessStatistics = (params: BusinessStatisticsQueryParams) =>
  request.get<ApiResponse<BusinessStatisticsResponse>>('/business-statistics', params);

/**
 * 获取按公司地点统计的业务统计数据
 */
export const getBusinessStatisticsByLocation = (params: BusinessStatisticsQueryParams) =>
  request.get<ApiResponse<BusinessStatisticsByLocationResponse>>('/business-statistics/by-location', params);
