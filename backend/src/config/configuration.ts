export const configuration = () => ({
  app: {
    environment: process.env.NODE_ENV,
    port: Number(process.env.PORT),
    corsOrigins: (process.env.CORS_ORIGIN ?? '')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  },
  jwt: {
    accessSecret: process.env.JWT_SECRET,
    accessExpiresIn: process.env.JWT_EXPIRES_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  auth: {
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS),
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    database: Number(process.env.REDIS_DB),
    password: process.env.REDIS_PASSWORD,
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
  },
  uploads: {
    directory: process.env.UPLOADS_DIRECTORY,
    publicBaseUrl: process.env.UPLOADS_PUBLIC_BASE_URL,
  },
  logging: {
    levels:
      process.env.NODE_ENV === 'production'
        ? ['log', 'warn', 'error']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  },
});
