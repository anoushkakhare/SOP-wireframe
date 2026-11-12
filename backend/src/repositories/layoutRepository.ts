import layoutsData from '../data/layouts.json';
import { LayoutManifest, Role } from '../types';

export class LayoutRepository {
  private layouts: Record<string, LayoutManifest> = layoutsData as Record<string, LayoutManifest>;

  async getByRole(role: Role): Promise<LayoutManifest | null> {
    return this.layouts[role] || this.layouts['demand_planner'] || null;
  }
}

export const layoutRepository = new LayoutRepository();

