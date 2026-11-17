import { dataReviewRepository } from '../repositories/dataReviewRepository';
import {
  DataReviewFeed,
  DataReviewHistoryItem,
  DataReviewReadinessResponse,
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
}

export const dataReviewService = new DataReviewService();


