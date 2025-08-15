import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { getDeviceInfo } from './utils/device-info.util';
import { TokenService } from './token.service';
import { User } from './decorators/user.decorator';
import { CurrentUser } from './types/req-user.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req) {
    const { email, password } = dto;
    const deviceInfo = getDeviceInfo(req);
    return await this.authService.login(email, password, deviceInfo);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() request) {
    const refreshToken = request.cookies?.Refresh;
    if (!refreshToken) {
      throw new ForbiddenException();
    }
    await this.authService.logout(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('protected')
  async checkProtect() {
    return { message: 'succesfull' };
  }

  @Get('active-sessions')
  @UseGuards(JwtAuthGuard)
  async getActiveSessions(@User() user: CurrentUser) {
    return this.tokenService.getActiveRefreshTokens(user.userId);
  }
}
