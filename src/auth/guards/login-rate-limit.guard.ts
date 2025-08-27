import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  private readonly MAX_ATTEMPTS = 10;
  private readonly WINDOW_MINUTES = 15; // 15 минут

  constructor(private redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    if (req.url === '/auth/login' && req.method === 'POST') {
      const email = req?.body?.email;
      if (!email) {
        throw new BadRequestException('Email is required');
      }
      const key = `login-attempt:${email}`;

      // Атомарное увеличение на 1
      const count = await this.redisService.incr(key);

      // Устанавливаем TTL только при первом запросе
      if (count === 1) {
        await this.redisService.getKeyExpire(key, this.WINDOW_MINUTES * 60);
      }

      if (count > this.MAX_ATTEMPTS) {
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
}

