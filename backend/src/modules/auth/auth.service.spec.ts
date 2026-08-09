import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { AuthTokenService } from './auth-token.service';

const activeUser = {
  id: 'b36f0c19-ecba-463a-9609-960999bb7d7a',
  username: 'customer',
  email: 'customer@example.com',
  passwordHash: '',
  fullName: 'Customer Example',
  status: 'ACTIVE',
  role: { name: 'CUSTOMER' },
};

describe('AuthService', () => {
  const authRepository = {
    findUserByUsername: jest.fn(),
    findUserByEmail: jest.fn(),
    findUserByIdentifier: jest.fn(),
    createCustomer: jest.fn(),
    createSession: jest.fn(),
    findSessionWithUser: jest.fn(),
    rotateSession: jest.fn(),
    revokeSession: jest.fn(),
  };
  const authTokenService = {
    createTokens: jest.fn(),
    verifyRefreshToken: jest.fn(),
  };
  const configService = { getOrThrow: jest.fn() };
  const authService = new AuthService(
    authRepository as unknown as AuthRepository,
    authTokenService as unknown as AuthTokenService,
    configService as never,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    configService.getOrThrow.mockReturnValue(10);
    authTokenService.createTokens.mockResolvedValue({
      accessToken: 'access-token',
      accessTokenExpiresIn: 900,
      refreshToken: 'refresh-token',
      refreshTokenExpiresAt: new Date('2033-05-18T03:33:20.000Z'),
    });
    authRepository.createSession.mockResolvedValue(undefined);
  });

  it('registers a customer with a hashed password and a persisted session', async () => {
    authRepository.findUserByUsername.mockResolvedValue(null);
    authRepository.findUserByEmail.mockResolvedValue(null);
    authRepository.createCustomer.mockResolvedValue(activeUser);

    const result = await authService.register(
      {
        username: activeUser.username,
        email: activeUser.email,
        password: 'SecurePassword123!',
        fullName: activeUser.fullName,
      },
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
    );

    expect(authRepository.createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        username: activeUser.username,
        email: activeUser.email,
      }),
    );
    expect(authRepository.createSession).toHaveBeenCalledTimes(1);
    expect(result.accessToken).toBe('access-token');
    expect(result.user.username).toBe(activeUser.username);
  });

  it('rejects registration when the username already exists', async () => {
    authRepository.findUserByUsername.mockResolvedValue({ id: 'existing-id' });
    authRepository.findUserByEmail.mockResolvedValue(null);

    await expect(
      authService.register(
        {
          username: activeUser.username,
          email: activeUser.email,
          password: 'SecurePassword123!',
          fullName: activeUser.fullName,
        },
        {},
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('rejects registration when the email already exists', async () => {
    authRepository.findUserByUsername.mockResolvedValue(null);
    authRepository.findUserByEmail.mockResolvedValue({ id: 'existing-id' });

    await expect(
      authService.register(
        {
          username: activeUser.username,
          email: activeUser.email,
          password: 'SecurePassword123!',
          fullName: activeUser.fullName,
        },
        {},
      ),
    ).rejects.toThrow(ConflictException);
  });

  it.each([activeUser.username, activeUser.email])(
    'authenticates with %s',
    async (identifier) => {
      activeUser.passwordHash = await bcrypt.hash('SecurePassword123!', 10);
      authRepository.findUserByIdentifier.mockResolvedValue(activeUser);

      const result = await authService.login(
        { identifier, password: 'SecurePassword123!' },
        {},
      );

      expect(authRepository.findUserByIdentifier).toHaveBeenCalledWith(
        identifier,
      );
      expect(result.user.email).toBe(activeUser.email);
    },
  );

  it('rejects invalid passwords and unknown users', async () => {
    authRepository.findUserByIdentifier.mockResolvedValue(null);
    await expect(
      authService.login({ identifier: 'missing', password: 'invalid' }, {}),
    ).rejects.toThrow(UnauthorizedException);

    activeUser.passwordHash = await bcrypt.hash('CorrectPassword123!', 10);
    authRepository.findUserByIdentifier.mockResolvedValue(activeUser);
    await expect(
      authService.login(
        { identifier: activeUser.username, password: 'invalid' },
        {},
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects a suspended account after successful password verification', async () => {
    const suspendedUser = {
      ...activeUser,
      passwordHash: await bcrypt.hash('SecurePassword123!', 10),
      status: 'SUSPENDED',
    };
    authRepository.findUserByIdentifier.mockResolvedValue(suspendedUser);

    await expect(
      authService.login(
        { identifier: activeUser.username, password: 'SecurePassword123!' },
        {},
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('rotates a valid refresh token atomically', async () => {
    const refreshTokenHash = await bcrypt.hash('current-refresh-token', 10);
    authRepository.findSessionWithUser.mockResolvedValue({
      id: 'session-id',
      userId: activeUser.id,
      refreshTokenHash,
      isRevoked: false,
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      user: activeUser,
    });
    authRepository.rotateSession.mockResolvedValue(1);
    authTokenService.verifyRefreshToken.mockReturnValue({
      sub: activeUser.id,
      sid: 'session-id',
      type: 'refresh',
    });

    const result = await authService.refresh('current-refresh-token', {
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    });

    expect(authRepository.rotateSession).toHaveBeenCalledWith(
      'session-id',
      refreshTokenHash,
      expect.any(String),
      expect.any(Date),
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
    );
    expect(result.accessToken).toBe('access-token');
  });

  it('revokes the matching session during logout', async () => {
    authTokenService.verifyRefreshToken.mockReturnValue({
      sub: activeUser.id,
      sid: 'session-id',
      type: 'refresh',
    });
    authRepository.revokeSession.mockResolvedValue(undefined);

    await authService.logout('current-refresh-token');

    expect(authRepository.revokeSession).toHaveBeenCalledWith(
      'session-id',
      activeUser.id,
    );
  });
});
