import { metaRepository } from '../repositories/metaRepository';
import { MetaOptions } from '../types';

export class MetaService {
  async getOptions(): Promise<MetaOptions> {
    return metaRepository.getOptions();
  }
}

export const metaService = new MetaService();

