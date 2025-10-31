'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday as checkIsToday, startOfWeek, endOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Task } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import { calculateCompletionPercentage, getPercentageColor, isPastDate } from '@/lib/utils';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CalendarModal({ isOpen, onClose }: CalendarModalProps) {
  const { tasks } = useTasks();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayTasks, setSelectedDayTasks] = useState<{
    inProgress: Task[];
    completed: Task[];
  }>({ inProgress: [], completed: [] });

  const closeModal = useCallback(() => {
    setSelectedDate(null);
    setSelectedDayTasks({ inProgress: [], completed: [] });
    onClose();
  }, [onClose]);

  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    
    // Нормализуем дату для корректного сравнения
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTasks = tasks.filter((task) => {
      const taskDateStr = format(new Date(task.day), 'yyyy-MM-dd');
      return taskDateStr === dateStr;
    });

    setSelectedDayTasks({
      inProgress: dayTasks.filter((t) => t.status === 'IN_PROGRESS'),
      completed: dayTasks.filter((t) => t.status === 'COMPLETED'),
    });
  }, [tasks]);

  // Закрытие по Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, closeModal]);

  // При открытии сразу выбирать сегодняшнюю дату
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentMonth(today);
      handleDateClick(today);
    }
  }, [isOpen, handleDateClick]);

  // Обновляем selectedDayTasks когда tasks изменяются
  useEffect(() => {
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayTasks = tasks.filter((task) => {
        const taskDateStr = format(new Date(task.day), 'yyyy-MM-dd');
        return taskDateStr === dateStr;
      });

      setSelectedDayTasks({
        inProgress: dayTasks.filter((t) => t.status === 'IN_PROGRESS'),
        completed: dayTasks.filter((t) => t.status === 'COMPLETED'),
      });
    }
  }, [tasks, selectedDate]);

  if (!isOpen) return null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Понедельник
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDayData = (date: Date) => {
    // Нормализуем дату для корректного сравнения (без времени)
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTasks = tasks.filter((task) => {
      const taskDateStr = format(new Date(task.day), 'yyyy-MM-dd');
      return taskDateStr === dateStr;
    });

    const completed = dayTasks.filter((t) => t.status === 'COMPLETED').length;
    const inProgress = dayTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const percentage = calculateCompletionPercentage(completed, inProgress);

    return {
      completed,
      inProgress,
      percentage,
      color: getPercentageColor(percentage),
      hasData: completed > 0 || inProgress > 0,
    };
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    handleDateClick(today);
  };

  return (
    <div 
      className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={closeModal}
    >
      <div 
        className="bg-white/95 backdrop-blur-sm rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-8 border-b-2 border-gray-200">
          <h2 className="text-3xl font-bold text-gray-900">Календарь задач</h2>
          <button
            onClick={closeModal}
            className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-2xl"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Calendar */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={previousMonth}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center gap-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {format(currentMonth, 'LLLL yyyy', { locale: ru })}
                </h3>
                <button
                  onClick={goToToday}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors font-semibold"
                >
                  Сегодня
                </button>
              </div>
              
              <button
                onClick={nextMonth}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-3">
              {/* Weekday Headers */}
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                <div key={day} className="text-center text-sm font-bold text-gray-700 py-3">
                  {day}
                </div>
              ))}
              
              {/* Calendar Days */}
              {calendarDays.map((date, index) => {
                const dayData = getDayData(date);
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const isCurrentDay = checkIsToday(date);

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(date)}
                    disabled={!isCurrentMonth}
                    className={`
                      relative aspect-square p-3 rounded-2xl transition-all font-semibold
                      ${!isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'hover:bg-blue-50'}
                      ${isSelected ? 'ring-2 ring-blue-500 bg-blue-100' : ''}
                      ${isCurrentDay ? 'bg-blue-50' : ''}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className={`text-sm font-bold ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
                        {format(date, 'd')}
                      </span>
                      
                      {dayData.hasData && isCurrentMonth && (
                        <div className="mt-1 flex items-center gap-1">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: dayData.color }}
                          />
                          <span className="text-xs text-gray-600 font-semibold">
                            {dayData.percentage}%
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Details */}
          {selectedDate && (
            <div className="w-96 border-l-2 border-gray-200 p-8 overflow-y-auto bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                {isPastDate(selectedDate) && (
                  <span className="text-sm font-medium text-gray-600 ml-2">(история)</span>
                )}
              </h3>

              {selectedDayTasks.inProgress.length === 0 && selectedDayTasks.completed.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm font-medium">Нет задач за этот день</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* В процессе */}
                  {selectedDayTasks.inProgress.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase">
                        В процессе ({selectedDayTasks.inProgress.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedDayTasks.inProgress.map((task) => (
                          <div key={task.id} className="bg-white rounded-2xl p-4 shadow-sm border-2 border-gray-200">
                            <p className="font-semibold text-gray-900 text-sm">{task.title}</p>
                            {task.category && (
                              <div className="flex items-center gap-2 mt-2">
                                <div
                                  className="w-2.5 h-2.5 rounded-md"
                                  style={{ backgroundColor: task.category.color }}
                                />
                                <span className="text-xs text-gray-700 font-medium">{task.category.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Выполненные */}
                  {selectedDayTasks.completed.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-800 mb-4 uppercase">
                        Выполненные ({selectedDayTasks.completed.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedDayTasks.completed.map((task) => (
                          <div key={task.id} className="bg-white rounded-2xl p-4 shadow-sm border-2 border-gray-200">
                            <p className="font-semibold text-gray-900 text-sm">{task.title}</p>
                            <div className="flex items-center justify-between mt-2 text-xs text-gray-700">
                              {task.category && (
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2.5 h-2.5 rounded-md"
                                    style={{ backgroundColor: task.category.color }}
                                  />
                                  <span className="font-medium">{task.category.name}</span>
                                </div>
                              )}
                              <span className="font-semibold">{Math.round(task.actualTime / 60)} мин</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isPastDate(selectedDate) && (
                <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-2xl text-xs text-yellow-800">
                  <p className="font-bold">📌 Историческая дата</p>
                  <p className="mt-1 font-medium">Задачи за прошлые дни нельзя редактировать</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
