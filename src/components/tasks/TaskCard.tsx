'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/task';
import { Timer } from './Timer';
import { createCompletedGradient, createCategoryGradient, hexToRgba } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDelete?: () => void;
  isDeveloperMode?: boolean;
}

export function TaskCard({ task, onClick, onDelete, isDeveloperMode = false }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string) => {
    return priority === 'HIGH' ? 'Высокий' : 'Низкий';
  };

  // Определяем стиль фона карточки
  const getCardStyle = () => {
    const baseColor = task.category?.color || '#6B7280'; // fallback на серый
    
    if (task.status === 'COMPLETED') {
      return {
        background: createCompletedGradient(baseColor),
        borderColor: hexToRgba(baseColor, 0.4),
        boxShadow: `0 12px 30px ${hexToRgba(baseColor, 0.25)}`,
      };
    }

    if (task.category) {
      return {
        background: createCategoryGradient(baseColor, 0.18),
        borderColor: hexToRgba(baseColor, 0.35),
        boxShadow: `0 10px 24px ${hexToRgba(baseColor, 0.18)}`,
      };
    }

    return {};
  };

  // Проверка просрочки времени начала
  const isStartTimeOverdue = () => {
    if (task.status === 'IN_PROGRESS' && task.startTime && !task.endTime) {
      const now = new Date();
      const start = new Date(task.startTime);
      return now < start;
    }
    return false;
  };

  // ВАРИАНТ 1: BACKLOG
  if (task.status === 'BACKLOG') {
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, ...getCardStyle() }}
        {...attributes}
        {...listeners}
        className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:shadow-xl hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing group"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="cursor-pointer"
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-semibold text-gray-900 flex-1 text-base">{task.title}</h4>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                  title="Удалить"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {task.description && (
            <p className="text-sm text-gray-700 mb-3 line-clamp-2 font-medium">{task.description}</p>
          )}
          
          <div className="flex items-center justify-between text-sm font-medium">
            {task.category && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-md"
                  style={{ backgroundColor: task.category.color }}
                />
                <span className="text-gray-800 font-semibold">{task.category.name}</span>
              </div>
            )}
            {task.expectedTime && (
              <span className="text-gray-600 font-semibold">
                ~{Math.round(task.expectedTime / 60)} мин
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ВАРИАНТ 2: IN_PROGRESS
  if (task.status === 'IN_PROGRESS') {
    const canDelete = isDeveloperMode;
    
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, ...getCardStyle() }}
        {...attributes}
        {...listeners}
        className="bg-white border-2 border-gray-200 rounded-2xl p-5 hover:shadow-xl hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing group"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="cursor-pointer"
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-semibold text-gray-900 flex-1 text-base">{task.title}</h4>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
              {canDelete && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                  title="Удалить (Режим разработчика)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
              {!canDelete && (
                <div className="relative group/tooltip">
                  <button
                    className="p-1 text-gray-400 cursor-not-allowed"
                    onClick={(e) => e.stopPropagation()}
                    title="Задачи нельзя удалить из этого блока"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            {task.category && (
              <div className="flex items-center gap-2 text-sm">
                <div
                  className="w-3 h-3 rounded-md"
                  style={{ backgroundColor: task.category.color }}
                />
                <span className="text-gray-800 font-semibold">{task.category.name}</span>
              </div>
            )}
            
            {task.startTime && (
              <div className={`text-xs font-semibold ${isStartTimeOverdue() ? 'text-red-600' : 'text-gray-600'}`}>
                Начало: {new Date(task.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            
            {/* Таймер/Секундомер */}
            <div onClick={(e) => e.stopPropagation()}>
              <Timer task={task} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ВАРИАНТ 3: COMPLETED
  if (task.status === 'COMPLETED') {
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, ...getCardStyle() }}
        {...attributes}
        {...listeners}
        className="border-2 rounded-2xl p-5 hover:shadow-xl transition-all cursor-grab active:cursor-grabbing relative overflow-hidden"
      >
        {/* Полупрозрачный overlay для лучшей читаемости текста */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/30 to-black/20 pointer-events-none" />
        
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="cursor-pointer relative z-10 text-white"
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold flex-1 text-base drop-shadow-sm">{task.title}</h4>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/30 backdrop-blur-sm border border-white/40">
              {getPriorityLabel(task.priority)}
            </span>
          </div>
          
          <div className="space-y-2 text-sm font-medium drop-shadow-sm">
            {task.category && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-md border-2 border-white shadow-sm"
                  style={{ backgroundColor: task.category.color }}
                />
                <span className="font-semibold">{task.category.name}</span>
              </div>
            )}
            
            {task.endTime && (
              <div className="text-xs font-bold">
                Завершено: {new Date(task.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold">
                Время: {Math.round(task.actualTime / 60)} мин
              </span>
              {task.expectedTime && (
                <span className="text-xs font-bold">
                  План/Факт: {Math.round((task.expectedTime / (task.actualTime || 1)) * 100)}%
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
