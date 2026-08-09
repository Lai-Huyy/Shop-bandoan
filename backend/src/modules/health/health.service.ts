import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { RedisService } from '../../infrastructure/cache/redis.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

type DependencyStatus = 'up' | 'down';

export interface HealthCheckResult {
  status: 'ok';
  timestamp: string;
  dependencies: {
    database: DependencyStatus;
    redis: DependencyStatus;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async check(): Promise<HealthCheckResult> {
    const [databaseResult, redisResult] = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.redis.ping(),
    ]);

    const database = this.getDependencyStatus(databaseResult);
    const redis = this.getDependencyStatus(redisResult);

    if (database === 'down' || redis === 'down') {
      this.logger.error(
        `Health check failed: database=${database}, redis=${redis}`,
      );
      throw new ServiceUnavailableException({
        message: 'Required service dependencies are unavailable',
        errors: [
          ...(database === 'down'
            ? [{ service: 'database', code: 'DATABASE_UNAVAILABLE' }]
            : []),
          ...(redis === 'down'
            ? [{ service: 'redis', code: 'REDIS_UNAVAILABLE' }]
            : []),
        ],
      });
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      dependencies: { database, redis },
    };
  }

  private getDependencyStatus(
    result: PromiseSettledResult<unknown>,
  ): DependencyStatus {
    return result.status === 'fulfilled' ? 'up' : 'down';
  }
}
