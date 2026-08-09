import { ServiceUnavailableException } from '@nestjs/common';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const prisma = {
    $queryRaw: jest.fn(),
  };
  const redis = {
    ping: jest.fn(),
  };
  const healthService = new HealthService(prisma as never, redis as never);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns healthy when PostgreSQL and Redis are available', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redis.ping.mockResolvedValue('PONG');

    await expect(healthService.check()).resolves.toEqual(
      expect.objectContaining({
        status: 'ok',
        dependencies: {
          database: 'up',
          redis: 'up',
        },
      }),
    );
  });

  it('returns service unavailable when a dependency cannot be reached', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('Database unavailable'));
    redis.ping.mockResolvedValue('PONG');

    await expect(healthService.check()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
