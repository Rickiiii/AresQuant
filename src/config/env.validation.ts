interface EnvironmentVariables {
  readonly DATABASE_URL: string;
  readonly REDIS_URL?: string;
  readonly REDIS_HOST?: string;
  readonly REDIS_PORT?: string;
  readonly REDIS_PASSWORD?: string;
  readonly APP_PORT?: string;
  readonly DATA_SYNC_BATCH_SIZE?: string;
  readonly DATA_SYNC_CONCURRENCY?: string;
}

function requireString(value: string | undefined, key: keyof EnvironmentVariables): string {
  if (value === undefined || value.trim().length === 0) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
}

function requirePositiveInteger(value: string | undefined, key: keyof EnvironmentVariables): void {
  if (value === undefined) {
    return;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${key} must be a positive integer`);
  }
}

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const databaseUrl = requireString(config.DATABASE_URL as string | undefined, 'DATABASE_URL');
  requirePositiveInteger(config.APP_PORT as string | undefined, 'APP_PORT');
  requirePositiveInteger(config.DATA_SYNC_BATCH_SIZE as string | undefined, 'DATA_SYNC_BATCH_SIZE');
  requirePositiveInteger(config.DATA_SYNC_CONCURRENCY as string | undefined, 'DATA_SYNC_CONCURRENCY');
  requirePositiveInteger(config.REDIS_PORT as string | undefined, 'REDIS_PORT');

  const validated: EnvironmentVariables = {
    DATABASE_URL: databaseUrl,
  };
  const appPort = config.APP_PORT as string | undefined;
  const dataSyncBatchSize = config.DATA_SYNC_BATCH_SIZE as string | undefined;
  const dataSyncConcurrency = config.DATA_SYNC_CONCURRENCY as string | undefined;
  const redisUrl = config.REDIS_URL as string | undefined;
  const redisHost = config.REDIS_HOST as string | undefined;
  const redisPort = config.REDIS_PORT as string | undefined;
  const redisPassword = config.REDIS_PASSWORD as string | undefined;
  return {
    ...validated,
    ...(appPort === undefined ? {} : { APP_PORT: appPort }),
    ...(dataSyncBatchSize === undefined ? {} : { DATA_SYNC_BATCH_SIZE: dataSyncBatchSize }),
    ...(dataSyncConcurrency === undefined ? {} : { DATA_SYNC_CONCURRENCY: dataSyncConcurrency }),
    ...(redisUrl === undefined ? {} : { REDIS_URL: redisUrl }),
    ...(redisHost === undefined ? {} : { REDIS_HOST: redisHost }),
    ...(redisPort === undefined ? {} : { REDIS_PORT: redisPort }),
    ...(redisPassword === undefined ? {} : { REDIS_PASSWORD: redisPassword }),
  };
}
