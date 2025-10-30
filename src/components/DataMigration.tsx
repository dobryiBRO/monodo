'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { exportLocalData, clearLocalTasks, clearLocalCategories, getTaskCounter } from '@/lib/localStorage';

export function DataMigration() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  useEffect(() => {
    // Проверяем, есть ли несохраненные данные и пользователь не авторизован
    if (status === 'unauthenticated') {
      const taskCount = getTaskCounter();
      
      // Показать баннер после создания первой задачи
      if (taskCount === 1) {
        setShowBanner(true);
      }
      
      // Показать модальное окно при создании 4-й задачи
      if (taskCount >= 4) {
        setShowModal(true);
      }
    }

    // Если пользователь только что авторизовался, мигрируем данные
    if (status === 'authenticated' && !isMigrating) {
      const localData = exportLocalData();
      if (localData.tasks.length > 0 || localData.categories.length > 0) {
        migrateData(localData);
      }
    }
  }, [status, isMigrating]);

  const migrateData = async (localData: ReturnType<typeof exportLocalData>) => {
    setIsMigrating(true);
    
    try {
      // Сначала мигрируем категории
      const categoryMap = new Map<string, string>(); // старый ID -> новый ID

      for (const category of localData.categories) {
        try {
          const response = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: category.name,
              color: category.color,
            }),
          });

          if (response.ok) {
            const newCategory = await response.json();
            categoryMap.set(category.id, newCategory.id);
          }
        } catch (error) {
          console.error('Error migrating category:', error);
        }
      }

      // Затем мигрируем задачи
      for (const task of localData.tasks) {
        try {
          const taskData = {
            ...task,
            categoryId: task.categoryId ? categoryMap.get(task.categoryId) : undefined,
          };

          await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData),
          });
        } catch (error) {
          console.error('Error migrating task:', error);
        }
      }

      // Очистить localStorage после успешной миграции
      clearLocalTasks();
      clearLocalCategories();
      
      // Обновить страницу
      router.refresh();
    } catch (error) {
      console.error('Error during migration:', error);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (status === 'unauthenticated') {
      const taskCount = getTaskCounter();
      if (taskCount > 0) {
        e.preventDefault();
        e.returnValue = '';
        // После того как пользователь закроет alert браузера, показываем наше модальное окно
        setTimeout(() => setShowModal(true), 100);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status]);

  return (
    <>
      {/* Ненавязчивый баннер */}
      {showBanner && (
        <div className="fixed bottom-4 right-4 max-w-sm bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 z-40 animate-slide-up">
          <button
            onClick={() => setShowBanner(false)}
            className="absolute top-2 right-2 text-blue-400 hover:text-blue-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                Сохраните свои данные
              </h4>
              <p className="text-xs text-blue-700 mb-3">
                Зарегистрируйтесь, чтобы ваши задачи были доступны на всех устройствах
              </p>
              <button
                onClick={() => router.push('/login')}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
              >
                Зарегистрироваться
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Зарегистрируйтесь для продолжения
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Вы создали {getTaskCounter()} задач. Зарегистрируйтесь, чтобы не потерять свои данные и продолжить работу.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Зарегистрироваться
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors text-sm"
                >
                  Позже
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Индикатор миграции */}
      {isMigrating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Синхронизация данных...</p>
            <p className="text-sm text-gray-500 mt-2">Пожалуйста, подождите</p>
          </div>
        </div>
      )}
    </>
  );
}
