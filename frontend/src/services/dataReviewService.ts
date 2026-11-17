import { request } from './apiClient';
import {
  DataReviewFeed,
  DataReviewHistoryItem,
  DataReviewReadinessResponse,
  SignoffRequest,
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
};

