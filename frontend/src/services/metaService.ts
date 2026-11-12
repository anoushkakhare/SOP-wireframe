import { request } from './apiClient';
import { MetaOptions } from '../types';

export const metaService = {
  async getOptions(): Promise<MetaOptions> {
    return request<MetaOptions>('/meta/options');
  },
};

