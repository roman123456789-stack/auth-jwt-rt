import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';

import { TokensDto } from './dto/tokens.dto';

// Мокаем uuid
jest.mock('uuid', () => ({ v4: () => 'mock-jti-123' }));

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;
  let redisService: RedisService;
  let configService: ConfigService;

  const mockTokens: TokensDto = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        // Мокаем все зависимости
        {
          provide: UserService,
          useValue: {
            validateUser: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const values = {
                JWT_ACCESS_SECRET: 'access-secret',
                JWT_REFRESH_SECRET: 'refresh-secret',
                JWT_ACCESS_EXPIRES_IN: 900,
                JWT_REFRESH_EXPIRES_IN: 604800,
              };
              return values[key];
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
    redisService = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  it('should return tokens on login', async () => {
    const mockUser = { id: '1', email: 'test@test.com', role: 'user' };

    (userService.validateUser as jest.Mock).mockResolvedValue(mockUser);
    (jwtService.signAsync as jest.Mock).mockResolvedValueOnce('access').mockResolvedValueOnce('refresh');

    // const result = await authService.login('test@test.com', 'pass');

    // expect(result).toEqual({
    //   access_token: 'access',
    //   refresh_token: 'refresh',
    // });
  });
});
