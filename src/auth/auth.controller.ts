import { Controller, Get, Post, Body, BadRequestException, UseGuards, Req, ForbiddenException, Put, Res, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { getDeviceInfo } from './utils/device-info.util';
import { TokenService } from './token.service';
import { User } from './decorators/user.decorator';
import { CurrentUser } from './types/req-user.interface';
import { LoginRateLimitGuard } from './guards/login-rate-limit.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @UseGuards(LoginRateLimitGuard)
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req, @Res() res) {
    const { email, password } = dto;
    const deviceInfo = getDeviceInfo(req);
    const tokens = await this.authService.login(email, password, deviceInfo);

    res.cookie('Refresh', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 14 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    
    return res.json(tokens);
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

  @UseGuards(JwtAuthGuard)
  @Get('active-sessions')
  async getActiveSessions(@User() user: CurrentUser) {
    return this.tokenService.getActiveRefreshTokens(user.user_id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('sessions/crash')
  async crashAllTokensWithoutCurrent(@Req() req, @User('user_id') userId){
    const refreshToken = req.cookies?.Refresh;
    if (!refreshToken) {
      throw new BadRequestException();
    }

    return await this.authService.crashAllTokensWithoutCurrent(refreshToken, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('refresh')
  async refresh(){
    return "Обновление access_token прошло успешно";
  }
}
