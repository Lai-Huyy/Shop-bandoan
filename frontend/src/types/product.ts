import type { PaginationMeta } from './api';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  basePrice: string;
  status: string;
  stockQuantity: number;
  soldQuantity: number;
  category: { id: number; name: string; slug: string };
  images: {
    id: string;
    url: string;
    altText: string | null;
    isPrimary: boolean;
  }[];
  options: { id: string; name: string; values: string[]; isRequired: boolean }[];
}

export interface ProductPage {
  items: Product[];
  meta: PaginationMeta;
}
