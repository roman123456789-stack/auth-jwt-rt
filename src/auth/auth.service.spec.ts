import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { TokenService } from './token.service';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('uuid', () => ({ v4: () => 'mock-jti-123' }));

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let tokenService: TokenService;

  const mockUser = {
    id: '1',
    email: 'test@test.com',
    role: 'user',
  };

  const mockTokens = {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateNewRefreshToken: jest.fn(),
            generateNewAccessToken: jest.fn(),
            findValidRefreshToken: jest.fn(),
            revokeRefreshToken: jest.fn(),
            crashAllTokensWithoutCurrent: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    tokenService = module.get<TokenService>(TokenService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('login', () => {
    it('should return tokens when credentials are valid', async () => {
      (userService.validateUser as jest.Mock).mockResolvedValue(mockUser);
      (tokenService.generateNewRefreshToken as jest.Mock).mockResolvedValue({
        token: mockTokens.refresh_token,
      });
      (tokenService.generateNewAccessToken as jest.Mock).mockResolvedValue(
        mockTokens.access_token,
      );

      const result = await authService.login(
        'test@test.com',
        'password123',
        { ip: '192.168.0.1', userAgent: 'Chrome' } as any,
      );

      expect(userService.validateUser).toHaveBeenCalledWith(
        'test@test.com',
        'password123',
      );
      expect(tokenService.generateNewRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        { ip: '192.168.0.1', userAgent: 'Chrome' },
      );
      expect(tokenService.generateNewAccessToken).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        mockUser.role,
        1,
      );
      expect(result).toEqual(mockTokens);
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      (userService.validateUser as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login(
          'wrong@test.com',
          'wrong-pass',
          {} as any,
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(userService.validateUser).toHaveBeenCalledWith(
        'wrong@test.com',
        'wrong-pass',
      );
      expect(tokenService.generateNewRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should revoke refresh token if it exists', async () => {
      const refreshToken = 'refresh-123';
      (tokenService.findValidRefreshToken as jest.Mock).mockResolvedValue({
        token: refreshToken,
      });

      await authService.logout(refreshToken);

      expect(tokenService.findValidRefreshToken).toHaveBeenCalledWith(
        refreshToken,
      );
      expect(tokenService.revokeRefreshToken).toHaveBeenCalledWith(refreshToken);
    });

    it('should do nothing if refresh token does not exist', async () => {
      (tokenService.findValidRefreshToken as jest.Mock).mockResolvedValue(null);

      await authService.logout('invalid-token');

      expect(tokenService.revokeRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('crashAllTokensWithoutCurrent', () => {
    it('should call tokenService to revoke other tokens', async () => {
      const refreshToken = 'refresh-123';
      const userId = '1';

      await authService.crashAllTokensWithoutCurrent(refreshToken, userId);

      expect(tokenService.crashAllTokensWithoutCurrent).toHaveBeenCalledWith(
        refreshToken,
        userId,
      );
    });
  });
});