// interceptors/logging.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap, catchError } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

interface RequestLog {
  requestId: string;
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  body?: any;
  query?: any;
  params?: any;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse();
    const now = Date.now();

    // Генерируем или берём correlation ID
    const existing = request.headers['x-correlation-id'];
    const requestId = Array.isArray(existing)
        ? existing[0] // берём первый, если массив
        : typeof existing === 'string'
        ? existing
        : uuidv4();

    // ✅ Отправляем в ответ, а не в request.headers
    response.set('X-Correlation-Id', requestId);

    const log: RequestLog = {
        requestId,
        method: request.method,
        url: request.url,
        ip: this.getClientIp(request),
        userAgent: request.get('User-Agent'),
        body: this.sanitize(request.body),
        query: request.query,
        params: request.params,
    };

    const user = (request as any).user;
    if (user) {
        log.userId = user.userId || user.sub;
    }

    this.logger.log({
        action: 'request.start',
        ...log,
    });

    return next.handle().pipe(
        tap(() => {
        this.logger.log({
            action: 'request.end',
            requestId,
            statusCode: response.statusCode,
            responseTime: Date.now() - now,
        });
        }),
        catchError((error) => {
        this.logger.error({
            action: 'request.error',
            requestId,
            statusCode: error.status || 500,
            error: error.message,
            stack: error.stack,
            responseTime: Date.now() - now,
        });
        throw error;
        }),
    );
  }
  private getClientIp(request: Request): string {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      request.socket.remoteAddress ||
      'unknown'
    );
  }

  private sanitize(obj: any): any {
    if (!obj) return obj;
    const clone = { ...obj };
    // Убираем чувствительные поля
    delete clone.password;
    delete clone.secret;
    delete clone.token;
    return clone;
  }
}