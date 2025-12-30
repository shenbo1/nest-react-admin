import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';
import { ClsModule } from 'nestjs-cls';
import { join } from 'path';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { SystemModule } from './modules/system/system.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProductModule } from './modules/mall/product/product.module';
import { CategoryModule } from './modules/mall/category/category.module';
import { OrderModule } from './modules/mall/order/order.module';
import { MemberModule } from './modules/mall/member/member.module';
import { BannerModule } from './modules/mall/banner/banner.module';
import { ProductSpecGroupModule } from './modules/mall/product-spec-group/product-spec-group.module';
import { ProductSpecValueModule } from './modules/mall/product-spec-value/product-spec-value.module';
import { ProductSkuModule } from './modules/mall/product-sku/product-sku.module';
import { UploadModule } from './modules/upload/upload.module';
import { PrometheusModule } from 'nestjs-prometheus';
import { BullmqModule } from './common/bullmq/bullmq.module';
import { RedisModule } from './common/redis/redis.module';
import { CqrsModule } from '@nestjs/cqrs';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';
import { OperLogInterceptor } from './common/interceptors/operlog.interceptor';
import { ArticleModule } from './modules/article/article.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { appConfigs } from '@/config';

// Zod 环境变量验证 schema
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test', 'local'])
    .default('development'),
  APP_PREFIX: z.string().default('api'),
  APP_PORT: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive().default(3000)),
  JWT_SECRET: z.string().min(10),
  JWT_EXPIRES_IN: z.string().default('7d'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().positive().default(6379)),
  REDIS_PASSWORD: z.string().optional().or(z.literal('')),
  BASE_URL: z.string().url().optional().or(z.literal('')),
});

// 环境变量验证函数
function validateEnv(env: Record<string, unknown>) {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const errors = result.error.errors.map(
      (e) => `${e.path.join('.')}: ${e.message}`,
    );
    throw new Error(`环境变量验证失败:\n${errors.join('\n')}`);
  }
  return result.data;
}

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: appConfigs,
      validate: validateEnv,
    }),

    // CLS 模块 - 用于存储请求上下文（当前用户等）
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
      },
    }),

    // Prisma 数据库模块
    PrismaModule,

    // Prometheus 监控模块
    PrometheusModule.register(),

    // CQRS 模块
    CqrsModule,

    // BullMQ 任务队列
    BullmqModule,

    // Redis 缓存模块
    RedisModule,

    // 静态文件服务
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/upload',
    }),

    // 业务模块
    AuthModule,
    SystemModule,
    DashboardModule,
    ProductModule,
    CategoryModule,
    OrderModule,
    MemberModule,
    BannerModule,
    ProductSpecGroupModule,
    ProductSpecValueModule,
    ProductSkuModule,
    UploadModule,
    ArticleModule,
    WorkflowModule,
  ],
  providers: [
    {
      provide: 'APP_INTERCEPTOR',
      useClass: OperLogInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*'); // 对所有路由应用指标中间件
  }
}
