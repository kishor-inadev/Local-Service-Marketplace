'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import { Permission } from '@/utils/permissions';
import { adminService } from '@/services/admin-service';
import { requestService } from '@/services/request-service';
import { Plus, Pencil, Trash2, ToggleRight, ToggleLeft, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  icon: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function CategoryFormModal({
  category,
  onClose,
  onSaved,
}: {
  category?: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!category;
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: category?.name ?? '', description: category?.description ?? '', icon: category?.icon ?? '' },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit ? adminService.updateCategory(category.id, data) : adminService.createCategory(data),
    onSuccess: () => {
      toast.success(isEdit ? 'Category updated' : 'Category created');
      onSaved();
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to save category'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Category' : 'New Category'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              {...register('name')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Home Cleaning"
            />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
              placeholder="Brief description of this service category"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Icon (emoji)</label>
            <input
              {...register('icon')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-primary-500"
              placeholder="ðŸ”§"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" variant="primary" isLoading={mutation.isPending} className="flex-1">
              {isEdit ? 'Save Changes' : 'Create Category'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [modalCategory, setModalCategory] = useState<any | null | 'new'>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: categories, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => requestService.getCategories(),
  });

  const toggleMutation = useMutation({
    mutationFn: (cat: any) => adminService.updateCategory(cat.id, { active: !cat.active }),
    onSuccess: () => { toast.success('Category updated'); refetch(); },
    onError: () => toast.error('Failed to update category'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCategory(id),
    onSuccess: () => { toast.success('Category deleted'); setDeletingId(null); refetch(); },
    onError: () => toast.error('Failed to delete category'),
  });

  return (
    <ProtectedRoute requiredPermissions={[Permission.CATEGORIES_MANAGE]}>
      <Layout>
        <div className="container-custom py-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                Category Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">Create, edit, and manage service categories</p>
            </div>
            <Button variant="primary" onClick={() => setModalCategory('new')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> New Category
            </Button>
          </div>

          {error ? (
            <ErrorState title="Failed to load categories" message="Please try again." retry={() => refetch()} />
          ) : isLoading ? (
            <Loading />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(categories ?? []).map((cat: any) => (
                <Card key={cat.id} className={!cat.active ? 'opacity-60' : ''}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {cat.icon && <span className="text-2xl">{cat.icon}</span>}
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{cat.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.active
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                            }`}>
                            {cat.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {cat.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{cat.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setModalCategory(cat)}
                        className="flex items-center gap-1">
                        <Pencil className="h-3 w-3" /> Edit
                      </Button>
                      <button
                        onClick={() => toggleMutation.mutate(cat)}
                        title={cat.active ? 'Deactivate' : 'Activate'}
                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                        {cat.active ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5" />}
                      </button>
                      {deletingId === cat.id ? (
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={() => deleteMutation.mutate(cat.id)}
                            className="p-1.5 rounded bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40">
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(cat.id)}
                          className="ml-auto p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Layout>

      {modalCategory !== null && (
        <CategoryFormModal
          category={modalCategory === 'new' ? undefined : modalCategory}
          onClose={() => setModalCategory(null)}
          onSaved={refetch}
        />
      )}
    </ProtectedRoute>
  );
}
