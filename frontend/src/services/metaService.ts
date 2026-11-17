import { request } from './apiClient';
import { MetaOptions, HierarchyNode } from '../types';

export const metaService = {
  async getOptions(): Promise<MetaOptions> {
    return request<MetaOptions>('/meta/options');
  },

  async getHierarchy(): Promise<HierarchyNode[]> {
    return request<HierarchyNode[]>('/meta/hierarchy');
  },
};
