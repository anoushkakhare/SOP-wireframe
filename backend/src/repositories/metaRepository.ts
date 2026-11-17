import masterData from '../data/masterData.json';
import { MetaOptions, HierarchyNode } from '../types';

export class MetaRepository {
  async getOptions(): Promise<MetaOptions> {
    const items = masterData.items as any[];
    const categories     = Array.from(new Set(items.map((i: any) => i.category)));
    const brands         = Array.from(new Set(items.map((i: any) => i.brand)));
    const products       = Array.from(new Set(items.map((i: any) => i.forecastUnit)));
    const customerGroups = ['Modern Trade', 'General Trade', 'E-commerce', 'Quick Commerce'];
    const customers      = customerGroups;
    const businessUnits  = categories;

    return {
      productLevels: [
        { value: 'brand',   label: 'Brand'   },
        { value: 'product', label: 'Product' },
      ],
      customerLevels: [
        { value: 'customer',       label: 'Customer'       },
        { value: 'customer_group', label: 'Customer group' },
      ],
      uoms: [
        { value: 'cases',   label: 'Cases'  },
        { value: 'units',   label: 'Units'  },
        { value: 'value',   label: 'Value'  },
      ],
      timeGrains: [
        { value: 'year',      label: 'Year'      },
        { value: 'half',      label: 'Half-year' },
        { value: 'quarter',   label: 'Quarter'   },
        { value: 'month',     label: 'Month'     },
        { value: 'week',      label: 'Week'      },
      ],
      measures: [
        { value: 'cases', label: 'Cases' },
        { value: 'units', label: 'Units' },
        { value: 'value', label: 'Value' },
      ],
      filters: { categories, brands, products, customerGroups, customers, businessUnits },
    };
  }

  async getHierarchy(): Promise<HierarchyNode[]> {
    return masterData.nodes as HierarchyNode[];
  }
}

export const metaRepository = new MetaRepository();
