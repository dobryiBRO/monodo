'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { TaskColumn } from './TaskColumn';
import { TaskCard } from './TaskCard';
import { useTasks } from '@/hooks/useTasks';
import { useDeveloperMode } from '@/contexts/DeveloperModeContext';
import { Task } from '@/types/task';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { arrayMove } from '@dnd-kit/sortable';

export function TaskBoard() {
  const { tasks, isLoading, error, createTask, updateTask, deleteTask, updateTaskStatus } = useTasks();
  const { isDeveloperMode } = useDeveloperMode();
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [sortOptions, setSortOptions] = useState({
    BACKLOG: 'default',
    IN_PROGRESS: 'default',
    COMPLETED: 'default',
  });
  const [customOrder, setCustomOrder] = useState<Record<Task['status'], string[]>>({
    BACKLOG: [],
    IN_PROGRESS: [],
    COMPLETED: [],
  });
  const [infoModal, setInfoModal] = useState<{ title: string; description: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 12,
      },
    })
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCustomOrder((prev) => {
      let changed = false;
      const next = { ...prev } as Record<Task['status'], string[]>;

      (['BACKLOG', 'IN_PROGRESS', 'COMPLETED'] as Task['status'][]).forEach((status) => {
        const ids = tasks.filter((task) => task.status === status).map((task) => task.id);
        const prevOrder = prev[status] || [];
        const filtered = prevOrder.filter((id) => ids.includes(id));
        const missing = ids.filter((id) => !filtered.includes(id));
        const merged = [...filtered, ...missing];

        const isDifferent =
          merged.length !== prevOrder.length ||
          merged.some((id, idx) => id !== prevOrder[idx]);

        if (isDifferent) {
          next[status] = merged;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [tasks]);

  // Функция сортировки задач
  const sortTasks = useCallback((tasks: Task[], sortBy: string, columnStatus: Task['status']): Task[] => {
    const sorted = [...tasks];

    switch (sortBy) {
      case 'priority':
        return sorted.sort((a, b) => {
          const priorityOrder = { HIGH: 2, LOW: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

      case 'category':
        return sorted.sort((a, b) => {
          const catA = a.category?.name || '';
          const catB = b.category?.name || '';
          return catA.localeCompare(catB);
        });

      case 'startTime':
        return sorted.sort((a, b) => {
          if (!a.startTime) return 1;
          if (!b.startTime) return -1;
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        });

      case 'endTime':
        return sorted.sort((a, b) => {
          if (!a.endTime) return 1;
          if (!b.endTime) return -1;
          return new Date(b.endTime).getTime() - new Date(a.endTime).getTime();
        });

      case 'expectedTime-asc':
        return sorted.sort((a, b) => {
          const timeA = a.expectedTime || 0;
          const timeB = b.expectedTime || 0;
          return timeA - timeB;
        });

      case 'expectedTime-desc':
        return sorted.sort((a, b) => {
          const timeA = a.expectedTime || 0;
          const timeB = b.expectedTime || 0;
          return timeB - timeA;
        });

      case 'actualTime-asc':
        return sorted.sort((a, b) => a.actualTime - b.actualTime);

      case 'actualTime-desc':
        return sorted.sort((a, b) => b.actualTime - a.actualTime);

      case 'custom':
        return sorted.sort((a, b) => {
          const order = customOrder[columnStatus] || [];
          const indexA = order.indexOf(a.id);
          const indexB = order.indexOf(b.id);

          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });

      case 'default':
      default:
        // По умолчанию: сначала с активным таймером, затем по дате создания
        if (columnStatus === 'IN_PROGRESS') {
          return sorted.sort((a, b) => {
            const aHasActiveTimer = a.startTime && !a.endTime;
            const bHasActiveTimer = b.startTime && !b.endTime;

            if (aHasActiveTimer && !bHasActiveTimer) return -1;
            if (!aHasActiveTimer && bHasActiveTimer) return 1;

            const aUpdated = new Date(a.updatedAt).getTime();
            const bUpdated = new Date(b.updatedAt).getTime();
            return aUpdated - bUpdated;
          });
        }

        return sorted.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
  }, [customOrder]);

  // Фильтрация и сортировка задач по статусу
  const categorizedTasks = useMemo(() => {
    const backlog = tasks.filter((task) => task.status === 'BACKLOG');
    const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS');
    const completed = tasks.filter((task) => task.status === 'COMPLETED');

    return {
      BACKLOG: sortTasks(backlog, sortOptions.BACKLOG, 'BACKLOG'),
      IN_PROGRESS: sortTasks(inProgress, sortOptions.IN_PROGRESS, 'IN_PROGRESS'),
      COMPLETED: sortTasks(completed, sortOptions.COMPLETED, 'COMPLETED'),
    };
  }, [tasks, sortOptions, sortTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Определяем новый статус из ID контейнера
    const overId = over.id as string;
    let newStatus: Task['status'] | null = null;

    if (overId === 'BACKLOG' || overId === 'IN_PROGRESS' || overId === 'COMPLETED') {
      newStatus = overId as Task['status'];
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (!newStatus) {
      return;
    }

    // Проверка бизнес-логики перетаскивания
    if (task.status === newStatus) {
      if (sortOptions[newStatus] === 'custom') {
        const baseOrder = customOrder[newStatus] && customOrder[newStatus].length
          ? customOrder[newStatus]
          : tasks.filter((t) => t.status === newStatus).map((t) => t.id);

        const activeIndex = baseOrder.indexOf(taskId);
        const overTaskId = overId;
        const overIndex = baseOrder.indexOf(overTaskId);

        if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
          const newOrder = arrayMove([...baseOrder], activeIndex, overIndex);
          setCustomOrder((prev) => ({
            ...prev,
            [newStatus]: newOrder,
          }));
        }
      }
      return;
    }

    // BACKLOG → IN_PROGRESS или COMPLETED: OK
    // IN_PROGRESS → COMPLETED: только если таймер запущен, иначе NO
    // IN_PROGRESS → BACKLOG: NO (но может быть OK в режиме разработчика)
    // COMPLETED → IN_PROGRESS: OK
    // COMPLETED → BACKLOG: NO

    if (task.status === 'IN_PROGRESS') {
      if (newStatus === 'BACKLOG') {
        setInfoModal({
          title: 'Перемещение недоступно',
          description: 'Задачу из колонки «В процессе» нельзя вернуть в «Задачи». Завершите её или отмените работу.',
        });
        return;
      }
    }

    if (task.status === 'COMPLETED' && newStatus === 'BACKLOG') {
      setInfoModal({
        title: 'Перемещение недоступно',
        description: 'Завершённые задачи нельзя возвращать в колонку «Задачи».',
      });
      return;
    }

    setCustomOrder((prev) => {
      const statuses: Task['status'][] = ['BACKLOG', 'IN_PROGRESS', 'COMPLETED'];
      const next = { ...prev } as Record<Task['status'], string[]>;

      statuses.forEach((status) => {
        next[status] = (next[status] || []).filter((id) => id !== taskId);
      });

      if (sortOptions[newStatus] === 'custom') {
        const targetOrder = [...(next[newStatus] || [])];
        const overTaskId = overId;

        let insertIndex = targetOrder.length;
        if (overTaskId !== newStatus && targetOrder.includes(overTaskId)) {
          insertIndex = targetOrder.indexOf(overTaskId);
        }

        if (!targetOrder.includes(taskId)) {
          targetOrder.splice(insertIndex, 0, taskId);
          next[newStatus] = targetOrder;
        }
      }

      return next;
    });

    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error('Error updating task status:', error);
      setInfoModal({
        title: 'Не удалось переместить задачу',
        description: 'Проверьте подключение к интернету и попробуйте снова.',
      });
    }
  };

  const handleTaskSave = async (taskData: Partial<Task>) => {
    try {
      if (taskData.id) {
        await updateTask(taskData.id, taskData);
      } else {
        await createTask(taskData as Omit<Task, 'id' | 'createdAt' | 'updatedAt'>);
      }
    } catch (error) {
      console.error('Error saving task:', error);
      throw error;
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  };

  const handleSortChange = (status: 'BACKLOG' | 'IN_PROGRESS' | 'COMPLETED', sortBy: string) => {
    setSortOptions((prev) => ({
      ...prev,
      [status]: sortBy,
    }));

    if (sortBy === 'custom') {
      const currentOrder = categorizedTasks[status].map((task) => task.id);
      setCustomOrder((prev) => ({
        ...prev,
        [status]: currentOrder,
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-96 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-100 rounded"></div>
              <div className="h-20 bg-gray-100 rounded"></div>
              <div className="h-20 bg-gray-100 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-600">Ошибка загрузки задач: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Обновить страницу
        </button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TaskColumn
          title="Задачи"
          status="BACKLOG"
          description="Запланированные задачи"
          tasks={categorizedTasks.BACKLOG}
          onTaskSave={handleTaskSave}
          onTaskDelete={handleTaskDelete}
          isDeveloperMode={isDeveloperMode}
          sortBy={sortOptions.BACKLOG}
          onSortChange={(sortBy) => handleSortChange('BACKLOG', sortBy)}
        />
        <TaskColumn
          title="В процессе"
          status="IN_PROGRESS"
          description="Активные задачи"
          tasks={categorizedTasks.IN_PROGRESS}
          onTaskSave={handleTaskSave}
          onTaskDelete={handleTaskDelete}
          isDeveloperMode={isDeveloperMode}
          sortBy={sortOptions.IN_PROGRESS}
          onSortChange={(sortBy) => handleSortChange('IN_PROGRESS', sortBy)}
        />
        <TaskColumn
          title="Выполненные"
          status="COMPLETED"
          description="Завершенные задачи"
          tasks={categorizedTasks.COMPLETED}
          onTaskSave={handleTaskSave}
          onTaskDelete={handleTaskDelete}
          isDeveloperMode={isDeveloperMode}
          sortBy={sortOptions.COMPLETED}
          onSortChange={(sortBy) => handleSortChange('COMPLETED', sortBy)}
        />
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="opacity-80 rotate-3 transform scale-105">
            <TaskCard task={activeTask} onClick={() => {}} />
          </div>
        ) : null}
      </DragOverlay>

      <ConfirmModal
        isOpen={infoModal !== null}
        title={infoModal?.title || ''}
        description={infoModal?.description}
        confirmText="Понятно"
        showCancel={false}
        onConfirm={() => setInfoModal(null)}
        onClose={() => setInfoModal(null)}
      />
    </DndContext>
  );
}
