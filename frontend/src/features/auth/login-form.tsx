'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { FormField } from '@/components/forms/form-field';
import { PasswordFormField } from '@/components/forms/password-form-field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/hooks/use-auth';
import { ApiError } from '@/lib/api/errors';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập tên đăng nhập hoặc email.')
    .max(255),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

type LoginValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  embedded?: boolean;
  onAuthenticated?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginForm({
  embedded = false,
  onAuthenticated,
  onSwitchToRegister,
}: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function submit(values: LoginValues) {
    setSubmitError(null);
    try {
      await login(values);
      toast.success('Đăng nhập thành công.');
      if (onAuthenticated) {
        onAuthenticated();
        return;
      }
      router.replace('/profile');
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : 'Không thể đăng nhập. Vui lòng thử lại.',
      );
    }
  }

  const content = (
    <>
      <div>
        <h2
          className={cn(
            'text-2xl font-black tracking-tight',
            embedded && 'text-white',
          )}
        >
          Đăng nhập
        </h2>
        <p
          className={cn(
            'mt-2 text-sm',
            embedded ? 'text-white' : 'text-muted-foreground',
          )}
        >
          Chào mừng bạn quay lại NICEGA STORE.
        </p>
      </div>
      <form onSubmit={handleSubmit(submit)} className="mt-6 space-y-4">
        {submitError ? (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {submitError}
          </p>
        ) : null}
        <FormField
          inputId="identifier"
          label="Tên đăng nhập hoặc email"
          autoComplete="username"
          autoFocus={embedded}
          error={errors.identifier?.message}
          {...register('identifier')}
        />
        <PasswordFormField
          inputId="password"
          label="Mật khẩu"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button
          className="w-full rounded-xl bg-orange-500 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-md active:translate-y-0"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner />
              Đang đăng nhập
            </>
          ) : (
            'Đăng nhập'
          )}
        </Button>
      </form>
      <p
        className={cn(
          'mt-5 text-center text-sm',
          embedded ? 'text-white' : 'text-muted-foreground',
        )}
      >
        Chưa có tài khoản?{' '}
        {onSwitchToRegister ? (
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-bold text-orange-600 hover:text-orange-700 hover:underline"
          >
            Đăng ký
          </button>
        ) : (
          <Link
            href="/register"
            className="font-bold text-orange-600 hover:text-orange-700 hover:underline"
          >
            Đăng ký
          </Link>
        )}
      </p>
    </>
  );

  if (embedded) return content;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Đăng nhập NICEGA STORE</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
