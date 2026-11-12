import { layoutRepository } from '../repositories/layoutRepository';
import { LayoutManifest, Role } from '../types';

export class LayoutService {
  async getLayout(role: Role): Promise<LayoutManifest | null> {
    return layoutRepository.getByRole(role);
  }
}

export const layoutService = new LayoutService();

