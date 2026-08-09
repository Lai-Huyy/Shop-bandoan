export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AuthUserWithRole {
  id: string;
  username: string;
  email: string;
  fullName: string;
  status: string;
  role: {
    name: string;
  };
}

export interface AuthUserWithPassword extends AuthUserWithRole {
  passwordHash: string;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  type: 'refresh';
}

export interface RefreshTokenClaims extends RefreshTokenPayload {
  exp?: number;
}

export interface SessionMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export interface AuthTokens {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface AuthenticationResult extends AuthTokens {
  user: AuthenticatedUser;
}
