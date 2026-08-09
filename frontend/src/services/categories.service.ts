import { apiClient, getApiData } from '@/lib/api/client';
import type { PaginationMeta } from '@/types/api';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isDisplayed: boolean;
  sortOrder: number;
  parentId?: number | null;
}

export interface CategoryPage {
  items: Category[];
  meta: PaginationMeta;
}

export const categoriesService = {
  list: (params?: Record<string, string | number>) =>
    getApiData<CategoryPage>(apiClient.get('/categories', { params })),
  listAdmin: () =>
    getApiData<CategoryPage>(apiClient.get('/categories/admin')),
  create: (data: unknown) =>
    getApiData<Category>(apiClient.post('/categories', data)),
  update: (id: number, data: unknown) =>
    getApiData<Category>(apiClient.patch(`/categories/${id}`, data)),
  remove: (id: number) => getApiData(apiClient.delete(`/categories/${id}`)),
};
