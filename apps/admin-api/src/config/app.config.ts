import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
  const nodeEnv = process.env.NODE_ENV ?? 'development';

  return {
    nodeEnv,
    prefix: process.env.APP_PREFIX ?? 'api',
    port: parseInt(process.env.APP_PORT ?? '3000', 10),
    isProd: nodeEnv === 'production',
    isDev: nodeEnv === 'development',
    isTest: nodeEnv === 'test',
    isLocal: nodeEnv === 'local',
  };
});
