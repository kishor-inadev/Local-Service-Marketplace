'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Edit, Trash2, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getProviderPortfolio, updatePortfolioItem, deletePortfolioItem, reorderPortfolio } from '@/services/user-service';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';

interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  image_urls: string[];
  display_order: number;
  created_at: string;
}

interface SortableItemProps {
  item: PortfolioItem;
  onEdit: (item: PortfolioItem) => void;
  onDelete?: (id: string) => void;
}

function SortablePortfolioItem({ item, onEdit, onDelete }: SortableItemProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === item.image_urls.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? item.image_urls.length - 1 : prev - 1
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      {/* Image Carousel */}
      <div className="relative h-64 bg-gray-200 group">
        <img
          src={item.image_urls[currentImageIndex]}
          alt={item.title}
          className="w-full h-full object-cover"
        />

        {/* Image Navigation */}
        {item.image_urls.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {item.image_urls.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${index === currentImageIndex
                      ? 'bg-white w-6'
                      : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                    }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Image Count Badge */}
        <div className="absolute top-4 right-4 px-3 py-1 bg-black bg-opacity-60 rounded-full text-white text-sm font-medium">
          {currentImageIndex + 1} / {item.image_urls.length}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="w-5 h-5" />
          </button>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-gray-600 text-sm line-clamp-3">{item.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-3">
              Added {new Date(item.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(item)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PortfolioGallery({ providerId }: { providerId: string }) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadPortfolio();
  }, [providerId]);

  const loadPortfolio = async () => {
    try {
      const data = await getProviderPortfolio(providerId);
      // Map backend response (images) to frontend interface (image_urls)
      const mappedData = data?.map(item => ({
        ...item,
        image_urls: item.images
      })) || [];
      setItems(mappedData as PortfolioItem[]);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update order on server
        saveOrder(newItems.map(item => item.id));

        return newItems;
      });
    }
  };

  const saveOrder = async (orderedIds: string[]) => {
    try {
      await reorderPortfolio(providerId, orderedIds);
    } catch (error) {
      console.error('Failed to save order:', error);
      toast.error('Failed to save new order');
    }
  };

  const handleEdit = (item: PortfolioItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description || '');
  };

  const saveEdit = async () => {
    if (!editingItem || !editTitle.trim()) return;

    try {
      await updatePortfolioItem(providerId, editingItem.id, {
        title: editTitle,
        description: editDescription || undefined
      });

      setEditingItem(null);
      loadPortfolio();
    } catch (error) {
      console.error('Failed to update portfolio item:', error);
      toast.error('Failed to update portfolio item');
    }
  };

  const handleDelete = (id: string) => {
    setPendingItemId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!pendingItemId) return;
    setDeleting(true);
    try {
      await deletePortfolioItem(providerId, pendingItemId);
      loadPortfolio();
    } catch (error) {
      console.error('Failed to delete portfolio item:', error);
      toast.error('Failed to delete portfolio item');
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setPendingItemId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div>
        {items.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-2">No portfolio items yet</p>
            <p className="text-sm text-gray-400">
              Showcase your best work by adding portfolio items
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Drag and drop items to reorder your portfolio.
                The order you set here is how visitors will see your work.
              </p>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <SortablePortfolioItem
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}

        {/* Edit Modal */}
        {editingItem && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingItem(null)}
          >
            <div
              className="bg-white rounded-lg max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-6">Edit Portfolio Item</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    maxLength={500}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={!editTitle.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 dark:disabled:bg-gray-600"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => { setDeleteConfirmOpen(false); setPendingItemId(null); }}
        onConfirm={handleConfirmDelete}
        title="Delete Portfolio Item"
        message="Are you sure you want to delete this portfolio item? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </>
  );
}
