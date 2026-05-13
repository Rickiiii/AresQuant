interface EnvironmentVariables {
  readonly DATABASE_URL: string;
  readonly REDIS_URL: string;
  readonly APP_PORT?: string;
  readonly DATA_SYNC_BATCH_SIZE?: string;
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
  const redisUrl = requireString(config.REDIS_URL as string | undefined, 'REDIS_URL');
  requirePositiveInteger(config.APP_PORT as string | undefined, 'APP_PORT');
  requirePositiveInteger(config.DATA_SYNC_BATCH_SIZE as string | undefined, 'DATA_SYNC_BATCH_SIZE');

  const validated: EnvironmentVariables = {
    DATABASE_URL: databaseUrl,
    REDIS_URL: redisUrl,
  };
  const appPort = config.APP_PORT as string | undefined;
  const dataSyncBatchSize = config.DATA_SYNC_BATCH_SIZE as string | undefined;
  return {
    ...validated,
    ...(appPort === undefined ? {} : { APP_PORT: appPort }),
    ...(dataSyncBatchSize === undefined ? {} : { DATA_SYNC_BATCH_SIZE: dataSyncBatchSize }),
  };
}
