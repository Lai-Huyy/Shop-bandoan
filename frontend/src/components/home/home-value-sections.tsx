import Link from 'next/link';
import {
  ArrowRight,
  CircleCheck,
  HandCoins,
  Headphones,
  PackageCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from './reveal';

const trustFeatures = [
  [
    'Sản phẩm rõ ràng',
    'Thông tin sản phẩm và giá được hiển thị minh bạch.',
    PackageCheck,
  ],
  [
    'Đặt hàng thuận tiện',
    'Chọn sản phẩm, địa chỉ và hoàn tất đơn hàng trong vài bước.',
    ShoppingBag,
  ],
  [
    'Thanh toán COD',
    'Thanh toán khi nhận hàng theo phương thức đang hỗ trợ.',
    HandCoins,
  ],
  [
    'Theo dõi đơn hàng',
    'Xem trạng thái đơn hàng của bạn trong tài khoản.',
    Truck,
  ],
];

const shoppingSteps = [
  ['01', 'Chọn sản phẩm', 'Duyệt danh mục hoặc tìm kiếm món bạn cần.'],
  ['02', 'Thêm vào giỏ', 'Chọn số lượng và tùy chọn phù hợp.'],
  ['03', 'Chọn địa chỉ', 'Dùng địa chỉ giao hàng đã lưu của bạn.'],
  ['04', 'Nhận hàng', 'Theo dõi đơn hàng sau khi hoàn tất thanh toán.'],
];

export function HomeValueSections() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <Reveal>
          <div className="max-w-2xl">
            <p className="text-sm font-bold tracking-[0.16em] text-orange-600">
              VÌ SAO LÀ NICEGA STORE
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
              Mua sắm đơn giản, rõ ràng và tiện lợi
            </h2>
          </div>
        </Reveal>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustFeatures.map(([title, description, Icon], index) => {
            const FeatureIcon = Icon as typeof PackageCheck;
            return (
              <Reveal key={title as string} delay={index * 55}>
                <article className="h-full rounded-2xl border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <FeatureIcon className="h-8 w-8 text-orange-500" />
                  <h3 className="mt-5 font-bold">{title as string}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {description as string}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>
      <section className="border-y bg-slate-50/80 py-16 dark:bg-slate-950/45 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold tracking-[0.16em] text-orange-600">
                  QUY TRÌNH MUA SẮM
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                  Mua sắm dễ dàng
                </h2>
              </div>
              <CircleCheck className="h-10 w-10 text-orange-500" />
            </div>
          </Reveal>
          <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {shoppingSteps.map(([number, title, description], index) => (
              <Reveal key={number} delay={index * 60}>
                <li className="rounded-2xl border bg-card p-6">
                  <span className="text-3xl font-black text-orange-500/80">
                    {number}
                  </span>
                  <h3 className="mt-6 font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <Reveal>
          <div className="overflow-hidden rounded-[2rem] bg-[#071426] px-7 py-12 text-white shadow-2xl shadow-slate-950/15 sm:px-12">
            <div className="max-w-2xl">
              <p className="text-sm font-bold tracking-[0.16em] text-orange-300">
                SẴN SÀNG MUA SẮM?
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                Khám phá sản phẩm tiện lợi ngay hôm nay.
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                Duyệt cửa hàng, thêm sản phẩm vào giỏ hoặc mua ngay với quy
                trình thanh toán hiện có.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-8 rounded-full bg-orange-500 hover:bg-orange-400"
              >
                <Link href="/products">
                  Khám phá sản phẩm <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <Headphones className="float-right -mt-24 hidden h-48 w-48 text-orange-400/20 md:block" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
