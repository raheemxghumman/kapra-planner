import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { EnvironmentVariables, validateEnv } from './config/env.validation.js';
import { buildTypeOrmOptions } from './database/typeorm.options.js';
import { LlmModule } from './integrations/llm/llm.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BrandsModule } from './modules/brands/brands.module.js';
import { CatalogueModule } from './modules/catalogue/catalogue.module.js';
import { ProfilesModule } from './modules/profiles/profiles.module.js';
import { StylistModule } from './modules/stylist/stylist.module.js';
import { TryOnModule } from './modules/tryon/try-on.module.js';
import { StorageModule } from './integrations/storage/storage.module.js';
import { WishlistModule } from './modules/wishlist/wishlist.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    // Loads .env, validates it, and makes ConfigService available everywhere.
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validateEnv }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) =>
        buildTypeOrmOptions(
          config.get('DATABASE_URL', { infer: true }),
          config.get('DATABASE_SSL', { infer: true }),
        ),
    }),

    // In-process events (built on Node's EventEmitter), e.g. booking.confirmed -> send email.
    EventEmitterModule.forRoot(),

    // Default rate limit: 100 requests per minute per IP. Stricter limits are set per route.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),

    HealthModule,
    LlmModule,
    UsersModule,
    AuthModule,
    BrandsModule,
    CatalogueModule,
    ProfilesModule,
    WishlistModule,
    StylistModule,
    StorageModule,
    TryOnModule,
  ],
  providers: [
    // Guards run in this order: rate limit -> valid JWT (unless @Public) -> role check.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*path');
  }
}
