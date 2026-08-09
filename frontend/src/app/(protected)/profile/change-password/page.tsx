import Link from 'next/link';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChangePasswordPage() {
  return <section className="mx-auto max-w-xl space-y-6"><div><h1 className="text-2xl font-bold">Đổi mật khẩu</h1><p className="mt-1 text-sm text-muted-foreground">Bảo vệ tài khoản của bạn bằng mật khẩu mạnh.</p></div><Card><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" />Bảo mật tài khoản</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground"><ShieldCheck className="mr-2 inline h-4 w-4" />Chức năng đổi mật khẩu sẽ yêu cầu mật khẩu hiện tại để xác nhận.</p><Button asChild variant="outline"><Link href="/profile">Quay lại tài khoản</Link></Button></CardContent></Card></section>;
}
