export type UserRole = 'ADMIN' | 'CUSTOMER' | (string & {});

export interface AuthenticatedUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthResponse {
  user: AuthenticatedUser;
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}
