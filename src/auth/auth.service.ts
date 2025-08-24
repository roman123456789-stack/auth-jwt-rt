import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { TokensDto } from './dto/tokens.dto';
import { TokenService } from './token.service';
import { DeviceInfo } from './types/device-info.interface';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private tokenService: TokenService,
  ) {}

  async login(email: string, password: string, deviceInfo: DeviceInfo): Promise<TokensDto> {
    const user = await this.userService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const refresh_token = await this.tokenService.generateNewRefreshToken(user.id, deviceInfo);
    const access_token = await this.tokenService.generateNewAccessToken(user.id, user.email, user.role, 1);

    const tokens = { access_token, refresh_token: refresh_token.token };

    return plainToInstance(TokensDto, tokens);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenEntry = await this.tokenService.findValidRefreshToken(refreshToken);
    if (tokenEntry) {
      await this.tokenService.revokeRefreshToken(tokenEntry.token);
    }
  }

  async crashAllTokensWithoutCurrent(refreshToken: string, userId: string){
    return await this.tokenService.crashAllTokensWithoutCurrent(refreshToken, userId);
  }
}
