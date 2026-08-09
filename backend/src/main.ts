import { Logger, LogLevel, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import type { ServerResponse } from 'node:http';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);
  const logLevels = configService.getOrThrow<LogLevel[]>('logging.levels');
  app.useLogger(logLevels);
  app.flushLogs();

  app.use(helmet());
  app.use(cookieParser());
  app.useStaticAssets(
    join(process.cwd(), configService.getOrThrow<string>('uploads.directory')),
    {
      prefix: '/uploads',
      setHeaders: (response: ServerResponse) => {
        response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    },
  );

  app.enableCors({
    origin: configService.getOrThrow<string[]>('app.corsOrigins'),
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerEnabled = configService.getOrThrow<boolean>('swagger.enabled');
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Shop-bandoan API')
      .setDescription(
        'REST API for the Shop-bandoan ecommerce and food-ordering platform.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addCookieAuth('refresh_token')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  app.enableShutdownHooks();

  const port = configService.getOrThrow<number>('app.port');
  await app.listen(port);
  logger.log(
    `Application server is running on: http://localhost:${port}/api/v1`,
  );
  if (swaggerEnabled) {
    logger.log(
      `OpenAPI / Swagger documentation: http://localhost:${port}/api/docs`,
    );
  }
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  const stack = error instanceof Error ? error.stack : undefined;
  logger.error('Application failed to start', stack);
  process.exitCode = 1;
});
