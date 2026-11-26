'use client';

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { PasswordFormField } from '@/components/forms/password-form-field';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/lib/api/errors';
import { authService } from '@/services/auth.service';

const password = z
  .string()
  .min(6, 'Mật khẩu cần ít nhất 6 ký tự.')
  .max(255, 'Mật khẩu tối đa 255 ký tự.');
const schema = z
  .object({
    currentPassword: password,
    newPassword: password,
    confirmation: z.string(),
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ['newPassword'],
    message: 'Hãy chọn mật khẩu khác mật khẩu hiện tại.',
  })
  .refine((v) => v.confirmation === v.newPassword, {
    path: ['confirmation'],
    message: 'Mật khẩu xác nhận chưa khớp.',
  });

export default function ChangePasswordPage() {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const submit = handleSubmit(async ({ currentPassword, newPassword }) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      reset();
      toast.success(
        'Đã đổi mật khẩu. Hãy dùng mật khẩu mới trong lần đăng nhập sau.',
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.message === 'Current password is incorrect'
      ) {
        setError(
          'currentPassword',
          { message: 'Mật khẩu hiện tại chưa đúng.' },
          { shouldFocus: true },
        );
      } else {
        setError('root', {
          message:
            error instanceof ApiError && error.statusCode === 401
              ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
              : 'Chưa đổi được mật khẩu. Vui lòng thử lại.',
        });
      }
    }
  });

  return (
    <section className="mx-auto max-w-md space-y-5">
      <h1 className="text-2xl font-bold">Đổi mật khẩu</h1>
      <form
        className="space-y-4 rounded-xl border bg-card p-5"
        onSubmit={submit}
      >
        <PasswordFormField
          inputId="current-password"
          label="Mật khẩu hiện tại"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <PasswordFormField
          inputId="new-password"
          label="Mật khẩu mới"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <PasswordFormField
          inputId="confirm-password"
          label="Nhập lại mật khẩu mới"
          autoComplete="new-password"
          error={errors.confirmation?.message}
          {...register('confirmation')}
        />
        {errors.root && (
          <p role="alert" className="text-sm text-destructive">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu…' : 'Lưu mật khẩu mới'}
        </Button>
      </form>
      <Link href="/profile" className="inline-block underline">
        Quay lại tài khoản
      </Link>
    </section>
  );
}
