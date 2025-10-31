'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Task } from '@/types/task';
import { CategorySelect } from '@/components/categories/CategorySelect';
import { minutesToSeconds, secondsToMinutes } from '@/lib/utils';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'COMPLETED';
  onSave: (taskData: Partial<Task>) => Promise<void>;
}

export function TaskModal({ isOpen, onClose, task, status, onSave }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'LOW' as 'LOW' | 'HIGH',
    expectedTime: 0, // в минутах для UI
    actualTime: 0, // в минутах для UI
    categoryId: undefined as string | undefined,
    startTime: '',
    endTime: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Закрытие по Escape
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

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        expectedTime: task.expectedTime ? secondsToMinutes(task.expectedTime) : 0,
        actualTime: task.actualTime ? secondsToMinutes(task.actualTime) : 0,
        categoryId: task.categoryId,
        startTime: task.startTime ? format(new Date(task.startTime), 'HH:mm') : '',
        endTime: task.endTime ? format(new Date(task.endTime), 'HH:mm') : '',
      });
    } else {
      // Сброс формы для новой задачи
      setFormData({
        title: '',
        description: '',
        priority: 'LOW',
        expectedTime: 0,
        actualTime: 0,
        categoryId: undefined,
        startTime: '',
        endTime: '',
      });
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const referenceDay = task?.day ? new Date(task.day) : new Date();
      const buildDateFromTime = (timeValue: string, fallback?: Date) => {
        if (!timeValue) return undefined;
        const base = fallback ? new Date(fallback) : new Date(referenceDay);
        const [hours, minutes] = timeValue.split(':').map(Number);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) return undefined;
        base.setHours(hours ?? 0, minutes ?? 0, 0, 0);
        return base;
      };

      const taskData: Partial<Task> = {
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        expectedTime: formData.expectedTime > 0 ? minutesToSeconds(formData.expectedTime) : undefined,
        actualTime: minutesToSeconds(formData.actualTime),
        categoryId: formData.categoryId,
        status: task ? task.status : status,
        startTime: buildDateFromTime(formData.startTime, task?.startTime ? new Date(task.startTime) : undefined),
        endTime: buildDateFromTime(formData.endTime, task?.endTime ? new Date(task.endTime) : undefined),
      };

      // Для новой задачи добавить поля userId и day
      if (!task) {
        taskData.userId = 'temp'; // Будет установлен хуком
        taskData.day = new Date();
      }

      await onSave(taskData);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      setErrorMessage('Не удалось сохранить задачу. Попробуйте снова.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Определяем, какие поля показывать в зависимости от статуса
  const isBacklog = (!task && status === 'BACKLOG') || (task && task.status === 'BACKLOG');
  const isInProgress = (!task && status === 'IN_PROGRESS') || (task && task.status === 'IN_PROGRESS');
  const isCompleted = (!task && status === 'COMPLETED') || (task && task.status === 'COMPLETED');
  
  // Проверяем, запущен ли таймер у задачи
  const hasActiveTimer = task && task.startTime && !task.endTime;

  // Определяем, можно ли редактировать поля
  const canEditExpectedTime = isBacklog || (isInProgress && !hasActiveTimer);
  const canEditStartTime = isInProgress && !hasActiveTimer;

  return (
    <div 
      className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="relative bg-white/95 backdrop-blur-sm rounded-3xl p-8 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors rounded-full p-2"
          disabled={isSubmitting}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          {task ? 'Редактировать задачу' : 'Новая задача'}
        </h2>
        
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 text-sm text-red-700 rounded-2xl font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Название задачи */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Название задачи*
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900"
              required
              disabled={isSubmitting || Boolean(isCompleted && task)}
              readOnly={Boolean(isCompleted && task)}
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900"
              rows={3}
              disabled={isSubmitting || Boolean(isCompleted && task)}
              readOnly={Boolean(isCompleted && task)}
            />
          </div>

          {/* Приоритет */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Приоритет
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'LOW' | 'HIGH' })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-gray-900"
              disabled={isSubmitting || Boolean(isCompleted && task)}
            >
              <option value="LOW">Низкий</option>
              <option value="HIGH">Высокий</option>
            </select>
          </div>

          {/* Категория */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Категория
            </label>
            <CategorySelect
              value={formData.categoryId}
              onChange={(categoryId) => {
                setFormData({ ...formData, categoryId });
              }}
              showColorPicker={false}
            />
          </div>

          {/* Ожидаемое время реализации */}
          {!isCompleted && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Ожидаемое время (минуты)
              </label>
              <input
                type="number"
                value={formData.expectedTime}
                onChange={(e) => setFormData({ ...formData, expectedTime: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900"
                min="0"
                disabled={isSubmitting || !canEditExpectedTime}
                readOnly={!canEditExpectedTime}
              />
              {!canEditExpectedTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Нельзя изменить после запуска таймера
                </p>
              )}
            </div>
          )}

          {/* Время начала (для IN_PROGRESS) */}
          {isInProgress && (
          <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Время начала
              </label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900"
                  disabled={isSubmitting || !canEditStartTime}
                  readOnly={!canEditStartTime}
                />
                {canEditStartTime && (
                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date();
                      const hours = now.getHours().toString().padStart(2, '0');
                      const minutes = now.getMinutes().toString().padStart(2, '0');
                      setFormData({ ...formData, startTime: `${hours}:${minutes}` });
                    }}
                    className="px-4 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors font-semibold text-sm whitespace-nowrap"
                    disabled={isSubmitting}
                  >
                    Сейчас
                  </button>
                )}
              </div>
              {!canEditStartTime && (
                <p className="text-xs text-gray-500 mt-1">
                  Время начала устанавливается автоматически при запуске таймера
                </p>
              )}
            </div>
          )}

          {/* Время окончания (для COMPLETED) */}
          {isCompleted && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Время окончания
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900"
                disabled={isSubmitting || Boolean(task)}
                readOnly={Boolean(task)}
              />
            </div>
          )}

          {/* Фактическое время реализации */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Фактическое время (минуты)
            </label>
            <input
              type="number"
              value={formData.actualTime}
              onChange={(e) => setFormData({ ...formData, actualTime: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-900"
              min="0"
              disabled={isSubmitting || (isInProgress && hasActiveTimer) || Boolean(isCompleted && task)}
              readOnly={(isInProgress && hasActiveTimer) || Boolean(isCompleted && task)}
            />
            {isInProgress && hasActiveTimer && (
              <p className="text-xs text-gray-500 mt-1">
                Обновляется автоматически таймером
              </p>
            )}
          </div>

          {/* % План/Факт (для COMPLETED) */}
          {isCompleted && formData.expectedTime > 0 && (
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl">
              <p className="text-sm text-blue-800 font-semibold">
                План/Факт: {Math.round((formData.expectedTime / (formData.actualTime || 1)) * 100)}%
              </p>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex justify-end gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors rounded-2xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-3 text-sm font-semibold text-white rounded-2xl bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Сохранение...' : task ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
