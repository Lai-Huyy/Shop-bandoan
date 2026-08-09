import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.getOrThrow<string>('redis.host'),
      port: this.configService.getOrThrow<number>('redis.port'),
      db: this.configService.getOrThrow<number>('redis.database'),
      password: this.configService.get<string>('redis.password'),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null,
    });

    this.client.on('error', (error: Error) => {
      this.logger.warn(`Redis client error: ${error.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ping();
      this.logger.log('Redis connection established');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Redis is unavailable at startup: ${message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status !== 'end') {
      await this.client.quit();
    }
  }

  async ping(): Promise<'PONG'> {
    if (this.client.status === 'wait' || this.client.status === 'end') {
      await this.client.connect();
    }

    return this.client.ping();
  }
}
