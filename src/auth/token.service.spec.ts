import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from './entities/refresh.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';

import { DeviceInfo } from './types/device-info.interface';

// Моки
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

const mockJwtSign = jest.fn();
const mockConfigGet = jest.fn();
const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
};

const mockDeviceInfo: DeviceInfo = {
  userAgent:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ip: '192.168.1.1',
  browser: {
    name: 'Safari',
    version: '17.5',
  },
  os: {
    name: 'iOS',
    version: '17.5',
  },
  device: {
    type: 'mobile',
    model: 'iPhone 15 Pro',
    vendor: 'Apple',
  },
};

const mockUserId = 'user-123';
const mockEmail = 'test@example.com';
const mockRole = 'USER';
const mockToken = 'refresh-token-123';
const mockExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const mockTokenVersion = 5;

describe('TokenService', () => {
  let service: TokenService;
  let refreshTokenRepo: Repository<RefreshToken>;

  beforeEach(async () => {
    jest.clearAllMocks();

    (uuidv4 as jest.Mock).mockReturnValue(mockToken);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: { sign: mockJwtSign },
        },
        {
          provide: ConfigService,
          useValue: { get: mockConfigGet },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
    refreshTokenRepo = module.get<Repository<RefreshToken>>(getRepositoryToken(RefreshToken));
  });

  it('should generate JWT access token with correct payload and options', () => {
    // Подготовка
    const issuer = 'test-issuer';
    mockConfigGet.mockReturnValueOnce(issuer).mockReturnValueOnce('access-secret').mockReturnValueOnce('15m');

    mockJwtSign.mockReturnValue('signed.jwt.token');

    // Вызов
    const result = service.generateNewAccessToken(mockUserId, mockEmail, mockRole, mockTokenVersion);

    // Проверка
    expect(mockConfigGet).toHaveBeenCalledWith('JWT_ISSUER');
    expect(mockConfigGet).toHaveBeenCalledWith('JWT_ACCESS_SECRET');
    expect(mockConfigGet).toHaveBeenCalledWith('JWT_ACCESS_EXPIRES_IN');

    expect(mockJwtSign).toHaveBeenCalledWith(
      {
        userId: mockUserId,
        email: mockEmail,
        role: mockRole,
        tokenVersion: mockTokenVersion,
        iss: issuer,
      },
      {
        secret: 'access-secret',
        expiresIn: '15m',
      },
    );

    expect(result).toBe('signed.jwt.token');
  });

  it('should generate and save new refresh token', async () => {
    // Подготовка
    mockConfigGet.mockReturnValue(604800); // 7 дней
    mockRepository.create.mockReturnValue({} as RefreshToken);
    mockRepository.save.mockResolvedValue({} as RefreshToken);

    // Вызов
    const result = await service.generateNewRefreshToken(mockUserId, mockDeviceInfo);

    // Проверка
    expect(uuidv4).toHaveBeenCalled();
    expect(mockConfigGet).toHaveBeenCalledWith('REFRESH_TOKEN_EXPIRES_IN', 604800);

    expect(mockRepository.create).toHaveBeenCalledWith({
      token: mockToken,
      user: { id: mockUserId },
      expires_at: expect.any(Date),
      device_info: mockDeviceInfo,
      revoked: false,
    });

    expect(mockRepository.save).toHaveBeenCalled();
    expect(result).toEqual({ token: mockToken, expiresAt: expect.any(Date) });
  });
});
