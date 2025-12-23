import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ConfigModule } from '@nestjs/config';
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
import { MetricsMiddleware } from './common/middleware/metrics.middleware';
import { OperLogInterceptor } from './common/interceptors/operlog.interceptor';
import { ArticleModule } from './modules/article/article.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
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
