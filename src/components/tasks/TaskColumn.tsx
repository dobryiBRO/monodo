'use client';

import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { Task } from '@/types/task';

interface TaskColumnProps {
  title: string;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'COMPLETED';
  description: string;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onTaskSave: (taskData: Partial<Task>) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
  isDeveloperMode?: boolean;
  sortBy?: string;
  onSortChange?: (sortBy: string) => void;
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
  onTaskClick,
  onTaskSave,
  onTaskDelete,
  isDeveloperMode = false,
  sortBy = 'default',
  onSortChange,
}: TaskColumnProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

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

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
      try {
        await onTaskDelete(taskId);
      } catch (error: any) {
        alert(error.message || 'Ошибка при удалении задачи');
      }
    }
  };

  return (
    <div 
      ref={setNodeRef}
      className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full min-h-[500px]"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
            {tasks.length}
          </span>
        </div>
        <p className="text-sm text-gray-600">{description}</p>

        {/* Сортировка */}
        {onSortChange && (
          <div className="mt-3">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full text-sm px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {getSortOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
                onDelete={
                  status === 'BACKLOG' || isDeveloperMode
                    ? () => handleDeleteTask(task.id)
                    : undefined
                }
                isDeveloperMode={isDeveloperMode}
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
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
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
    </div>
  );
}
