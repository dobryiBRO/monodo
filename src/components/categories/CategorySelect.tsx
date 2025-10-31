'use client';

import { useState, useRef, useEffect } from 'react';
import { Category } from '@/types/task';
import { useCategories } from '@/hooks/useCategories';
import { generateRandomColor } from '@/lib/utils';

interface CategorySelectProps {
  value?: string;
  onChange: (categoryId: string | undefined, category?: Category) => void;
  onColorChange?: (color: string) => void;
  showColorPicker?: boolean;
}

export function CategorySelect({
  value,
  onChange,
  onColorChange,
  showColorPicker = false,
}: CategorySelectProps) {
  const { categories, createCategory } = useCategories();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(generateRandomColor());
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategory = categories.find((cat) => cat.id === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCreatingNew(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await createCategory({
        name: newCategoryName.trim(),
        color: newCategoryColor,
        userId: 'temp', // Will be set by the hook
      });

      onChange(newCategory.id, newCategory);
      setNewCategoryName('');
      setNewCategoryColor(generateRandomColor());
      setIsCreatingNew(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between px-4 py-3 border-2 border-gray-300 rounded-2xl hover:bg-blue-50 transition-colors"
        >
          <span className="flex items-center gap-2">
            {selectedCategory ? (
              <>
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: selectedCategory.color }}
                />
                <span className="text-sm font-semibold">{selectedCategory.name}</span>
              </>
            ) : (
              <span className="text-sm text-gray-500">Выберите категорию</span>
            )}
          </span>
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showColorPicker && selectedCategory && (
          <input
            type="color"
            value={selectedCategory.color}
            onChange={(e) => onColorChange?.(e.target.value)}
            className="w-12 h-12 border-2 border-gray-300 rounded-2xl cursor-pointer"
            title="Изменить цвет"
          />
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-white/95 backdrop-blur-sm border-2 border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto">
          {categories.length > 0 && (
            <div className="p-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    onChange(category.id, category);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-blue-50 rounded-2xl transition-colors"
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-semibold">{category.name}</span>
                </button>
              ))}
            </div>
          )}

          {!isCreatingNew ? (
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="w-full px-4 py-3 text-left text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors border-t"
            >
              + Создать новую категорию
            </button>
          ) : (
            <div className="p-4 border-t space-y-3 bg-white/80">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Название категории"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
              />
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="w-12 h-12 border-2 border-gray-300 rounded-2xl cursor-pointer"
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-2xl hover:bg-blue-700 transition-colors"
                >
                  Создать
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setNewCategoryName('');
                    setNewCategoryColor(generateRandomColor());
                  }}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          {categories.length === 0 && !isCreatingNew && (
            <div className="p-4 text-center text-sm text-gray-500">
              Нет категорий. Создайте первую!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

