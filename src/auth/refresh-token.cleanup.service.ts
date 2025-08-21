// session-cleanup.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh.entity';
import { LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class RefreshTokenCleanupService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async deactivateExpiredSessions() {
    const now = new Date();

    // Найти все активные сессии, у которых срок истёк
    const expiredTokens = await this.refreshTokenRepository.find({
        where: {
            revoked: false,
            expires_at: LessThan(now),
        },
    });

    if (expiredTokens.length === 0) {
      logger.log('No expired sessions found.');
      return;
    }

    // Сделать их неактивными
    expiredTokens.forEach((expiredTokens) => {
      expiredTokens.revoked = true;
    });

    await this.refreshTokenRepository.save(expiredTokens);
    logger.log(`Deactivated ${expiredTokens.length} expired sessions.`);
  }

  @Cron('0 */5 * * * *')
  async handleCron(){
    await this.deactivateExpiredSessions();
  }
}