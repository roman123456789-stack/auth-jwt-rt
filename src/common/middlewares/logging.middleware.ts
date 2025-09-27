import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-correlation-id'] as string || uuidv4();
    const now = Date.now();

    // Сохраняем ID в запросе и ответе
    req.headers['X-Correlation-Id'] = requestId;
    req['requestId'] = requestId;
    res.setHeader('X-Correlation-Id', requestId);

    const log: any = {
      requestId,
      method: req.method,
      url: req.url,
      ip: this.getClientIp(req),
      userAgent: req.get('User-Agent'),
      query: req.query,
      params: req.params,
      body: this.sanitize(req.body),
    };

    const user = (req as any).user;
    if (user) {
      log.userId = user.userId || user.sub;
    }

    // Логируем начало
    logger.debug({
      action: 'request.start',
      ...log,
    });

    // Логируем окончание
    res.on('finish', () => {
      const duration = Date.now() - now;
      const status = res.statusCode;

      logger.debug({
        action: 'request.end',
        requestId,
        statusCode: status,
        responseTime: duration,
      });
    });

    // Логируем ошибки
    res.on('error', (err) => {
      logger.error({
        action: 'request.error',
        requestId,
        statusCode: 500,
        error: err.message,
        stack: err.stack,
        responseTime: Date.now() - now,
      });
    });

    next();
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  private sanitize(obj: any): any {
    if (!obj) return obj;
    const clone = { ...obj };
    delete clone.password;
    delete clone.secret;
    delete clone.token;
    delete clone.accessToken;
    delete clone.refreshToken;
    return clone;
  }
}