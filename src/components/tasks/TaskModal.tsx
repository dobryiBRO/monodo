'use client';

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { CategorySelect } from '@/components/categories/CategorySelect';
import { formatTime, minutesToSeconds, secondsToMinutes } from '@/lib/utils';

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
  const [selectedCategoryColor, setSelectedCategoryColor] = useState<string>('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        expectedTime: task.expectedTime ? secondsToMinutes(task.expectedTime) : 0,
        actualTime: task.actualTime ? secondsToMinutes(task.actualTime) : 0,
        categoryId: task.categoryId,
        startTime: task.startTime ? new Date(task.startTime).toISOString().slice(0, 16) : '',
        endTime: task.endTime ? new Date(task.endTime).toISOString().slice(0, 16) : '',
      });
      if (task.category) {
        setSelectedCategoryColor(task.category.color);
      }
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

    try {
      const taskData: Partial<Task> = {
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        expectedTime: formData.expectedTime > 0 ? minutesToSeconds(formData.expectedTime) : undefined,
        actualTime: minutesToSeconds(formData.actualTime),
        categoryId: formData.categoryId,
        status: task ? task.status : status,
        startTime: formData.startTime ? new Date(formData.startTime) : undefined,
        endTime: formData.endTime ? new Date(formData.endTime) : undefined,
      };

      // Для новой задачи добавить поля userId и day
      if (!task) {
        (taskData as any).userId = 'temp'; // Будет установлен хуком
        taskData.day = new Date();
      }

      await onSave(taskData);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Ошибка при сохранении задачи');
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
  const canEditAll = isBacklog || (task && task.status === 'BACKLOG');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          {task ? 'Редактировать задачу' : 'Новая задача'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Название задачи */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название задачи *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isSubmitting || Boolean(isCompleted && task)}
              readOnly={Boolean(isCompleted && task)}
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              disabled={isSubmitting || Boolean(isCompleted && task)}
              readOnly={Boolean(isCompleted && task)}
            />
          </div>

          {/* Приоритет */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Приоритет
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'LOW' | 'HIGH' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting || Boolean(isCompleted && task)}
            >
              <option value="LOW">Низкий</option>
              <option value="HIGH">Высокий</option>
            </select>
          </div>

          {/* Категория */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Категория
            </label>
            <CategorySelect
              value={formData.categoryId}
              onChange={(categoryId, category) => {
                setFormData({ ...formData, categoryId });
                if (category) {
                  setSelectedCategoryColor(category.color);
                }
              }}
              showColorPicker={false}
            />
          </div>

          {/* Ожидаемое время реализации */}
          {!isCompleted && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ожидаемое время (минуты)
              </label>
              <input
                type="number"
                value={formData.expectedTime}
                onChange={(e) => setFormData({ ...formData, expectedTime: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Время начала
              </label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting || !canEditStartTime}
                readOnly={!canEditStartTime}
              />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Время окончания
              </label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting || Boolean(task)}
                readOnly={Boolean(task)}
              />
            </div>
          )}

          {/* Фактическое время реализации */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Фактическое время (минуты)
            </label>
            <input
              type="number"
              value={formData.actualTime}
              onChange={(e) => setFormData({ ...formData, actualTime: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-medium">План/Факт: </span>
                {Math.round((formData.expectedTime / (formData.actualTime || 1)) * 100)}%
              </p>
            </div>
          )}

          {/* Кнопки */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isSubmitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
