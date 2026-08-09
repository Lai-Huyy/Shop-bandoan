import type { PaginationMeta } from './api';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  phone: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RestaurantListResponse {
  items: Restaurant[];
  meta: PaginationMeta;
}

export interface RestaurantListQuery {
  page?: number;
  limit?: number;
  search?: string;
}
