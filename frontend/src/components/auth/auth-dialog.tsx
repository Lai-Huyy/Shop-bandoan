'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoginForm } from '@/features/auth/login-form';
import { RegisterForm } from '@/features/auth/register-form';

export type AuthDialogMode = 'login' | 'register';

interface AuthDialogProps {
  open: boolean;
  mode: AuthDialogMode;
  onOpenChange(open: boolean): void;
  onModeChange(mode: AuthDialogMode): void;
  onAuthenticated(): void;
}

export function AuthDialog({
  open,
  mode,
  onOpenChange,
  onModeChange,
  onAuthenticated,
}: AuthDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="auth-dialog-content max-h-[min(44rem,calc(100vh-2rem))] max-w-md overflow-y-auto rounded-3xl border-slate-800 bg-slate-950 p-6 text-white shadow-2xl sm:p-8"
        overlayClassName="auth-dialog-overlay"
      >
        <div className="flex items-center gap-3 pr-8">
          <Image
            src="/brand/nicega-store-logo.png"
            alt="NICEGA STORE"
            width={48}
            height={48}
            className="rounded-xl border border-orange-500/25"
          />
          <div>
            <p className="font-black tracking-tight text-white">
              NICEGA <span className="text-orange-500">STORE</span>
            </p>
            <p className="text-xs text-white">Tiện lợi hơn mỗi ngày</p>
          </div>
        </div>
        <DialogTitle className="sr-only">
          {mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Biểu mẫu {mode === 'login' ? 'đăng nhập' : 'đăng ký'} tài khoản NICEGA
          STORE.
        </DialogDescription>
        <div key={mode} className="auth-dialog-form mt-7">
          {mode === 'login' ? (
            <LoginForm
              embedded
              onAuthenticated={onAuthenticated}
              onSwitchToRegister={() => onModeChange('register')}
            />
          ) : (
            <RegisterForm
              embedded
              onAuthenticated={onAuthenticated}
              onSwitchToLogin={() => onModeChange('login')}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
