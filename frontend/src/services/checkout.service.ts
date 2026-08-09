import { apiClient, getApiData } from '@/lib/api/client';
import type { AddressInput, CheckoutInput, CheckoutResult, UserAddress } from '@/types/checkout';

export const checkoutService = {
  getAddresses: () => getApiData<UserAddress[]>(apiClient.get('/users/addresses')),
  createAddress: (data: AddressInput) => getApiData<UserAddress>(apiClient.post('/users/addresses', data)),
  updateAddress: (id: string, data: AddressInput) => getApiData<UserAddress>(apiClient.patch(`/users/addresses/${id}`, data)),
  deleteAddress: (id: string) => getApiData<{ message: string }>(apiClient.delete(`/users/addresses/${id}`)),
  checkout: (data: CheckoutInput) =>
    getApiData<CheckoutResult>(apiClient.post('/checkout', data)),
};
