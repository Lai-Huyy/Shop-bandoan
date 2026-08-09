import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, Gift, ShieldCheck, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from './reveal';

const highlights = [
  { icon: BadgeCheck, label: 'Sản phẩm đa dạng' },
  { icon: Truck, label: 'Đặt hàng thuận tiện' },
  { icon: ShieldCheck, label: 'Thanh toán COD' },
];

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-[#071426] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(249,115,22,0.24),transparent_28%),radial-gradient(circle_at_88%_65%,rgba(59,130,246,0.18),transparent_24%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_.95fr] lg:items-center lg:gap-16 lg:px-8 lg:py-24">
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full border border-orange-300/25 bg-orange-400/10 px-4 py-2 text-xs font-bold tracking-[0.14em] text-orange-200 backdrop-blur sm:text-sm">
              <Gift className="h-4 w-4" /> TIỆN LỢI HƠN MỖI NGÀY
            </p>
          </Reveal>
          <Reveal delay={90}>
            <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Mọi thứ bạn cần,
              <span className="block text-orange-400">ngay gần bạn.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              NICEGA STORE mang đến trải nghiệm mua sắm nhanh chóng, minh bạch
              và đáng tin cậy — từ những lựa chọn hằng ngày đến ưu đãi phù hợp
              cho bạn.
            </p>
          </Reveal>
          <Reveal delay={230} className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-orange-500 px-6 shadow-lg shadow-orange-950/40 transition hover:-translate-y-0.5 hover:bg-orange-400"
            >
              <Link href="/products">
                Khám phá sản phẩm <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/20 bg-white/5 px-6 text-white transition hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
            >
              <Link href="/categories">Xem danh mục</Link>
            </Button>
          </Reveal>
          <Reveal
            delay={300}
            className="mt-10 grid max-w-xl gap-3 sm:grid-cols-3"
          >
            {highlights.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-sm font-medium text-slate-200"
              >
                <Icon className="h-5 w-5 shrink-0 text-orange-400" />
                {label}
              </div>
            ))}
          </Reveal>
        </div>

        <Reveal
          delay={160}
          className="relative mx-auto w-full max-w-xl lg:max-w-none"
        >
          <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-slate-900/35 p-2 shadow-2xl shadow-black/40">
            {/* Remote images are not configured for next/image in this project. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=1200&q=85"
              alt="Không gian cửa hàng tiện lợi hiện đại"
              fetchPriority="high"
              className="h-[360px] w-full rounded-[1.5rem] object-cover sm:h-[480px]"
            />
            <div className="pointer-events-none absolute inset-x-2 bottom-2 h-2/5 rounded-b-[1.5rem] bg-gradient-to-t from-[#071426]/90 to-transparent" />
            <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-orange-200">
                  MUA SẮM TRỰC TUYẾN
                </p>
                <p className="mt-1 text-2xl font-black">Nhanh & tiện</p>
              </div>
              <Image
                src="/brand/nicega-store-logo.png"
                alt=""
                width={54}
                height={54}
                className="rounded-xl border border-white/30 shadow-lg"
              />
            </div>
          </div>
          <div className="home-float absolute -left-2 top-10 rounded-2xl border border-white/30 bg-white/95 p-3 text-slate-950 shadow-xl backdrop-blur sm:-left-7 sm:p-4">
            <p className="flex items-center gap-2 text-sm font-black">
              <Gift className="h-4 w-4 text-orange-500" />
              Ưu đãi hôm nay
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Xem mã giảm giá đang có
            </p>
          </div>
          <div className="home-float home-float-delay absolute -bottom-4 right-3 rounded-2xl border border-orange-300/30 bg-orange-500 p-3 text-white shadow-xl sm:right-8 sm:p-4">
            <p className="flex items-center gap-2 text-sm font-black">
              <Truck className="h-4 w-4" />
              Đặt hàng tiện lợi
            </p>
            <p className="mt-1 text-xs text-orange-100">
              Theo dõi đơn hàng dễ dàng
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
