import { UnauthorizedException } from '@nestjs/common';
import { AuthTokenService } from './auth-token.service';

describe('AuthTokenService', () => {
  const jwtService = {
    decode: jest.fn(),
    signAsync: jest.fn(),
    verify: jest.fn(),
  };
  const configService = {
    getOrThrow: jest.fn(),
  };
  const tokenService = new AuthTokenService(
    jwtService as never,
    configService as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    configService.getOrThrow.mockImplementation((key: string) => {
      const configuration: Record<string, string> = {
        'jwt.refreshSecret': 'refresh-secret',
        'jwt.refreshExpiresIn': '7d',
      };

      return configuration[key];
    });
  });

  it('issues access and refresh tokens with the existing claims', async () => {
    jwtService.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    jwtService.decode.mockReturnValue({ exp: 2_000_000_000 });

    const tokens = await tokenService.createTokens(
      {
        id: 'user-id',
        username: 'user',
        email: 'user@example.com',
        fullName: 'User Example',
        status: 'ACTIVE',
        role: { name: 'CUSTOMER' },
      },
      'session-id',
    );

    expect(tokens.accessToken).toBe('access-token');
    expect(tokens.refreshToken).toBe('refresh-token');
    expect(tokens.accessTokenExpiresIn).toBeGreaterThan(0);
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ type: 'access' }),
    );
    expect(jwtService.signAsync).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ sid: 'session-id', type: 'refresh' }),
      expect.any(Object),
    );
  });

  it('rejects a token without refresh-token claims', () => {
    jwtService.verify.mockReturnValue({ type: 'access' });

    expect(() => tokenService.verifyRefreshToken('token')).toThrow(
      UnauthorizedException,
    );
  });
});
