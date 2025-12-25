import type { ConfigService, ConfigType } from '@nestjs/config';
import appConfig from './app.config';
import authConfig from './auth.config';
import redisConfig from './redis.config';
import uploadConfig from './upload.config';

export { appConfig, authConfig, redisConfig, uploadConfig };
export const appConfigs = [appConfig, authConfig, redisConfig, uploadConfig];

export type AppConfig = ConfigType<typeof appConfig>;
export type AuthConfig = ConfigType<typeof authConfig>;
export type RedisConfig = ConfigType<typeof redisConfig>;
export type UploadConfig = ConfigType<typeof uploadConfig>;
