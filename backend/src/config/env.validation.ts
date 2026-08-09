const nodeEnvironments = ['development', 'test', 'production'] as const;

type NodeEnvironment = (typeof nodeEnvironments)[number];

function getString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function getPort(value: unknown, name: string, fallback: number): number {
  const rawValue = getString(value);
  if (!rawValue) {
    return fallback;
  }

  const port = Number(rawValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535`);
  }

  return port;
}

function getInteger(value: unknown, name: string, fallback: number): number {
  const rawValue = getString(value);
  if (!rawValue) {
    return fallback;
  }

  const integer = Number(rawValue);
  if (!Number.isInteger(integer) || integer < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }

  return integer;
}

function getBcryptSaltRounds(value: unknown): number {
  const rounds = getInteger(value, 'BCRYPT_SALT_ROUNDS', 12);
  if (rounds < 10 || rounds > 14) {
    throw new Error('BCRYPT_SALT_ROUNDS must be between 10 and 14');
  }

  return rounds;
}

function getBoolean(value: unknown, name: string, fallback: boolean): boolean {
  const rawValue = getString(value);
  if (!rawValue) {
    return fallback;
  }

  if (rawValue === 'true') {
    return true;
  }

  if (rawValue === 'false') {
    return false;
  }

  throw new Error(`${name} must be either true or false`);
}

function getDatabaseUrl(value: unknown): string {
  const databaseUrl = getString(value);
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  try {
    const url = new URL(databaseUrl);
    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
      throw new Error('invalid protocol');
    }
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL');
  }

  return databaseUrl;
}

function getPublicHttpUrl(value: unknown, fallback: string): string {
  const publicUrl = getString(value) ?? fallback;

  try {
    const url = new URL(publicUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      throw new Error('invalid protocol');
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    throw new Error('UPLOADS_PUBLIC_BASE_URL must be a valid HTTP(S) URL');
  }
}

function getUploadsDirectory(value: unknown): string {
  const directory = getString(value) ?? 'uploads';
  if (
    directory.startsWith('/') ||
    directory.startsWith('\\') ||
    /^[A-Za-z]:/.test(directory) ||
    directory.split(/[\\/]/).includes('..')
  ) {
    throw new Error(
      'UPLOADS_DIRECTORY must be a relative directory within the backend workspace',
    );
  }
  return directory;
}

function validateProductionJwtSecrets(
  accessSecret: string | undefined,
  refreshSecret: string | undefined,
  isProduction: boolean,
): void {
  if (!isProduction) {
    return;
  }

  if (!accessSecret || !refreshSecret) {
    throw new Error(
      'JWT_SECRET and JWT_REFRESH_SECRET are required when NODE_ENV is production',
    );
  }

  if (accessSecret.length < 32 || refreshSecret.length < 32) {
    throw new Error(
      'JWT secrets must each contain at least 32 characters in production',
    );
  }
}

export function validateEnvironment(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const requestedEnvironment = getString(config.NODE_ENV) ?? 'development';
  if (!nodeEnvironments.includes(requestedEnvironment as NodeEnvironment)) {
    throw new Error(`NODE_ENV must be one of: ${nodeEnvironments.join(', ')}`);
  }

  const nodeEnv = requestedEnvironment as NodeEnvironment;
  const isProduction = nodeEnv === 'production';
  const configuredJwtSecret = getString(config.JWT_SECRET);
  const configuredRefreshSecret = getString(config.JWT_REFRESH_SECRET);
  const corsOrigin = getString(config.CORS_ORIGIN);
  const port = getPort(config.PORT, 'PORT', 3000);
  const uploadsPublicBaseUrl = getPublicHttpUrl(
    config.UPLOADS_PUBLIC_BASE_URL,
    `http://localhost:${port}`,
  );

  validateProductionJwtSecrets(
    configuredJwtSecret,
    configuredRefreshSecret,
    isProduction,
  );

  if (isProduction && (!corsOrigin || corsOrigin.includes('*'))) {
    throw new Error(
      'CORS_ORIGIN must be an explicit origin allowlist in production',
    );
  }

  if (isProduction && !uploadsPublicBaseUrl.startsWith('https://')) {
    throw new Error('UPLOADS_PUBLIC_BASE_URL must use HTTPS in production');
  }

  return {
    ...config,
    NODE_ENV: nodeEnv,
    PORT: port,
    DATABASE_URL: getDatabaseUrl(config.DATABASE_URL),
    JWT_SECRET:
      configuredJwtSecret ?? 'development-only-secret-change-before-production',
    JWT_EXPIRES_IN: getString(config.JWT_EXPIRES_IN) ?? '1h',
    JWT_REFRESH_SECRET:
      configuredRefreshSecret ??
      'development-only-refresh-secret-change-before-production',
    JWT_REFRESH_EXPIRES_IN: getString(config.JWT_REFRESH_EXPIRES_IN) ?? '7d',
    BCRYPT_SALT_ROUNDS: getBcryptSaltRounds(config.BCRYPT_SALT_ROUNDS),
    CORS_ORIGIN: corsOrigin ?? 'http://localhost:3001',
    REDIS_HOST: getString(config.REDIS_HOST) ?? 'localhost',
    REDIS_PORT: getPort(config.REDIS_PORT, 'REDIS_PORT', 6379),
    REDIS_DB: getInteger(config.REDIS_DB, 'REDIS_DB', 0),
    REDIS_PASSWORD: getString(config.REDIS_PASSWORD),
    SWAGGER_ENABLED: getBoolean(
      config.SWAGGER_ENABLED,
      'SWAGGER_ENABLED',
      !isProduction,
    ),
    UPLOADS_DIRECTORY: getUploadsDirectory(config.UPLOADS_DIRECTORY),
    UPLOADS_PUBLIC_BASE_URL: uploadsPublicBaseUrl,
  };
}
