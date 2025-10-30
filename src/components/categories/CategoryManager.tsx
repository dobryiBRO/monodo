'use client';

import { useEffect, useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { Category } from '@/types/task';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const { categories, updateCategory, deleteCategory } = useCategories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ name: string; color: string }>({
    name: '',
    color: '',
  });
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const startEditing = (category: Category) => {
    setEditingId(category.id);
    setEditData({ name: category.name, color: category.color });
  };

  const handleSave = async (id: string) => {
    try {
      await updateCategory(id, editData);
      setEditingId(null);
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDelete = (id: string) => {
    setPendingDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    try {
      await deleteCategory(pendingDeleteId);
    } catch (error) {
      console.error('Error deleting category:', error);
      setErrorMessage('Не удалось удалить категорию. Попробуйте снова.');
    } finally {
      setPendingDeleteId(null);
    }
  };

  return (
    <>
    <div 
      className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors rounded-full p-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Управление категориями
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Изменяйте названия и цвета ваших категорий для лучшей визуализации.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="font-medium">Категории ещё не созданы</p>
            <p className="text-sm mt-2">Создайте их при добавлении задач</p>
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-2xl hover:border-blue-300 transition-colors bg-white/80"
              >
                {editingId === category.id ? (
                  <>
                    <input
                      type="color"
                      value={editData.color}
                      onChange={(e) =>
                        setEditData({ ...editData, color: e.target.value })
                      }
                      className="w-12 h-12 border border-gray-300 rounded-2xl cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) =>
                        setEditData({ ...editData, name: e.target.value })
                      }
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      autoFocus
                    />
                    <button
                      onClick={() => handleSave(category.id)}
                      className="p-2.5 text-green-600 hover:bg-green-50 rounded-2xl transition-colors"
                      title="Сохранить"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
                      title="Отмена"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      className="w-12 h-12 rounded-2xl"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="flex-1 text-gray-900 font-semibold">
                      {category.name}
                    </span>
                    <button
                      onClick={() => startEditing(category)}
                      className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-2xl transition-colors"
                      title="Редактировать"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2.5 text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                      title="Удалить"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    <ConfirmModal
      isOpen={pendingDeleteId !== null}
      title="Удалить категорию?"
      description="Категория будет удалена, но задачи сохранятся без категории."
      confirmText="Удалить"
      cancelText="Отмена"
      variant="danger"
      onConfirm={confirmDelete}
      onClose={() => setPendingDeleteId(null)}
    />

    <ConfirmModal
      isOpen={Boolean(errorMessage)}
      title="Ошибка"
      description={errorMessage}
      confirmText="Понятно"
      showCancel={false}
      onConfirm={() => setErrorMessage(null)}
      onClose={() => setErrorMessage(null)}
    />
    </>
  );
}

