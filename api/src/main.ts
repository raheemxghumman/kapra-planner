import { ClassSerializerInterceptor, Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import type { EnvironmentVariables } from './config/env.validation.js';

async function bootstrap(): Promise<void> {
  // rawBody is needed later to verify Stripe webhook signatures.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  // All routes live under /api/v1/..., so a future v2 can run side by side.
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Security headers (XSS protection, no MIME sniffing, etc.).
  app.use(helmet());

  // Only our frontend may call the API from a browser.
  app.enableCors({ origin: config.get('WEB_ORIGIN', { infer: true }), credentials: true });

  // Validate every request body/query against its DTO:
  // whitelist removes unknown fields, forbidNonWhitelisted rejects them, transform builds DTO instances.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // Hides fields marked @Exclude() (e.g. passwordHash) from every response.
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Kapra Planner API')
    .setDescription('REST API for the Kapra Planner web app')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  app.enableShutdownHooks();

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`API running on http://localhost:${port}/api/v1 (docs at /api/docs)`, 'Bootstrap');
}

await bootstrap();
