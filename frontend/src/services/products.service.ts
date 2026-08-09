import { apiClient, getApiData } from '@/lib/api/client';
import type { Product, ProductPage } from '@/types/product';

function createProductFormData(
  data: Record<string, string | number | undefined>,
  imageFile: File,
): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) formData.append(key, String(value));
  }

  formData.append('image', imageFile);
  return formData;
}

export const productsService = {
  list: (params?: Record<string, string | number>) =>
    getApiData<ProductPage>(apiClient.get('/products', { params })),
  getById: (id: string) =>
    getApiData<Product>(apiClient.get(`/products/${id}`)),
  listAdmin: () => getApiData<ProductPage>(apiClient.get('/products/admin')),
  create: (
    data: Record<string, string | number | undefined>,
    imageFile?: File,
  ) =>
    getApiData<Product>(
      imageFile
        ? apiClient.post('/products', createProductFormData(data, imageFile), {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        : apiClient.post('/products', data),
    ),
  update: (
    id: string,
    data: Record<string, string | number | undefined>,
    imageFile?: File,
  ) =>
    getApiData<Product>(
      imageFile
        ? apiClient.patch(`/products/${id}`, createProductFormData(data, imageFile), {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        : apiClient.patch(`/products/${id}`, data),
    ),
  addImage: (id: string, data: unknown) =>
    getApiData(apiClient.post(`/products/${id}/images`, data)),
  remove: (id: string) =>
    getApiData(apiClient.delete(`/products/${id}`)),
};
