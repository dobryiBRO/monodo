'use client';

import { useEffect, useState } from 'react';
import { Category } from '@/types/task';
import { getLocalCategories, saveLocalCategory, updateLocalCategory, deleteLocalCategory } from '@/lib/localStorage';
import { useSession } from 'next-auth/react';

export function useCategories() {
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (status === 'authenticated') {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        
        const data = await response.json();
        setCategories(data);
      } else {
        const localCategories = getLocalCategories();
        setCategories(localCategories);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'loading') {
      fetchCategories();
    }
  }, [status]);

  const createCategory = async (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (status === 'authenticated') {
        const response = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(categoryData),
        });

        if (!response.ok) {
          throw new Error('Failed to create category');
        }

        const newCategory = await response.json();
        setCategories([...categories, newCategory]);
        return newCategory;
      } else {
        const newCategory = saveLocalCategory(categoryData);
        setCategories([...categories, newCategory]);
        return newCategory;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      if (status === 'authenticated') {
        const response = await fetch(`/api/categories/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error('Failed to update category');
        }

        const updatedCategory = await response.json();
        setCategories(categories.map((cat) => (cat.id === id ? updatedCategory : cat)));
        return updatedCategory;
      } else {
        const updatedCategory = updateLocalCategory(id, updates);
        if (updatedCategory) {
          setCategories(categories.map((cat) => (cat.id === id ? updatedCategory : cat)));
          return updatedCategory;
        }
        throw new Error('Category not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      if (status === 'authenticated') {
        const response = await fetch(`/api/categories/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete category');
        }

        setCategories(categories.filter((cat) => cat.id !== id));
      } else {
        const success = deleteLocalCategory(id);
        if (success) {
          setCategories(categories.filter((cat) => cat.id !== id));
        } else {
          throw new Error('Category not found');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  return {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refresh: fetchCategories,
  };
}

