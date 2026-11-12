import masterData from '../data/masterData.json';
import { MetaOptions } from '../types';

export class MetaRepository {
  async getOptions(): Promise<MetaOptions> {
    const categories = Array.from(new Set(masterData.items.map((i: any) => i.category)));
    const brands = Array.from(new Set(masterData.items.map((i: any) => i.brand)));
    const products = Array.from(new Set(masterData.items.map((i: any) => i.product)));
    const customerGroups = Array.from(new Set(masterData.items.map((i: any) => i.customerGroup)));
    const customers = Array.from(new Set(masterData.items.map((i: any) => i.customer)));
    const businessUnits = Array.from(new Set(masterData.items.map((i: any) => i.businessUnit)));

    return {
      productLevels: [
        { value: 'brand', label: 'Brand' },
        { value: 'product', label: 'Product' }
      ],
      customerLevels: [
        { value: 'customer', label: 'Customer' },
        { value: 'customer_group', label: 'Customer group' }
      ],
      uoms: [
        { value: 'units', label: 'Units' },
        { value: 'volume', label: 'Volume' },
        { value: 'revenue', label: 'Value' }
      ],
      filters: {
        categories,
        brands,
        products,
        customerGroups,
        customers,
        businessUnits
      }
    };
  }
}

export const metaRepository = new MetaRepository();
