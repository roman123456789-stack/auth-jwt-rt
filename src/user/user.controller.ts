import { Controller, Get, Post, Body, Param, Res, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { getDeviceInfo } from '../auth/utils/device-info.util';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.userService.findById(id);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto, @Res({passthrough: true}) res, @Req() req) {
    const deviceInfo = getDeviceInfo(req);

    const registerResult = await this.userService.create(createUserDto, deviceInfo);

    res.cookie('Refresh', registerResult.tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 14 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    return registerResult;
  }
}
