import { ITokenStep } from '../types/token-step.interface';
import { TokenService } from '../token.service';
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class RefreshAccessStep implements ITokenStep {
  constructor(private tokenService: TokenService) {}

  async execute(context: ExecutionContext): Promise<boolean> {
    try {
      logger.debug('Starting to update the access_token', 'RefreshAccessStrategy.validate');
      const request = context.switchToHttp().getRequest();
      const response = context.switchToHttp().getResponse();
      const refreshToken = request.cookies?.Refresh;

      if (!refreshToken) {
        throw new UnauthorizedException('Refresh token not found in cookies');
      }

      const tokenEntry = await this.tokenService.findValidRefreshToken(refreshToken);
      if (!tokenEntry) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const accessTokenVersion = await this.tokenService.getAndIncrementTokenVersion(refreshToken);
      
      const newAccessToken = await this.tokenService.generateNewAccessToken(
        tokenEntry.user.id,
        tokenEntry.user.email,
        tokenEntry.user.role,
        accessTokenVersion
      );

      response.setHeader('X-New-Access-Token', newAccessToken);

      request.user = {
        userId: tokenEntry.user.id,
        email: tokenEntry.user.email,
        role: tokenEntry.user.role,
      };
      logger.debug('Successfully updated the access token', 'JwtAuthGuard');
      return true;
    } catch (error) {
      logger.error(`Error updating the token: ${error.message}`, error.stack, 'RefreshAccessStrategy.validate');
      throw error;
    }
  }
}
