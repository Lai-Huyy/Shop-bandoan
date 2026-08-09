import { apiClient, getApiData } from '@/lib/api/client';
import type {
  AdminOrderSummary,
  AdminOrdersQuery,
  CustomerOrdersQuery,
  Order,
  OrdersPage,
  OrderStatus,
} from '@/types/order';

export const ordersService = {
  list: (params?: CustomerOrdersQuery) =>
    getApiData<OrdersPage>(apiClient.get('/orders', { params })),
  detail: (id: string) => getApiData<Order>(apiClient.get(`/orders/${id}`)),
  cancel: (id: string) => getApiData<Order>(apiClient.post(`/orders/${id}/cancel`)),
  buyAgain: (id: string) => getApiData(apiClient.post(`/orders/${id}/buy-again`)),
  adminList: (params?: AdminOrdersQuery) =>
    getApiData<OrdersPage>(apiClient.get('/admin/orders', { params })),
  adminDetail: (id: string) =>
    getApiData<Order>(apiClient.get(`/admin/orders/${id}`)),
  adminSummary: () =>
    getApiData<AdminOrderSummary>(apiClient.get('/admin/orders/summary')),
  updateStatus: (id: string, status: OrderStatus) =>
    getApiData<Order>(apiClient.patch(`/admin/orders/${id}/status`, { status })),
};
