import { AuthController } from './auth.controller';
import { AuthCookieService } from './auth-cookie.service';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  const authService = {
    login: jest.fn(),
  };
  const authCookieService = {
    setRefreshToken: jest.fn(),
  };
  const controller = new AuthController(
    authService as unknown as AuthService,
    authCookieService as unknown as AuthCookieService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns only access-token data and writes the refresh token to a cookie', async () => {
    authService.login.mockResolvedValue({
      accessToken: 'access-token',
      accessTokenExpiresIn: 900,
      refreshToken: 'refresh-token',
      refreshTokenExpiresAt: new Date('2030-01-01T00:00:00.000Z'),
      user: {
        id: 'user-id',
        username: 'customer',
        email: 'customer@example.com',
        fullName: 'Customer Example',
        role: 'CUSTOMER',
      },
    });
    const response = {};

    const result = await controller.login(
      { identifier: 'customer', password: 'SecurePassword123!' },
      '127.0.0.1',
      'jest',
      response as never,
    );

    expect(authCookieService.setRefreshToken).toHaveBeenCalledWith(
      response,
      expect.objectContaining({ refreshToken: 'refresh-token' }),
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      expiresIn: 900,
      tokenType: 'Bearer',
      user: {
        id: 'user-id',
        username: 'customer',
        email: 'customer@example.com',
        fullName: 'Customer Example',
        role: 'CUSTOMER',
      },
    });
    expect(result).not.toHaveProperty('refreshToken');
  });
});
