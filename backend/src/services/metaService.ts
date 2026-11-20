import { metaRepository } from '../repositories/metaRepository';
import { MetaOptions, HierarchyNode } from '../types';

export class MetaService {
  async getOptions(): Promise<MetaOptions> {
    return metaRepository.getOptions();
  }

  async getHierarchy(): Promise<HierarchyNode[]> {
    return metaRepository.getHierarchy();
  }
}

export const metaService = new MetaService();
