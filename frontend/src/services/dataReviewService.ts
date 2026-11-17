import { request } from './apiClient';
import {
  DataReviewFeed,
  DataReviewHistoryItem,
  DataReviewReadinessResponse,
  SignoffRequest,
  TransactionReviewQueryParams,
  TransactionReviewResponse,
} from '../types';

export const dataReviewService = {
  getPipeline(): Promise<DataReviewFeed[]> {
    return request<DataReviewFeed[]>('/data-review/pipeline');
  },

  getHistory(): Promise<DataReviewHistoryItem[]> {
    return request<DataReviewHistoryItem[]>('/data-review/history');
  },

  getReadiness(): Promise<DataReviewReadinessResponse> {
    return request<DataReviewReadinessResponse>('/data-review/readiness');
  },

  getCalendarFeeds(): Promise<any[]> {
    return request<any[]>('/data-review/calendar');
  },

  loadFeed(id: string): Promise<DataReviewFeed> {
    return request<DataReviewFeed>(`/data-review/pipeline/${id}/load`, {
      method: 'POST',
    });
  },

  updateReadiness(patch: {
    innovationReviewed?: boolean;
    comboPacksReviewed?: boolean;
  }): Promise<DataReviewReadinessResponse> {
    return request<DataReviewReadinessResponse>('/data-review/readiness', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  },

  signoff(data: SignoffRequest): Promise<DataReviewReadinessResponse> {
    return request<DataReviewReadinessResponse>('/data-review/signoff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  reopen(): Promise<DataReviewReadinessResponse> {
    return request<DataReviewReadinessResponse>('/data-review/reopen', {
      method: 'POST',
    });
  },

  getTransactions(params: TransactionReviewQueryParams = {}): Promise<TransactionReviewResponse> {
    const sp = new URLSearchParams();
    if (params.measure) sp.set('measure', params.measure);
    if (params.groupBy) sp.set('groupBy', params.groupBy);
    if (params.from) sp.set('from', params.from);
    if (params.to) sp.set('to', params.to);
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return request<TransactionReviewResponse>(`/data-review/transactions${qs}`);
  },
};


