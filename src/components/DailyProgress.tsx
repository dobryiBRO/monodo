'use client';

import { useEffect, useState } from 'react';
import { getLastNDays, calculateCompletionPercentage, getPercentageColor, isToday } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types/task';

interface DayProgress {
  date: Date;
  completed: number;
  inProgress: number;
  percentage: number;
  color: string;
}

export function DailyProgress() {
  const { tasks } = useTasks();
  const [progressData, setProgressData] = useState<DayProgress[]>([]);

  useEffect(() => {
    const last7Days = getLastNDays(7);
    
    const data = last7Days.map((date) => {
      const dateStr = date.toISOString().split('T')[0];
      
      // Фильтруем задачи по дате
      const dayTasks = tasks.filter((task) => {
        const taskDateStr = new Date(task.day).toISOString().split('T')[0];
        return taskDateStr === dateStr;
      });

      const completed = dayTasks.filter((t) => t.status === 'COMPLETED').length;
      const inProgress = dayTasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const percentage = calculateCompletionPercentage(completed, inProgress);
      const color = getPercentageColor(percentage);

      return {
        date,
        completed,
        inProgress,
        percentage,
        color,
      };
    });

    setProgressData(data);
  }, [tasks]);

  const getDayLabel = (date: Date) => {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return days[date.getDay()];
  };

  const getDateLabel = (date: Date) => {
    return date.getDate();
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Прогресс за неделю
      </h2>
      <div className="flex justify-between items-end">
        {progressData.map((day, index) => {
          const isCurrentDay = isToday(day.date);
          const hasData = day.completed > 0 || day.inProgress > 0;

          return (
            <div key={index} className="flex flex-col items-center gap-2">
              {/* Круг */}
              <div className="relative w-14 h-14">
                <svg className="w-14 h-14 transform -rotate-90" viewBox="0 0 36 36">
                  {/* Фоновый круг */}
                  <path
                    className="text-gray-200"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="none"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  
                  {/* Прогресс (только если не текущий день и есть данные) */}
                  {!isCurrentDay && hasData && (
                    <path
                      style={{ stroke: day.color }}
                      strokeWidth="3"
                      fill="none"
                      strokeDasharray={`${day.percentage}, 100`}
                      strokeLinecap="round"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  )}
                  
                  {/* Подсветка для текущего дня */}
                  {isCurrentDay && (
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="2"
                      strokeDasharray="2 2"
                    />
                  )}
                </svg>
                
                {/* Число или процент внутри круга */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {isCurrentDay ? (
                    <span className="text-xs font-semibold text-blue-600">
                      {getDateLabel(day.date)}
                    </span>
                  ) : hasData ? (
                    <span className="text-xs font-medium text-gray-700">
                      {day.percentage}%
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {getDateLabel(day.date)}
                    </span>
                  )}
                </div>
              </div>
              
              {/* День недели */}
              <span className={`text-xs ${isCurrentDay ? 'text-blue-600 font-semibold' : 'text-gray-600'}`}>
                {getDayLabel(day.date)}
              </span>
              
              {/* Счетчик задач */}
              {hasData && (
                <span className="text-xs text-gray-500">
                  {day.completed}/{day.completed + day.inProgress}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Легенда */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-center gap-6 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>≥67%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span>34-66%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>≤33%</span>
        </div>
      </div>
    </div>
  );
}
