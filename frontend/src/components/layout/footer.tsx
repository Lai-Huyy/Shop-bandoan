import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Instagram, Mail, MapPin, Phone } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-slate-950 px-4 py-14 text-slate-300">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Image
            src="/brand/nicega-store-logo.png"
            alt="NICEGA STORE"
            width={112}
            height={112}
            className="rounded-2xl border border-white/15"
          />
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">Mua sắm tiện lợi, giao tận tay và nhiều ưu đãi mỗi ngày.</p>
          <div className="mt-5 flex gap-3"><a href="#" aria-label="Facebook" className="rounded-full border border-white/15 p-2 hover:text-orange-400"><Facebook className="h-4 w-4" /></a><a href="#" aria-label="Instagram" className="rounded-full border border-white/15 p-2 hover:text-orange-400"><Instagram className="h-4 w-4" /></a></div>
        </div>
        <div><h3 className="font-semibold text-white">Khám phá</h3><div className="mt-4 space-y-2 text-sm"><Link href="/products" className="block hover:text-orange-400">Sản phẩm</Link><Link href="/categories" className="block hover:text-orange-400">Danh mục</Link></div></div>
        <div><h3 className="font-semibold text-white">Hỗ trợ khách hàng</h3><div className="mt-4 space-y-2 text-sm"><Link href="/orders" className="block hover:text-orange-400">Theo dõi đơn hàng</Link><Link href="/profile" className="block hover:text-orange-400">Tài khoản của tôi</Link><a href="mailto:support@example.com" className="block hover:text-orange-400">Câu hỏi thường gặp</a></div></div>
        <div><h3 className="font-semibold text-white">Liên hệ</h3><div className="mt-4 space-y-3 text-sm"><p className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-orange-400" />Việt Nam</p><p className="flex gap-2"><Phone className="h-4 w-4 shrink-0 text-orange-400" />1900 0000</p><p className="flex gap-2"><Mail className="h-4 w-4 shrink-0 text-orange-400" />support@example.com</p></div></div>
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-white/10 pt-6 text-sm text-slate-500">© {new Date().getFullYear()} NICEGA STORE. Bảo lưu mọi quyền.</div>
    </footer>
  );
}
