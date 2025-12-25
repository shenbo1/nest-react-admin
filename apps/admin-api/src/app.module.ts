import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
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
import { CqrsModule } from '@nestjs/cqrs';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';
import { OperLogInterceptor } from './common/interceptors/operlog.interceptor';
import { ArticleModule } from './modules/article/article.module';
import { appConfigs } from '@/config';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: appConfigs,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test', 'local')
          .default('development'),
        APP_PREFIX: Joi.string().default('api'),
        APP_PORT: Joi.number().port().default(3000),
        JWT_SECRET: Joi.string().min(10).required(),
        JWT_EXPIRES_IN: Joi.string().default('7d'),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().port().default(6379),
        REDIS_PASSWORD: Joi.string().allow('', null),
        BASE_URL: Joi.string().uri().allow('', null),
      }),
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
