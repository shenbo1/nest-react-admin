import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { MetricsMiddleware } from './common/middleware/metrics.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 全局前缀
  const prefix = configService.get<string>('APP_PREFIX', 'api');
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
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('后台管理系统 API')
      .setDescription('NestJS + React + Prisma 后台管理系统接口文档')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = configService.get<number>('APP_PORT', 3000);
  await app.listen(port);

  console.log(`🚀 应用已启动: http://localhost:${port}/${prefix}`);
  console.log(`📚 API 文档: http://localhost:${port}/docs`);
}

bootstrap();
