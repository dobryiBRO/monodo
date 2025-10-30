'use client';

import { useState } from 'react';
import { Task } from '@/types/task';

interface TimerProps {
  task: Task;
}

export function Timer({ task }: TimerProps) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Mock timer logic
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-mono text-gray-600">
        {formatTime(time)}
      </span>
      <button
        onClick={() => setIsRunning(!isRunning)}
        className={`px-2 py-1 text-xs rounded ${
          isRunning
            ? 'bg-red-100 text-red-700 hover:bg-red-200'
            : 'bg-green-100 text-green-700 hover:bg-green-200'
        }`}
      >
        {isRunning ? 'Pause' : 'Start'}
      </button>
    </div>
  );
}
