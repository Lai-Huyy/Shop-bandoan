import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import type { Category } from '@/services/categories.service';

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/products?category=${category.id}`}
          className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <div className="flex aspect-[16/9] items-center justify-center overflow-hidden bg-muted">
            {category.imageUrl ? (
              // Category image URLs may point to administrator-provided remote origins.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={category.imageUrl}
                alt={category.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            ) : (
              <FolderOpen className="h-10 w-10 text-orange-500" aria-hidden="true" />
            )}
          </div>
          <div className="p-4">
            <h2 className="font-semibold group-hover:text-orange-600">
              {category.name}
            </h2>
            <p className="mt-1 line-clamp-2 min-h-10 text-sm text-muted-foreground">
              {category.description || 'Khám phá các sản phẩm trong danh mục này.'}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
