'use client';

import { type FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ApiError } from '@/lib/api/errors';
import {
  categoriesService,
  type Category,
} from '@/services/categories.service';

type Values = {
  name: string;
  slug: string;
  description: string;
  sortOrder: string;
  isDisplayed: boolean;
};

const empty: Values = {
  name: '',
  slug: '',
  description: '',
  sortOrder: '0',
  isDisplayed: true,
};

export default function AdminCategoriesPage() {
  const client = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(empty);
  const [message, setMessage] = useState<string | null>(null);
  const categories = useQuery({
    queryKey: ['admin-categories'],
    queryFn: categoriesService.listAdmin,
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: ['admin-categories'] });
  const save = useMutation({
    mutationFn: () => {
      const data = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || undefined,
        sortOrder: Number(form.sortOrder),
        isDisplayed: form.isDisplayed,
      };
      return editing
        ? categoriesService.update(editing.id, data)
        : categoriesService.create(data);
    },
    onSuccess: () => {
      setMessage(editing ? 'Đã cập nhật danh mục.' : 'Đã thêm danh mục.');
      setEditing(null);
      setForm(empty);
      void refresh();
    },
    onError: (error) =>
      setMessage(
        error instanceof ApiError ? error.message : 'Không thể lưu danh mục.',
      ),
  });
  const remove = useMutation({
    mutationFn: categoriesService.remove,
    onSuccess: () => {
      setMessage('Đã ẩn danh mục.');
      void refresh();
    },
    onError: (error) =>
      setMessage(
        error instanceof ApiError ? error.message : 'Không thể ẩn danh mục.',
      ),
  });

  const edit = (category: Category) => {
    setMessage(null);
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      sortOrder: String(category.sortOrder),
      isDisplayed: category.isDisplayed,
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);
    save.mutate();
  };

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý danh mục</h1>
      {message ? <p className="rounded border p-3 text-sm">{message}</p> : null}

      <form
        onSubmit={submit}
        className="grid gap-3 rounded border p-4 md:grid-cols-2"
      >
        <h2 className="font-semibold md:col-span-2">
          {editing ? 'Sửa danh mục' : 'Thêm danh mục'}
        </h2>
        <input
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Tên danh mục"
          className="rounded border p-2"
        />
        <input
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          value={form.slug}
          onChange={(event) =>
            setForm({ ...form, slug: event.target.value.toLowerCase() })
          }
          placeholder="Đường dẫn danh mục (ví dụ: do-uong)"
          className="rounded border p-2"
        />
        <input
          type="number"
          min="0"
          value={form.sortOrder}
          onChange={(event) =>
            setForm({ ...form, sortOrder: event.target.value })
          }
          placeholder="Thứ tự hiển thị"
          aria-label="Thứ tự hiển thị"
          className="rounded border p-2"
        />
        <label className="flex items-center gap-2 rounded border p-2">
          <input
            type="checkbox"
            checked={form.isDisplayed}
            onChange={(event) =>
              setForm({ ...form, isDisplayed: event.target.checked })
            }
          />
          Hiển thị công khai
        </label>
        <textarea
          value={form.description}
          onChange={(event) =>
            setForm({ ...form, description: event.target.value })
          }
          placeholder="Mô tả danh mục"
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
                : 'Thêm danh mục'}
          </button>
          {editing ? (
            <button
              type="button"
              className="rounded border px-4"
              onClick={() => {
                setEditing(null);
                setForm(empty);
              }}
            >
              Hủy
            </button>
          ) : null}
        </div>
      </form>

      <div className="space-y-3">
        {categories.data?.items.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between rounded border p-3"
          >
            <span>
              {category.name} —{' '}
              {category.isDisplayed ? 'Đang hiển thị' : 'Đã ẩn'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded border px-3 py-1"
                onClick={() => edit(category)}
              >
                Sửa
              </button>
              <ConfirmDialog
                trigger={
                  <button
                    type="button"
                    className="rounded bg-red-600 px-3 py-1 text-white"
                    disabled={remove.isPending}
                  >
                    Ẩn
                  </button>
                }
                title="Ẩn danh mục"
                description={`Khách hàng sẽ không còn thấy danh mục “${category.name}”, nhưng dữ liệu sẽ vẫn được lưu.`}
                icon={Archive}
                variant="warning"
                confirmLabel="Ẩn danh mục"
                isLoading={remove.isPending}
                onConfirm={() => remove.mutateAsync(category.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
