'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { Task } from '@/types/task';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { BaseSelect } from '@/components/ui/BaseSelect';

interface TaskColumnProps {
  title: string;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'COMPLETED';
  description: string;
  tasks: Task[];
  onTaskSave: (taskData: Partial<Task>) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
  isDeveloperMode?: boolean;
  sortBy?: string;
  onSortChange?: (sortBy: string) => void;
  taskActions?: {
    updateTask: (id: string, updates: Partial<Task>) => Promise<Task> | Promise<any>;
    updateTaskStatus: (id: string, status: Task['status']) => Promise<Task> | Promise<any>;
    getActiveTimerTask: () => Task | null;
    stopActiveTimer: () => Promise<void>;
    refresh: () => Promise<void> | void;
  };
}

type SortOption = {
  value: string;
  label: string;
};

export function TaskColumn({
  title,
  status,
  description,
  tasks,
  onTaskSave,
  onTaskDelete,
  isDeveloperMode = false,
  sortBy = 'default',
  onSortChange,
  taskActions,
}: TaskColumnProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { setNodeRef } = useDroppable({
    id: status,
  });

  // Опции сортировки в зависимости от статуса
  const getSortOptions = (): SortOption[] => {
    const commonOptions: SortOption[] = [
      { value: 'default', label: 'По умолчанию' },
      { value: 'priority', label: 'По приоритету' },
      { value: 'category', label: 'По категории' },
    ];

    if (status === 'BACKLOG') {
      return [...commonOptions, { value: 'custom', label: 'Вручную' }];
    }

    if (status === 'IN_PROGRESS') {
      return [
        ...commonOptions,
        { value: 'startTime', label: 'По времени начала' },
        { value: 'expectedTime-asc', label: 'Время (возр.)' },
        { value: 'expectedTime-desc', label: 'Время (убыв.)' },
        { value: 'custom', label: 'Вручную' },
      ];
    }

    if (status === 'COMPLETED') {
      return [
        ...commonOptions,
        { value: 'endTime', label: 'По времени окончания' },
        { value: 'actualTime-asc', label: 'Факт время (возр.)' },
        { value: 'actualTime-desc', label: 'Факт время (убыв.)' },
        { value: 'custom', label: 'Вручную' },
      ];
    }

    return commonOptions;
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    await onTaskSave({ ...taskData, status });
    setShowModal(false);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (editingTask) {
      await onTaskSave({ ...taskData, id: editingTask.id });
      setEditingTask(null);
      setShowModal(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!pendingDeleteId) return;

    try {
      await onTaskDelete(pendingDeleteId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка при удалении задачи';
      setErrorMessage(message);
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleCopyTask = async (task: Task) => {
    try {
      // Создаем копию задачи с новыми данными
      const taskCopy: Partial<Task> = {
        title: `${task.title} (копия)`,
        description: task.description,
        priority: task.priority,
        expectedTime: task.expectedTime,
        categoryId: task.categoryId,
        status: 'BACKLOG', // Копия всегда создается в BACKLOG
        actualTime: 0,
        userId: task.userId,
        day: new Date(),
        // Сбрасываем временные метки
        startTime: undefined,
        endTime: undefined,
        completedAt: undefined,
      };

      await onTaskSave(taskCopy);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ошибка при копировании задачи';
      setErrorMessage(message);
    }
  };

  return (
    <div 
      ref={setNodeRef}
      className="bg-white rounded-3xl shadow-lg border border-gray-200 flex flex-col h-full min-h-[500px]"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
            {tasks.length}
          </span>
        </div>
        <p className="text-sm text-gray-700 font-medium">{description}</p>

        {/* Сортировка */}
        {onSortChange && (
          <div className="mt-4">
            <BaseSelect
              value={sortBy}
              onChange={(v) => onSortChange(v)}
              options={getSortOptions().map((o) => ({ value: o.value, label: o.label }))}
            />
          </div>
        )}
      </div>
      
      {/* Tasks List with SortableContext */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        <SortableContext
          items={tasks.map((task) => task.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <svg
                className="w-12 h-12 mx-auto mb-2 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-sm">Нет задач</p>
              <p className="text-xs mt-1">Перетащите задачу сюда</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => handleEditTask(task)}
                onCopy={() => handleCopyTask(task)}
                onDelete={
                  status === 'BACKLOG' || isDeveloperMode
                    ? () => setPendingDeleteId(task.id)
                    : undefined
                }
                isDeveloperMode={isDeveloperMode}
                taskActions={taskActions}
              />
            ))
          )}
        </SortableContext>
        
        {/* Add Task Button */}
        <button
          onClick={() => {
            setEditingTask(null);
            setShowModal(true);
          }}
          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm font-semibold"
        >
          + Добавить задачу
        </button>
      </div>

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingTask(null);
          }}
          task={editingTask}
          status={status}
          onSave={editingTask ? handleUpdateTask : handleCreateTask}
        />
      )}

      <ConfirmModal
        isOpen={pendingDeleteId !== null}
        title="Удалить задачу?"
        description="Задача будет удалена без возможности восстановления."
        confirmText="Удалить"
        cancelText="Отмена"
        variant="danger"
        onConfirm={handleDeleteTask}
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
    </div>
  );
}
