import { create } from 'zustand';
import { ProductLevel, CustomerLevel, Uom } from '../types';

interface HeaderState {
  productLevel: ProductLevel;
  parentBrand?: string;
  customerLevel: CustomerLevel;
  uom: Uom;
  setProductLevel: (level: ProductLevel, parentBrand?: string) => void;
  setCustomerLevel: (level: CustomerLevel) => void;
  setUom: (uom: Uom) => void;
  drillDown: (brand: string) => void;
  drillUp: () => void;
}

export const useHeaderStore = create<HeaderState>((set) => ({
  productLevel: 'brand',
  parentBrand: undefined,
  customerLevel: 'customer_group',
  uom: 'units',

  setProductLevel: (level: ProductLevel, parentBrand?: string) => {
    set({
      productLevel: level,
      parentBrand: level === 'brand' ? undefined : parentBrand,
    });
  },

  setCustomerLevel: (customerLevel: CustomerLevel) => {
    set({ customerLevel });
  },

  setUom: (uom: Uom) => {
    set({ uom });
  },

  drillDown: (brand: string) => {
    set({
      productLevel: 'product',
      parentBrand: brand,
    });
  },

  drillUp: () => {
    set({
      productLevel: 'brand',
      parentBrand: undefined,
    });
  },
}));

