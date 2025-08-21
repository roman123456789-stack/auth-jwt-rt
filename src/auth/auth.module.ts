import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from 'src/redis/redis.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh.entity';
import { TokenService } from './token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshAccessStep } from './strategies/refresh-access.step';
import { ValidAccessStep } from './strategies/valid-access.step';
import { ScheduleModule } from '@nestjs/schedule';
import { RefreshTokenCleanupService } from './refresh-token.cleanup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN') },
      }),
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RedisService,
    TokenService,
    JwtStrategy,
    ValidAccessStep,
    RefreshAccessStep,
    RefreshTokenCleanupService,
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
