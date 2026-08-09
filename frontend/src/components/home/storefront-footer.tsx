import Image from 'next/image';
import Link from 'next/link';

const links = [
  { href: '/products', label: 'Sản phẩm' },
  { href: '/categories', label: 'Danh mục' },
  { href: '/coupons', label: 'Ưu đãi' },
  { href: '/orders', label: 'Đơn hàng' },
];

export function StorefrontFooter() {
  return (
    <footer className="bg-[#071426] px-4 py-12 text-slate-300 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-3"
            aria-label="NICEGA STORE - Trang chủ"
          >
            <Image
              src="/brand/nicega-store-logo.png"
              alt="NICEGA STORE"
              width={58}
              height={58}
              className="rounded-2xl border border-white/15"
            />
            <span className="text-lg font-black text-white">
              NICEGA <span className="text-orange-400">STORE</span>
            </span>
          </Link>
          <p className="mt-4 text-sm leading-6 text-slate-400">
            Tiện lợi hơn mỗi ngày — khám phá sản phẩm và ưu đãi đang có tại cửa
            hàng.
          </p>
        </div>
        <nav
          aria-label="Liên kết cuối trang"
          className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm sm:grid-cols-4"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium transition-colors hover:text-orange-400"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-xs text-slate-500">
        © NICEGA STORE.
      </div>
    </footer>
  );
}
