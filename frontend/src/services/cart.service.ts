import { apiClient, getApiData } from '@/lib/api/client';
import type { AddCartItemInput, Cart } from '@/types/cart';

export const cartService = {
  get: () => getApiData<Cart>(apiClient.get('/cart')),
  addItem: (data: AddCartItemInput) =>
    getApiData<Cart>(apiClient.post('/cart/items', data)),
  updateItem: (itemId: string, quantity: number) =>
    getApiData<Cart>(apiClient.patch(`/cart/items/${itemId}`, { quantity })),
  removeItem: (itemId: string) =>
    getApiData<{ message: string }>(apiClient.delete(`/cart/items/${itemId}`)),
};
