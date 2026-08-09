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

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Tên đăng nhập cần ít nhất 3 ký tự.')
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/, 'Chỉ dùng chữ cái, số hoặc dấu gạch dưới.'),
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên.').max(100),
  email: z.string().trim().email('Vui lòng nhập email hợp lệ.').max(255),
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(6, 'Mật khẩu cần ít nhất 6 ký tự.').max(255),
});

type RegisterValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  embedded?: boolean;
  onAuthenticated?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({
  embedded = false,
  onAuthenticated,
  onSwitchToLogin,
}: RegisterFormProps) {
  const router = useRouter();
  const { register: registerAccount } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  async function submit(values: RegisterValues) {
    setSubmitError(null);
    try {
      await registerAccount({ ...values, phone: values.phone || undefined });
      toast.success('Đăng ký tài khoản thành công.');
      if (onAuthenticated) {
        onAuthenticated();
        return;
      }
      router.replace('/profile');
    } catch (error) {
      setSubmitError(
        error instanceof ApiError
          ? error.message
          : 'Không thể tạo tài khoản. Vui lòng thử lại.',
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
          Tạo tài khoản
        </h2>
        <p
          className={cn(
            'mt-2 text-sm',
            embedded ? 'text-white' : 'text-muted-foreground',
          )}
        >
          Đăng ký để quản lý đơn hàng và ưu đãi của bạn.
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
          inputId="username"
          label="Tên đăng nhập"
          autoComplete="username"
          autoFocus={embedded}
          error={errors.username?.message}
          {...register('username')}
        />
        <FormField
          inputId="fullName"
          label="Họ và tên"
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <FormField
          inputId="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <FormField
          inputId="phone"
          label="Số điện thoại (không bắt buộc)"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <PasswordFormField
          inputId="password"
          label="Mật khẩu"
          autoComplete="new-password"
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
              Đang tạo tài khoản
            </>
          ) : (
            'Đăng ký'
          )}
        </Button>
      </form>
      <p
        className={cn(
          'mt-5 text-center text-sm',
          embedded ? 'text-white' : 'text-muted-foreground',
        )}
      >
        Đã có tài khoản?{' '}
        {onSwitchToLogin ? (
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-bold text-orange-600 hover:text-orange-700 hover:underline"
          >
            Đăng nhập
          </button>
        ) : (
          <Link
            href="/login"
            className="font-bold text-orange-600 hover:text-orange-700 hover:underline"
          >
            Đăng nhập
          </Link>
        )}
      </p>
    </>
  );

  if (embedded) return content;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Tạo tài khoản NICEGA STORE</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
