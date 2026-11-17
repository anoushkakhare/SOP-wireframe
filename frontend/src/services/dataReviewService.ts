import { request } from './apiClient';
import {
  ComboPack,
  DataReviewFeed,
  DataReviewHistoryItem,
  DataReviewReadinessResponse,
  DataValidationData,
  InnovationProduct,
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

  getValidationData(): Promise<DataValidationData> {
    return request<DataValidationData>('/data-review/validation');
  },

  fixMappingGap(id: string, fixType: 'master' | 'transaction' = 'master'): Promise<DataValidationData> {
    return request<DataValidationData>(`/data-review/validation/mapping-gaps/${id}/fix`, {
      method: 'POST',
      body: JSON.stringify({ fixType }),
    });
  },

  replaceNullValue(id: string, method: 'zero' | 'mean' | 'mode'): Promise<DataValidationData> {
    return request<DataValidationData>(`/data-review/validation/null-values/${id}/replace`, {
      method: 'POST',
      body: JSON.stringify({ method }),
    });
  },

  rerunMissingIntegration(): Promise<{ success: boolean; pendingFeeds: string[] }> {
    return request<{ success: boolean; pendingFeeds: string[] }>('/data-review/validation/rerun-integration', {
      method: 'POST',
    });
  },

  getInnovations(): Promise<InnovationProduct[]> {
    return request<InnovationProduct[]>('/data-review/innovations');
  },

  addInnovation(product: Omit<InnovationProduct, 'id'>): Promise<InnovationProduct> {
    return request<InnovationProduct>('/data-review/innovations', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  },

  deleteInnovation(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/data-review/innovations/${id}`, {
      method: 'DELETE',
    });
  },

  getCombos(): Promise<ComboPack[]> {
    return request<ComboPack[]>('/data-review/combos');
  },

  createCombo(combo: Omit<ComboPack, 'id'>): Promise<ComboPack> {
    return request<ComboPack>('/data-review/combos', {
      method: 'POST',
      body: JSON.stringify(combo),
    });
  },

  updateCombo(id: string, combo: Partial<ComboPack>): Promise<ComboPack> {
    return request<ComboPack>(`/data-review/combos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(combo),
    });
  },

  deleteCombo(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/data-review/combos/${id}`, {
      method: 'DELETE',
    });
  },
};



