import { apiClient, getApiData } from '@/lib/api/client';

export interface HealthStatus {
  status: string;
  database: string;
  redis: string;
}

export const healthService = {
  getStatus(): Promise<HealthStatus> {
    return getApiData(apiClient.get('/health'));
  },
};
