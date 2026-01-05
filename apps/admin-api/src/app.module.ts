import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';
import { ClsModule } from 'nestjs-cls';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { SystemModule } from './modules/system/system.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProductModule } from './modules/mall/product/product.module';
import { CategoryModule } from './modules/mall/category/category.module';
import { OrderModule } from './modules/mall/order/order.module';
import { MemberModule } from './modules/mall/member/member.module';
import { MemberLevelModule } from './modules/mall/member-level/member-level.module';
import { BannerModule } from './modules/mall/banner/banner.module';
import { ProductSpecGroupModule } from './modules/mall/product-spec-group/product-spec-group.module';
import { ProductSpecValueModule } from './modules/mall/product-spec-value/product-spec-value.module';
import { ProductSkuModule } from './modules/mall/product-sku/product-sku.module';
import { MemberAddressModule } from './modules/mall/member-address/member-address.module';
import { MemberInvoiceModule } from './modules/mall/member-invoice/member-invoice.module';
import { MemberLoginLogModule } from './modules/mall/member-login-log/member-login-log.module';
import { MemberBalanceLogModule } from './modules/mall/member-balance-log/member-balance-log.module';
import { MemberPointLogModule } from './modules/mall/member-point-log/member-point-log.module';
import { UploadModule } from './modules/upload/upload.module';
import { PrometheusModule } from 'nestjs-prometheus';
import { BullmqModule } from './common/bullmq/bullmq.module';
import { RedisModule } from './common/redis/redis.module';
import { CqrsModule } from '@nestjs/cqrs';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';
import { OperLogInterceptor } from './common/interceptors/operlog.interceptor';
import { SensitiveInterceptor } from './common/interceptors/sensitive.interceptor';
import { ArticleModule } from './modules/article/article.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { CouponTemplateModule } from './modules/marketing/coupon-template/coupon-template.module';
import { MemberCouponModule } from './modules/marketing/member-coupon/member-coupon.module';
import { PointRuleModule } from './modules/marketing/point-rule/point-rule.module';
import { PointProductModule } from './modules/marketing/point-product/point-product.module';
import { FullReductionModule } from './modules/marketing/full-reduction/full-reduction.module';
import { PointExchangeModule } from './modules/marketing/point-exchange/point-exchange.module';
import { PromotionModule } from './modules/marketing/promotion/promotion.module';
import { PromotionProductModule } from './modules/marketing/promotion-product/promotion-product.module';
import { GroupBuyOrderModule } from './modules/marketing/group-buy-order/group-buy-order.module';
import { GroupBuyMemberModule } from './modules/marketing/group-buy-member/group-buy-member.module';
import { SignInModule } from './modules/marketing/sign-in/sign-in.module';
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

    // 静态文件服务已通过 UploadController 处理，无需 ServeStaticModule

    // 业务模块
    AuthModule,
    SystemModule,
    DashboardModule,
    ProductModule,
    CategoryModule,
    OrderModule,
    MemberModule,
    MemberLevelModule,
    BannerModule,
    ProductSpecGroupModule,
    ProductSpecValueModule,
    ProductSkuModule,
    MemberAddressModule,
    MemberInvoiceModule,
    MemberLoginLogModule,
    MemberBalanceLogModule,
    MemberPointLogModule,
    UploadModule,
    ArticleModule,
    WorkflowModule,
    CouponTemplateModule,
    MemberCouponModule,
    PointRuleModule,
    PointProductModule,
    FullReductionModule,
    PointExchangeModule,
    PromotionModule,
    PromotionProductModule,
    GroupBuyOrderModule,
    GroupBuyMemberModule,
    SignInModule,
  ],
  providers: [
    {
      provide: 'APP_INTERCEPTOR',
      useClass: OperLogInterceptor,
    },
    {
      provide: 'APP_INTERCEPTOR',
      useClass: SensitiveInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MetricsMiddleware).forRoutes('*'); // 对所有路由应用指标中间件
  }
}
