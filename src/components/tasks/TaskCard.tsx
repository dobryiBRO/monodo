'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types/task';
import { Timer } from './Timer';
import { 
  hexToRgba,
  getContrastTextColor,
  getContrastTextColorOnMixed,
  isNearWhite 
} from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  isDeveloperMode?: boolean;
  taskActions?: {
    updateTask: (id: string, updates: Partial<Task>) => Promise<Task> | Promise<any>;
    updateTaskStatus: (id: string, status: Task['status']) => Promise<Task> | Promise<any>;
    getActiveTimerTask: () => Task | null;
    stopActiveTimer: () => Promise<void>;
    refresh: () => Promise<void> | void;
  };
}

export function TaskCard({ task, onClick, onDelete, onCopy, isDeveloperMode = false, taskActions }: TaskCardProps) {
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

  // Используем цвет категории напрямую из task.category (возвращается с сервера)
  const baseColor = task.category?.color || '#6B7280';
  const backgroundAlpha = 0.18; // слегка менее прозрачный, чем было (0.14)
  const isWhiteText = getContrastTextColorOnMixed(baseColor, backgroundAlpha) === '#ffffff';
  const textPrimaryClass = isWhiteText ? 'text-white' : 'text-gray-900';
  const textSecondaryClass = isWhiteText ? 'text-white/80' : 'text-gray-700';

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

  // Определяем стиль фона карточки (однотонный от цвета категории)
  const getCardStyle = () => {
    const borderFallback = isNearWhite(baseColor) ? 'rgba(17,24,39,0.12)' : hexToRgba(baseColor, 0.25);
    return {
      backgroundColor: hexToRgba(baseColor, backgroundAlpha),
      borderColor: borderFallback,
      boxShadow: `0 10px 24px ${hexToRgba(baseColor, 0.14)}`,
    } as React.CSSProperties;
  };

  // Проверка просрочки ПЛАНОВОГО времени начала (только если таймер еще не запущен)
  const isScheduledTimeOverdue = () => {
    if (task.status === 'IN_PROGRESS' && task.scheduledStartTime && !task.startTime) {
      const now = new Date();
      const scheduled = new Date(task.scheduledStartTime);
      return now > scheduled;
    }
    return false;
  };
  
  // Определяем какое время показывать
  const getDisplayTime = () => {
    // Если таймер запущен (startTime есть) - показываем фактическое
    if (task.startTime) {
      return {
        label: 'Начало',
        time: new Date(task.startTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        isOverdue: false,
      };
    }
    // Если таймер не запущен, но есть плановое - показываем плановое
    if (task.scheduledStartTime) {
      return {
        label: 'План',
        time: new Date(task.scheduledStartTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        isOverdue: isScheduledTimeOverdue(),
      };
    }
    return null;
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
            <h4 className={`font-semibold flex-1 text-base ${textPrimaryClass}`}>{task.title}</h4>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
              {onCopy && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy();
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                  title="Копировать задачу"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
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
            <p className={`text-sm mb-3 line-clamp-2 font-medium ${textSecondaryClass}`}>{task.description}</p>
          )}
          
          <div className={`flex items-center justify-between text-sm font-medium ${textSecondaryClass}`}>
            {task.category && (
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-md"
                  style={{ backgroundColor: task.category.color }}
                />
                <span className={`font-semibold ${textPrimaryClass}`}>{task.category.name}</span>
              </div>
            )}
            {task.expectedTime && (
              <span>
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
            <h4 className={`font-semibold flex-1 text-base ${textPrimaryClass}`}>{task.title}</h4>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getPriorityColor(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
              {onCopy && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy();
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:bg-blue-50 rounded transition-all"
                  title="Копировать задачу"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
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
              <div className={`flex items-center gap-2 text-sm ${textSecondaryClass}`}>
                <div
                  className="w-3 h-3 rounded-md"
                  style={{ backgroundColor: task.category.color }}
                />
                <span className={`font-semibold ${textPrimaryClass}`}>{task.category.name}</span>
              </div>
            )}
            
            {(() => {
              const displayTime = getDisplayTime();
              if (!displayTime) return null;
              
              if (displayTime.isOverdue) {
                return (
                  <div className="inline-flex items-center">
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-xs font-semibold shadow-sm">
                      {displayTime.label}: {displayTime.time}
                    </span>
                  </div>
                );
              }
              
              return (
                <div className={`text-xs font-semibold ${textSecondaryClass}`}>
                  {displayTime.label}: {displayTime.time}
                </div>
              );
            })()}
            
            {/* Таймер/Секундомер */}
            <div onClick={(e) => e.stopPropagation()}>
              <Timer task={task} actions={taskActions!} />
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
        className="border-2 rounded-2xl p-5 hover:shadow-xl transition-all cursor-grab active:cursor-grabbing relative"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={`cursor-pointer ${textPrimaryClass}`}
        >
          <div className="flex justify-between items-start mb-3">
            <h4 className={`font-bold flex-1 text-base`}>{task.title}</h4>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/70 text-gray-900 border border-white/80">
                {getPriorityLabel(task.priority)}
              </span>
              {onCopy && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy();
                  }}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-all ${isWhiteText ? 'text-white hover:bg-white/20' : 'text-blue-600 hover:bg-blue-50'}`}
                  title="Копировать задачу"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          <div className={`space-y-2 text-sm font-medium`}>
            {task.category && (
              <div className={`flex items-center gap-2 ${textSecondaryClass}`}>
                <div
                  className={`w-3 h-3 rounded-md ${isWhiteText ? 'border-2 border-white' : ''}`}
                  style={{ backgroundColor: task.category.color }}
                />
                <span className={`font-semibold ${textPrimaryClass}`}>{task.category.name}</span>
              </div>
            )}
            
            {task.endTime && (
              <div className={`text-xs font-bold ${textSecondaryClass}`}>
                Завершено: {new Date(task.endTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
            
            <div className="flex items-center justify-between pt-1">
              <span className={`text-xs font-bold ${textPrimaryClass}`}>
                Время: {Math.round(task.actualTime / 60)} мин
              </span>
              {task.expectedTime && (
                <span className={`text-xs font-bold ${textSecondaryClass}`}>
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
