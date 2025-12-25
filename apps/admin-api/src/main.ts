import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq';
import { BullConfigService } from './common/bullmq/bullmq.service';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';
import { appConfig, type AppConfig } from '@/config';
import { SYSTEM_JOB_QUEUE } from '@/common/constants/queues';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<AppConfig>(appConfig.KEY);
  const bullConfigService = app.get(BullConfigService);

  // 全局前缀
  const prefix = config.prefix ?? 'api';
  app.setGlobalPrefix(prefix);

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false, // 设置为false，只过滤未定义的属性，不抛出错误
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局响应拦截器 - 统一返回格式 { code, message, data }
  app.useGlobalInterceptors(new TransformInterceptor());

  // 全局异常过滤器 - 统一错误返回格式
  app.useGlobalFilters(new HttpExceptionFilter());

  // 指标中间件将在AppModule中注册

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger 文档
  if (!config.isProd) {
    const config = new DocumentBuilder()
      .setTitle('后台管理系统 API')
      .setDescription('NestJS + React + Prisma 后台管理系统接口文档')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  // Bull Board 监控面板
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/bull');
  const bullConnection = bullConfigService.getConnection();
  const systemJobQueue = new Queue(SYSTEM_JOB_QUEUE, {
    connection: bullConnection,
  });
  createBullBoard({
    queues: [new BullMQAdapter(systemJobQueue)],
    serverAdapter,
  });
  app.use('/bull', serverAdapter.getRouter());

  const port = config.port ?? 3000;
  await app.listen(port);

  console.log(`🚀 应用已启动: http://localhost:${port}/${prefix}`);
  console.log(`📚 API 文档: http://localhost:${port}/docs`);
  console.log(`🧰 Bull Board: http://localhost:${port}/bull`);
}

bootstrap();
