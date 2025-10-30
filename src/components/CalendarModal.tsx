'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday as checkIsToday, startOfWeek, endOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Task } from '@/types/task';
import { useTasks } from '@/hooks/useTasks';
import { calculateCompletionPercentage, getPercentageColor, isPastDate } from '@/lib/utils';
import { TaskCard } from './tasks/TaskCard';

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

  if (!isOpen) return null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Понедельник
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDayData = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter((task) => {
      const taskDateStr = new Date(task.day).toISOString().split('T')[0];
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

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    
    const dateStr = date.toISOString().split('T')[0];
    const dayTasks = tasks.filter((task) => {
      const taskDateStr = new Date(task.day).toISOString().split('T')[0];
      return taskDateStr === dateStr;
    });

    setSelectedDayTasks({
      inProgress: dayTasks.filter((t) => t.status === 'IN_PROGRESS'),
      completed: dayTasks.filter((t) => t.status === 'COMPLETED'),
    });
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Календарь задач</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {format(currentMonth, 'LLLL yyyy', { locale: ru })}
                </h3>
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Сегодня
                </button>
              </div>
              
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Weekday Headers */}
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
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
                      relative aspect-square p-2 rounded-lg transition-all
                      ${!isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-50'}
                      ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
                      ${isCurrentDay ? 'font-semibold' : ''}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className={`text-sm ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
                        {format(date, 'd')}
                      </span>
                      
                      {dayData.hasData && isCurrentMonth && (
                        <div className="mt-1 flex items-center gap-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: dayData.color }}
                          />
                          <span className="text-xs text-gray-500">
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
            <div className="w-96 border-l border-gray-200 p-6 overflow-y-auto bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                {isPastDate(selectedDate) && (
                  <span className="text-sm font-normal text-gray-500 ml-2">(история)</span>
                )}
              </h3>

              {selectedDayTasks.inProgress.length === 0 && selectedDayTasks.completed.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Нет задач за этот день</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* В процессе */}
                  {selectedDayTasks.inProgress.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">
                        В процессе ({selectedDayTasks.inProgress.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedDayTasks.inProgress.map((task) => (
                          <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                            {task.category && (
                              <div className="flex items-center gap-1 mt-2">
                                <div
                                  className="w-2 h-2 rounded"
                                  style={{ backgroundColor: task.category.color }}
                                />
                                <span className="text-xs text-gray-600">{task.category.name}</span>
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
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase">
                        Выполненные ({selectedDayTasks.completed.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedDayTasks.completed.map((task) => (
                          <div key={task.id} className="bg-white rounded-lg p-3 shadow-sm">
                            <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                            <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                              {task.category && (
                                <div className="flex items-center gap-1">
                                  <div
                                    className="w-2 h-2 rounded"
                                    style={{ backgroundColor: task.category.color }}
                                  />
                                  <span>{task.category.name}</span>
                                </div>
                              )}
                              <span>{Math.round(task.actualTime / 60)} мин</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isPastDate(selectedDate) && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-800">
                  <p className="font-medium">📌 Историческая дата</p>
                  <p className="mt-1">Задачи за прошлые дни нельзя редактировать</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
