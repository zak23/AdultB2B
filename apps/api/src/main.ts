import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Cookie parser for JWT in cookies
  app.use(cookieParser());

  // CORS
  const corsOriginConfig = configService.get('CORS_ORIGIN');
  const defaultCorsOrigins = ['http://localhost:3001', 'http://127.0.0.1:3001'];
  const corsOrigins = corsOriginConfig
    ? corsOriginConfig
        .split(',')
        .map((origin: string) => origin.trim())
        .filter(Boolean)
    : defaultCorsOrigins;
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('AdultB2B API')
    .setDescription('API for the AdultB2B professional networking platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('access_token')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('API_PORT', 4000);
  await app.listen(port);

  console.log(`🚀 AdultB2B API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
