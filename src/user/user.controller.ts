import { Controller, Get, Post, Body, Param, Res, Req, OnApplicationBootstrap } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { getDeviceInfo } from '../auth/utils/device-info.util';
import { EventPublisher } from '../common/services/event-publisher-service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly client: EventPublisher,
  ) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.userService.findById(id);
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto, @Res({ passthrough: true }) res, @Req() req) {
    const deviceInfo = getDeviceInfo(req);

    const registerResult = await this.userService.create(createUserDto, deviceInfo);

    res.cookie('Refresh', registerResult.tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 14 * 24 * 60 * 60 * 1000,
      path: '/',
    });
    const { user } = registerResult;
    this.client.publishForNestJS('microservices_events', 'user.registered.successfully', { user });

    return registerResult;
  }
}
