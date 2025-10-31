'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getLastNDays, calculateCompletionPercentage, getPercentageColor, isToday } from '@/lib/utils';
import { useTasks } from '@/hooks/useTasks';

interface DayProgress {
  date: Date;
  completed: number;
  inProgress: number;
  percentage: number;
  color: string;
}

export function DailyProgress() {
  const { tasks } = useTasks();

  const progressData = useMemo<DayProgress[]>(() => {
    const last7Days = getLastNDays(7);
    
    console.log('getLastNDays result:', last7Days.map(d => format(d, 'yyyy-MM-dd')));
    console.log('All tasks with dates:', tasks.map(t => ({ 
      id: t.id, 
      title: t.title, 
      status: t.status,
      day: format(new Date(t.day), 'yyyy-MM-dd'),
      dayRaw: t.day 
    })));

    return last7Days.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd');

      // Фильтруем задачи по дате
      const dayTasks = tasks.filter((task) => {
        const taskDateStr = format(new Date(task.day), 'yyyy-MM-dd');
        return taskDateStr === dateStr;
      });

      const completed = dayTasks.filter((t) => t.status === 'COMPLETED').length;
      const inProgress = dayTasks.filter((t) => t.status === 'IN_PROGRESS').length;
      
      // Для сегодняшнего дня (крайний правый) показываем актуальный процент выполненных задач
      const percentage = calculateCompletionPercentage(completed, inProgress);
      const color = getPercentageColor(percentage);

      console.log('DailyProgress DEBUG:', {
        date: dateStr,
        isToday: isToday(date),
        completed,
        inProgress,
        percentage,
        totalTasks: dayTasks.length,
      });

      return {
        date,
        completed,
        inProgress,
        percentage,
        color,
      };
    });
  }, [tasks]);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Прогресс за неделю
      </h2>
      <div className="grid grid-cols-7 gap-4 px-4">
        {progressData.map((day, index) => {
          const isCurrentDay = isToday(day.date);
          const progress = Math.min(Math.max(day.percentage, 0), 100);
          const progressDegrees = progress * 3.6;
          const borderColor = day.color || '#3B82F6';
          const baseColor = '#E5E7EB';

          return (
            <div key={index} className="flex flex-col items-center gap-3">
              <div
                className={`relative w-16 h-16 rounded-full transition-transform duration-300 ${
                  isCurrentDay ? 'scale-110 shadow-lg' : 'shadow-sm'
                }`}
                style={{
                  background: `conic-gradient(${borderColor} ${progressDegrees}deg, ${baseColor} ${progressDegrees}deg 360deg)`,
                }}
              >
                <div className="absolute inset-1 rounded-full bg-white flex items-center justify-center">
                  <span className={`text-sm font-semibold ${isCurrentDay ? 'text-blue-600' : 'text-gray-800'}`}>
                    {progress}%
                  </span>
                </div>
              </div>
              <span className={`text-xs font-semibold ${isCurrentDay ? 'text-blue-600' : 'text-gray-600'}`}>
                {format(day.date, 'd MMM', { locale: ru })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
