'use client';

import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types/task';
import { formatTime } from '@/lib/utils';

interface TimerProps {
  task: Task;
  actions: {
    updateTask: (id: string, updates: Partial<Task>) => Promise<Task> | Promise<any>;
    updateTaskStatus: (id: string, status: Task['status']) => Promise<Task> | Promise<any>;
    getActiveTimerTask: () => Task | null;
    stopActiveTimer: () => Promise<void>;
    refresh: () => Promise<void> | void;
  };
}

export function Timer({ task, actions }: TimerProps) {
  const { updateTask, updateTaskStatus, getActiveTimerTask, stopActiveTimer, refresh } = actions;
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const actualTimeRef = useRef(task.actualTime); // Ref для отслеживания актуального времени

  // Определяем, работаем ли с таймером (обратный отсчет) или секундомером
  const hasExpectedTime = task.expectedTime && task.expectedTime > 0;
  const hasStartedBefore = task.actualTime > 0;
  const isTimer = hasExpectedTime && !hasStartedBefore;

  // ДИАГНОСТИКА: Логируем все важные параметры
  console.log('🔍 Timer Debug:', {
    taskId: task.id.substring(0, 8),
    expectedTime: task.expectedTime,
    actualTime: task.actualTime,
    hasExpectedTime,
    hasStartedBefore,
    isTimer,
    startTime: task.startTime,
    endTime: task.endTime,
    status: task.status,
    isRunning,
    isPaused,
  });

  // Синхронизируем ref с prop
  useEffect(() => {
    actualTimeRef.current = task.actualTime;
  }, [task.actualTime]);

  // Вычисляем начальное время
  useEffect(() => {
    console.log('📊 useEffect [INIT] сработал', { isTimer, expectedTime: task.expectedTime, actualTime: task.actualTime });
    
    if (isTimer) {
      // Таймер: ожидаемое время минус фактическое
      setTime((task.expectedTime || 0) - task.actualTime);
    } else {
      // Секундомер: фактическое время
      setTime(task.actualTime);
    }

    // Проверяем, запущен ли таймер (только если IN_PROGRESS и корректные поля)
    if (task.status === 'IN_PROGRESS' && task.startTime && !task.endTime) {
      console.log('✅ Устанавливаем isRunning = true');
      setIsRunning(true);
      setIsPaused(false);
    } else {
      console.log('❌ Устанавливаем isRunning = false', { 
        status: task.status, 
        hasStartTime: !!task.startTime, 
        hasEndTime: !!task.endTime 
      });
      setIsRunning(false);
      setIsPaused(false);
    }
  }, [task.id, task.status, task.expectedTime, task.actualTime, task.startTime, task.endTime, isTimer]);

  // Управление таймером/секундомером
  useEffect(() => {
    console.log('⏱️ useEffect [INTERVAL] сработал', { isRunning, isPaused, isTimer });
    
    if (isRunning && !isPaused) {
      console.log('🟢 Запускаем интервал');
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (isTimer) {
            // Таймер: обратный отсчет
            const newTime = prevTime - 1;
            if (newTime <= 0) {
              // Время вышло, переключаемся на секундомер (показываем +)
              return -1;
            }
            return newTime;
          } else {
            // Секундомер: прямой отсчет
            return prevTime + 1;
          }
        });

        // Обновляем actualTime в БД каждую секунду, используя ref для актуального значения
        actualTimeRef.current += 1;
        console.log('⏲️ Обновляем actualTime:', actualTimeRef.current);
        updateTask(task.id, {
          actualTime: actualTimeRef.current,
        }).catch(console.error);
      }, 1000);
    } else {
      if (intervalRef.current) {
        console.log('🔴 Останавливаем интервал');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        console.log('🧹 Cleanup: останавливаем интервал');
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, isTimer, task.id, updateTask]);

  const handleStart = async () => {
    try {
      console.log('🚀 handleStart вызван');
      
      // Проверяем, есть ли другой активный таймер
      const activeTimer = getActiveTimerTask();
      if (activeTimer && activeTimer.id !== task.id) {
        // Останавливаем предыдущий таймер (полное отключение)
        await stopActiveTimer();
        // Обновляем список задач, чтобы предыдущий таймер точно остановился
        await refresh();
        // Небольшая пауза для синхронизации
        await new Promise(resolve => setTimeout(resolve, 100));
        // Показываем предупреждение на 3 секунды
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      }
      
      // Запускаем текущий таймер (серверный предохранитель отключит другие)
      console.log('📝 Обновляем startTime в БД');
      await updateTask(task.id, {
        startTime: new Date(),
      });
      // Обновляем список, чтобы карточки упорядочились
      await refresh();
      console.log('✅ Устанавливаем isRunning = true локально');
      setIsRunning(true);
      setIsPaused(false);
    } catch (error) {
      console.error('Error starting timer:', error);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = async () => {
    try {
      await updateTask(task.id, {
        startTime: null as unknown as any,
        endTime: null as unknown as any,
        actualTime: actualTimeRef.current,
      });
      await refresh(); // Обновляем список, чтобы карточка упала вниз
      setIsRunning(false);
      setIsPaused(false);
    } catch (error) {
      console.error('Error stopping timer:', error);
    }
  };

  const handleComplete = async () => {
    try {
      // Сначала сохраняем актуальное время и устанавливаем endTime
      await updateTask(task.id, {
        actualTime: actualTimeRef.current,
        endTime: new Date(),
      });

      // Затем меняем статус на COMPLETED
      await updateTaskStatus(task.id, 'COMPLETED');

      // Обновляем список задач
      await refresh();

      setIsRunning(false);
      setIsPaused(false);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  // Отображение времени
  const displayTime = () => {
    if (isTimer && time > 0) {
      // Таймер с обратным отсчетом
      return formatTime(time);
    } else if (time < 0) {
      // Просрочка (со знаком +)
      return `+${formatTime(Math.abs(time))}`;
    } else {
      // Секундомер
      return formatTime(time);
    }
  };

  const getTimeColor = () => {
    if (isTimer) {
      if (time < 0) return 'text-red-600';
      if (time <= 60) return 'text-yellow-600';
      return 'text-gray-800';
    }
    return 'text-gray-800';
  };

  // Если таймер не запущен
  if (!isRunning) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-gray-600">
          {displayTime()}
        </span>
        <button
          onClick={handleStart}
          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors font-medium"
        >
          Запуск
        </button>
      </div>
    );
  }

  // Таймер запущен
  return (
    <div className="space-y-2">
      {/* Предупреждение о переключении таймера */}
      {showWarning && (
        <div className="text-xs text-orange-600 font-medium bg-orange-50 border border-orange-200 rounded px-2 py-1 animate-pulse">
          ⚠️ Предыдущий таймер остановлен
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <span className={`text-lg font-mono font-semibold ${getTimeColor()}`}>
          {displayTime()}
        </span>
      </div>

      <div className="flex gap-1">
        {isPaused ? (
          <button
            onClick={handleResume}
            className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            title="Возобновить"
          >
            ▶ Продолжить
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex-1 px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            title="Пауза"
          >
            ⏸ Пауза
          </button>
        )}

        <button
          onClick={handleStop}
          className="flex-1 px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          title="Отключить"
        >
          ⏹ Отключить
        </button>

        <button
          onClick={handleComplete}
          className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          title="Выполнено"
        >
          ✓ Готово
        </button>
      </div>

      {/* Визуальный индикатор просрочки */}
      {isTimer && time <= 0 && (
        <div className="text-xs text-red-600 font-medium animate-pulse">
          ⚠️ Время истекло!
        </div>
      )}
    </div>
  );
}
