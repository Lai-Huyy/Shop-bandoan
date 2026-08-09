'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AuthDialog, type AuthDialogMode } from '@/components/auth/auth-dialog';

type AuthenticationContinuation = (() => void) | undefined;

interface AuthDialogContextValue {
  openAuthDialog(
    mode?: AuthDialogMode,
    onAuthenticated?: AuthenticationContinuation,
  ): void;
}

const AuthDialogContext = createContext<AuthDialogContextValue | undefined>(
  undefined,
);

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthDialogMode>('login');
  const continuationRef = useRef<AuthenticationContinuation>(undefined);

  const openAuthDialog = useCallback(
    (
      nextMode: AuthDialogMode = 'login',
      onAuthenticated?: AuthenticationContinuation,
    ) => {
      continuationRef.current = onAuthenticated;
      setMode(nextMode);
      setIsOpen(true);
    },
    [],
  );

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) continuationRef.current = undefined;
  }, []);

  const handleAuthenticated = useCallback(() => {
    const continuation = continuationRef.current;
    continuationRef.current = undefined;
    setIsOpen(false);
    continuation?.();
  }, []);

  const value = useMemo<AuthDialogContextValue>(
    () => ({ openAuthDialog }),
    [openAuthDialog],
  );

  return (
    <AuthDialogContext.Provider value={value}>
      {children}
      <AuthDialog
        open={isOpen}
        mode={mode}
        onOpenChange={handleOpenChange}
        onModeChange={setMode}
        onAuthenticated={handleAuthenticated}
      />
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog(): AuthDialogContextValue {
  const context = useContext(AuthDialogContext);
  if (!context) {
    throw new Error('useAuthDialog must be used within AuthDialogProvider.');
  }

  return context;
}
