export class UnavailableApiError extends Error {
  constructor(feature: string) {
    super(
      `${feature} is not available because the backend endpoint is not implemented.`,
    );
    this.name = 'UnavailableApiError';
  }
}

function createUnavailableService(feature: string) {
  return {
    request(): Promise<never> {
      // TODO: Replace once the corresponding /api/v1 backend module is implemented.
      return Promise.reject(new UnavailableApiError(feature));
    },
  };
}

export const productsService = createUnavailableService('Products');
export const categoriesService = createUnavailableService('Categories');
export const ordersService = createUnavailableService('Orders');
export const notificationsService = createUnavailableService('Notifications');
