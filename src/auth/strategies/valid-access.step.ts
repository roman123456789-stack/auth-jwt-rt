import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ITokenStep } from '../types/token-step.interface';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '../token.service';
import { Request } from 'express';

@Injectable()
export class ValidAccessStep implements ITokenStep {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private tokenService: TokenService,
  ) {}

  async execute(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    const refreshToken = request.cookies?.Refresh;

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        ignoreExpiration: true,
      });
    
      logger.debug('The token is correct, it just expired', 'ValidAccessStrategy.validate');
      const currentTokenVersion = await this.tokenService.getTokenVersion(refreshToken);
      logger.debug(`Current access token version: ${currentTokenVersion}, the version of the received token: ${payload.tokenVersion}`)
      if (payload.tokenVersion < currentTokenVersion || !payload.tokenVersion) {
        throw new Error("The token version is invalid");
      }
      return true;
    } catch (error) {
      logger.error(`The token is invalid: ${error.message}`, error.stack, 'ValidAccessStrategy');
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private extractToken(request: Request): string {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer') {
      throw new UnauthorizedException('Invalid token type');
    }
    return token;
  }
}
