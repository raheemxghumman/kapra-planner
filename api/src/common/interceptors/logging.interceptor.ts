import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { REQUEST_ID_HEADER } from '../middleware/request-id.middleware.js';

/**
 * Logs one line per successful request: method, URL, status, duration and request ID.
 * Interceptors wrap the route handler, so they can measure the time before and after it runs.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }
    const request = context.switchToHttp().getRequest<Request>();
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse<Response>();
        const requestId = String(request.headers[REQUEST_ID_HEADER] ?? '-');
        this.logger.log(
          `${request.method} ${request.originalUrl} ${response.statusCode} ${Date.now() - startedAt}ms [${requestId}]`,
        );
      }),
    );
  }
}
