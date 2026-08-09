'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '@/services/auth.service';
import type {
  AuthResponse,
  AuthenticatedUser,
  LoginPayload,
  RegisterPayload,
} from '@/types/auth';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isReady: boolean;
  isAuthenticated: boolean;
  login(payload: LoginPayload): Promise<AuthResponse>;
  register(payload: RegisterPayload): Promise<AuthResponse>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const applyAuthentication = useCallback((response: AuthResponse) => {
    setUser(response.user);
    return response;
  }, []);

  useEffect(() => {
    void authService
      .refresh()
      .then(applyAuthentication)
      .catch(() => undefined)
      .finally(() => setIsReady(true));
  }, [applyAuthentication]);

  const login = useCallback(
    async (payload: LoginPayload) =>
      applyAuthentication(await authService.login(payload)),
    [applyAuthentication],
  );

  const register = useCallback(
    async (payload: RegisterPayload) =>
      applyAuthentication(await authService.register(payload)),
    [applyAuthentication],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      queryClient.clear();
    }
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isReady,
      isAuthenticated: user !== null,
      login,
      register,
      logout,
    }),
    [isReady, login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider.');
  }

  return context;
}
