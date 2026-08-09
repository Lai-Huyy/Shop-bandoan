'use client';

import { type FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { categoriesService } from '@/services/categories.service';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { productsService } from '@/services/products.service';
import type { Product } from '@/types/product';

type FormValues = {
  name: string;
  slug: string;
  basePrice: string;
  stockQuantity: string;
  categoryId: string;
  description: string;
  status: string;
};

const empty: FormValues = {
  name: '',
  slug: '',
  basePrice: '',
  stockQuantity: '0',
  categoryId: '',
  description: '',
  status: 'AVAILABLE',
};

function InventoryBadge({ quantity }: { quantity: number }) {
  if (quantity <= 0) {
    return <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">Hết hàng</span>;
  }
  if (quantity <= 5) {
    return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Sắp hết: {quantity}</span>;
  }
  return <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">Còn hàng: {quantity}</span>;
}

export default function AdminProductsPage() {
  const client = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(empty);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const products = useQuery({
    queryKey: ['admin-products'],
    queryFn: productsService.listAdmin,
  });
  const categories = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoriesService.listAdmin,
  });
  const refresh = () => client.invalidateQueries({ queryKey: ['admin-products'] });

  const save = useMutation({
    mutationFn: async () => {
      const productData = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        basePrice: form.basePrice,
        stockQuantity: Number(form.stockQuantity),
        categoryId: Number(form.categoryId),
        description: form.description.trim() || undefined,
        status: form.status,
      };

      if (editing) {
        return productsService.update(editing.id, productData, imageFile ?? undefined);
      }

      return productsService.create(productData, imageFile ?? undefined);
    },
    onSuccess: () => {
      setEditing(null);
      setForm(empty);
      setImageFile(null);
      refresh();
    },
  });

  const updateVisibility = useMutation({
    mutationFn: ({ id, isVisible }: { id: string; isVisible: boolean }) =>
      productsService.update(id, {
        status: isVisible ? 'AVAILABLE' : 'DRAFT',
      }),
    onSuccess: (_, variables) => {
      toast.success(
        variables.isVisible
          ? 'Sản phẩm đã được hiển thị tại cửa hàng.'
          : 'Sản phẩm đã được ẩn khỏi cửa hàng.',
      );
      refresh();
    },
    onError: () => toast.error('Không thể cập nhật trạng thái hiển thị sản phẩm.'),
  });

  const remove = useMutation({
    mutationFn: productsService.remove,
    onSuccess: () => {
      toast.success('Đã xóa vĩnh viễn sản phẩm.');
      refresh();
    },
    onError: () =>
      toast.error(
        'Không thể xóa sản phẩm. Sản phẩm có thể đã xuất hiện trong đơn hàng.',
      ),
  });

  function edit(product: Product) {
    setEditing(product);
    setImageFile(null);
    setForm({
      name: product.name,
      slug: product.slug,
      basePrice: product.basePrice,
      stockQuantity: String(product.stockQuantity),
      categoryId: String(product.category.id),
      description: product.description ?? '',
      status: product.status,
    });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>

      <form onSubmit={submit} className="grid gap-3 rounded border p-4 md:grid-cols-2">
        <h2 className="md:col-span-2 font-semibold">
          {editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
        </h2>
        <input
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Tên sản phẩm"
          className="rounded border p-2"
        />
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Số lượng tồn kho</span>
          <input
            required
            type="number"
            min="0"
            step="1"
            value={form.stockQuantity}
            onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })}
            placeholder="Ví dụ: 50"
            className="rounded border p-2"
          />
        </label>
        <input
          required
          value={form.slug}
          onChange={(event) =>
            setForm({ ...form, slug: event.target.value.toLowerCase() })
          }
          placeholder="Đường dẫn sản phẩm (ví dụ: mi-goi-hai-san)"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          className="rounded border p-2"
        />
        <input
          required
          inputMode="decimal"
          value={form.basePrice}
          onChange={(event) => setForm({ ...form, basePrice: event.target.value })}
          placeholder="Giá bán, ví dụ: 65000.00"
          className="rounded border p-2"
        />
        <label className="grid gap-1.5 md:col-span-2">
          <span className="text-sm font-medium">
            {editing ? 'Thay ảnh sản phẩm (tùy chọn)' : 'Ảnh sản phẩm'}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            className="rounded border p-2"
          />
          <span className="text-xs text-muted-foreground">
            {imageFile
              ? `Đã chọn: ${imageFile.name}`
              : editing
                ? 'Chọn ảnh mới để thay ảnh chính hiện tại; nếu để trống thì giữ nguyên ảnh.'
                : 'Chọn ảnh JPEG, PNG hoặc WebP từ máy tính; dung lượng tối đa 5 MB.'}
          </span>
        </label>
        <select
          required
          value={form.categoryId}
          onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
          className="rounded border p-2"
        >
          <option value="">Chọn danh mục</option>
          {categories.data?.items.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={form.status}
          onChange={(event) => setForm({ ...form, status: event.target.value })}
          className="rounded border p-2"
        >
          <option value="AVAILABLE">Đang bán</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="OUT_OF_STOCK">Hết hàng</option>
        </select>
        <textarea
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Mô tả sản phẩm"
          className="rounded border p-2 md:col-span-2"
        />
        <div className="flex gap-2 md:col-span-2">
          <button
            className="rounded bg-primary px-4 py-2 text-primary-foreground"
            disabled={save.isPending}
          >
            {save.isPending
              ? 'Đang lưu...'
              : editing
                ? 'Lưu thay đổi'
                : 'Thêm sản phẩm'}
          </button>
          {editing ? (
            <button
              type="button"
              className="rounded border px-4"
              onClick={() => {
                setEditing(null);
                setForm(empty);
                setImageFile(null);
              }}
            >
              Hủy
            </button>
          ) : null}
        </div>
      </form>

      <div className="space-y-3">
        {products.data?.items.map((product) => (
          <div key={product.id} className="flex items-center justify-between rounded border p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span>{product.name}</span>
              <span className="text-sm text-muted-foreground">{Number(product.basePrice).toLocaleString('vi-VN')}đ</span>
              <InventoryBadge quantity={product.stockQuantity} />
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  product.status === 'AVAILABLE'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {product.status === 'AVAILABLE' ? 'Đang hiển thị' : 'Đang ẩn'}
              </span>
              <span className="text-xs text-muted-foreground">Đã bán: {product.soldQuantity}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1"
                onClick={() => edit(product)}
              >
                Sửa
              </button>
              <ConfirmDialog
                trigger={
                  <button
                    type="button"
                    className="rounded border px-3 py-1"
                    disabled={updateVisibility.isPending}
                  >
                    {product.status === 'AVAILABLE' ? 'Ẩn' : 'Hiển thị'}
                  </button>
                }
                title={
                  product.status === 'AVAILABLE'
                    ? 'Ẩn sản phẩm'
                    : 'Hiển thị sản phẩm'
                }
                description={
                  product.status === 'AVAILABLE'
                    ? `Khách hàng sẽ không còn thấy “${product.name}” tại cửa hàng, nhưng sản phẩm vẫn được lưu trong hệ thống.`
                    : `“${product.name}” sẽ xuất hiện lại tại cửa hàng.`
                }
                icon={product.status === 'AVAILABLE' ? Archive : Eye}
                variant={product.status === 'AVAILABLE' ? 'warning' : 'success'}
                confirmLabel={product.status === 'AVAILABLE' ? 'Ẩn sản phẩm' : 'Hiển thị'}
                isLoading={updateVisibility.isPending}
                onConfirm={() =>
                  updateVisibility.mutateAsync({
                    id: product.id,
                    isVisible: product.status !== 'AVAILABLE',
                  })
                }
              />
              <ConfirmDialog
                trigger={
                  <button
                    type="button"
                    className="rounded bg-red-600 px-3 py-1 text-white"
                    disabled={remove.isPending}
                  >
                    Xóa
                  </button>
                }
                title="Xóa vĩnh viễn sản phẩm"
                description={`Bạn có chắc muốn xóa “${product.name}” không?`}
                warning="Thao tác này không thể hoàn tác. Sản phẩm có trong đơn hàng sẽ không thể bị xóa."
                icon={Trash2}
                confirmLabel="Xóa sản phẩm"
                isLoading={remove.isPending}
                onConfirm={() => remove.mutateAsync(product.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
