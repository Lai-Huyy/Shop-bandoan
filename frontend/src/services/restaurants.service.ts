import { apiClient, getApiData } from '@/lib/api/client';
import type {
  Restaurant,
  RestaurantListQuery,
  RestaurantListResponse,
} from '@/types/restaurant';

export const restaurantsService = {
  list(query: RestaurantListQuery = {}): Promise<RestaurantListResponse> {
    return getApiData(apiClient.get('/restaurants', { params: query }));
  },

  getById(id: string): Promise<Restaurant> {
    return getApiData(apiClient.get(`/restaurants/${id}`));
  },
};
