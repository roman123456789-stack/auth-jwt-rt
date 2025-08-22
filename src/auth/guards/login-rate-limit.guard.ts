import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private readonly MAX_ATTEMPTS = 5;
  private readonly WINDOW_MINUTES = 15; // 15 минут

  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    if (req.url === '/auth/login' && req.method === 'POST') {
        const ip = this.getIp(req);
        const key = `login-attempt:${ip}`;

        // 1. Получаем текущее значение
        let currentStr = await this.redisService.get(key);
        let current = currentStr ? parseInt(currentStr, 10) : 0;

        // 2. Увеличиваем
        current += 1;

        // 3. Если это первый запрос — устанавливаем TTL
        if (current === 1) {
        await this.redisService.set(key, '1', this.WINDOW_MINUTES * 60);
        } else {
        // 4. Обновляем значение
        await this.redisService.set(key, current.toString(), this.WINDOW_MINUTES * 60);
        }

        // 5. Проверяем лимит
        if (current > this.MAX_ATTEMPTS) {
        throw new HttpException(
            {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: `Too many attempts. Please try again in ${this.WINDOW_MINUTES} minutes.`,
            error: 'Too Many Requests',
            timestamp: new Date().toISOString(),
            requestId: req['requestId'] || null,
            },
            HttpStatus.TOO_MANY_REQUESTS,
        );
        }
    }

    return true;
    }

  private getIp(req: any): string {
    return (
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }
}

