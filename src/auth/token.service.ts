import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh.entity';
import { MoreThan, Repository } from 'typeorm';
import { DeviceInfo } from './types/device-info.interface';

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  public generateNewAccessToken(userId: string, email: string, role: string, tokenVersion: number) {
    const issuer = this.configService.get<string>('JWT_ISSUER');
    return this.jwtService.sign(
      { userId, email, role, tokenVersion, iss: issuer },
      {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN'),
      },
    );
  }

  public async generateNewRefreshToken(userId: string, deviceInfo?: DeviceInfo) {
    const token = uuidv4();
    const ttlSeconds = this.configService.get<number>('REFRESH_TOKEN_EXPIRES_IN', 604800);
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    const refreshToken = this.refreshTokenRepository.create({
      token: token,
      user: { id: userId },
      expires_at: expiresAt,
      device_info: deviceInfo,
      revoked: false,
    });

    await this.refreshTokenRepository.save(refreshToken);
    return { token, expiresAt };
  }

  public async revokeRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update({ token }, { revoked: true });
  }

  public async findValidRefreshToken(token: string): Promise<RefreshToken | null> {
    const tokenEntry = await this.refreshTokenRepository.findOne({
      where: {
        token,
        revoked: false,
        expires_at: MoreThan(new Date()),
      },
      relations: ['user'],
    });

    if (!tokenEntry) return null;
    return tokenEntry;
  }

  public async getActiveRefreshTokens(userId: string) {
    const tokens = await this.refreshTokenRepository.find({
      where: {
        user: { id: userId },
        revoked: false,
        expires_at: MoreThan(new Date()),
      },
      select: ['id', 'token', 'created_at', 'expires_at', 'revoked', 'device_info'],
      order: { created_at: 'DESC' },
    });

    return tokens;
  }

  async getAndIncrementTokenVersion(refreshToken: string) {
    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (!tokenEntity) {
      throw new Error('Refresh token not found');
    }

    tokenEntity.access_token_version += 1;
    await this.refreshTokenRepository.save(tokenEntity);

    return tokenEntity.access_token_version;
  }

  async getTokenVersion(refreshToken: string) {
    const tokenEntity = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken },
    });

    if (!tokenEntity) {
      throw new Error('Refresh token not found');
    }
    
    return tokenEntity.access_token_version;
  }

  async crashAllTokensWithoutCurrent(refreshToken: string, userId: string) {
    
    const activeTokens = await this.getActiveRefreshTokens(userId);
    
    const tokensToRevoke = activeTokens.filter(
      token => token.token !== refreshToken
    );
    
    for (const token of tokensToRevoke) {
      await this.revokeRefreshToken(token.token);
    }
    
    return {
      message: 'All other sessions have been terminated',
      revokedCount: tokensToRevoke.length,
    };
  }
}
