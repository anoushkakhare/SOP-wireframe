import { dataReviewRepository } from '../repositories/dataReviewRepository';
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

export class DataReviewService {
  async getPipeline(): Promise<DataReviewFeed[]> {
    return dataReviewRepository.getPipeline();
  }

  async getHistory(): Promise<DataReviewHistoryItem[]> {
    return dataReviewRepository.getHistory();
  }

  async getReadiness(): Promise<DataReviewReadinessResponse> {
    return dataReviewRepository.getReadiness();
  }

  async getCalendarFeeds(): Promise<any[]> {
    return dataReviewRepository.getCalendarFeeds();
  }

  async loadFeed(feedId: string): Promise<DataReviewFeed | null> {
    return dataReviewRepository.loadFeed(feedId);
  }

  async updateReadiness(patch: {
    innovationReviewed?: boolean;
    comboPacksReviewed?: boolean;
  }): Promise<DataReviewReadinessResponse> {
    dataReviewRepository.updateReadiness(patch);
    return dataReviewRepository.getReadiness();
  }

  async signoff(
    data: SignoffRequest,
    userName: string = 'Demand Planner'
  ): Promise<DataReviewReadinessResponse> {
    return dataReviewRepository.signoff(data, userName);
  }

  async reopen(): Promise<DataReviewReadinessResponse> {
    return dataReviewRepository.reopen();
  }

  async getTransactions(
    query: TransactionReviewQueryParams = {}
  ): Promise<TransactionReviewResponse> {
    return dataReviewRepository.getTransactions(query);
  }

  async getValidationData(): Promise<DataValidationData> {
    return dataReviewRepository.getValidationData();
  }

  async fixMappingGap(id: string, fixType?: 'master' | 'transaction'): Promise<DataValidationData> {
    return dataReviewRepository.fixMappingGap(id, fixType);
  }

  async fixAllMappingGaps(): Promise<DataValidationData> {
    return dataReviewRepository.fixAllMappingGaps();
  }

  async replaceNullValue(id: string, method: 'zero' | 'mean' | 'median' | 'mode'): Promise<DataValidationData> {
    return dataReviewRepository.replaceNullValue(id, method);
  }

  async fixAllNullValues(method?: 'zero' | 'mean' | 'median' | 'mode'): Promise<DataValidationData> {
    return dataReviewRepository.fixAllNullValues(method);
  }

  async rerunMissingIntegration(): Promise<{ success: boolean; pendingFeeds: string[] }> {
    return dataReviewRepository.rerunMissingIntegration();
  }

  async getInnovations(): Promise<InnovationProduct[]> {
    return dataReviewRepository.getInnovations();
  }

  async addInnovation(product: Omit<InnovationProduct, 'id'>): Promise<InnovationProduct> {
    return dataReviewRepository.addInnovation(product);
  }

  async deleteInnovation(id: string): Promise<boolean> {
    return dataReviewRepository.deleteInnovation(id);
  }

  async getCombos(): Promise<ComboPack[]> {
    return dataReviewRepository.getCombos();
  }

  async createCombo(combo: Omit<ComboPack, 'id'>): Promise<ComboPack> {
    return dataReviewRepository.createCombo(combo);
  }

  async updateCombo(id: string, patch: Partial<ComboPack>): Promise<ComboPack | null> {
    return dataReviewRepository.updateCombo(id, patch);
  }

  async deleteCombo(id: string): Promise<boolean> {
    return dataReviewRepository.deleteCombo(id);
  }
}

export const dataReviewService = new DataReviewService();



