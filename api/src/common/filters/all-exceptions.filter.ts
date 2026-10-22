import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { REQUEST_ID_HEADER } from '../middleware/request-id.middleware.js';

export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  requestId: string;
  timestamp: string;
}

/**
 * Turns every thrown error into the same JSON shape, so the frontend handles errors in one way.
 * Unexpected errors are logged with their stack but only a generic message is sent to the client,
 * so internal details (SQL, file paths) never leak.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const requestId = String(request.headers[REQUEST_ID_HEADER] ?? '');

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Something went wrong. Please try again.';
    let error = 'Internal Server Error';
    if (isHttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
        error = exception.name;
      } else {
        const details = body as { message?: string | string[]; error?: string };
        message = details.message ?? exception.message;
        error = details.error ?? exception.name;
      }
    } else {
      this.logger.error(
        `Unhandled error on ${request.method} ${request.originalUrl} [${requestId}]`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const payload: ErrorResponseBody = {
      statusCode,
      error,
      message,
      path: request.originalUrl,
      requestId,
      timestamp: new Date().toISOString(),
    };
    response.status(statusCode).json(payload);
  }
}
