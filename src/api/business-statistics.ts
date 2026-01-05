import request from './request';
import type { ApiResponse } from '../types';

export interface BusinessStatisticsQueryParams {
  startDate?: string;
  endDate?: string;
  salesperson?: string;
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

export interface BusinessStatisticsResponse {
  data: BusinessStatisticsItem[];
  summary: BusinessStatisticsItem;
  total: number;
}

/**
 * 获取业务统计数据
 */
export const getBusinessStatistics = (params: BusinessStatisticsQueryParams) =>
  request.get<ApiResponse<BusinessStatisticsResponse>>('/business-statistics', params);
