'use client';

import { useEffect, useState } from 'react';
import { Task } from '@/types/task';
import { getLocalTasks, saveLocalTask, updateLocalTask, deleteLocalTask } from '@/lib/localStorage';
import { useSession } from 'next-auth/react';

export function useTasks(day?: Date) {
  const { data: session, status } = useSession();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (status === 'authenticated') {
        // Получение задач с сервера
        const params = new URLSearchParams();
        if (day) {
          params.append('day', day.toISOString().split('T')[0]);
        }
        
        const response = await fetch(`/api/tasks?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        
        const data = await response.json();
        setTasks(data);
      } else {
        // Получение задач из localStorage
        const localTasks = getLocalTasks();
        setTasks(localTasks);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status !== 'loading') {
      fetchTasks();
    }
  }, [status, day]);

  const createTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (status === 'authenticated') {
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          throw new Error('Failed to create task');
        }

        const newTask = await response.json();
        setTasks([...tasks, newTask]);
        return newTask;
      } else {
        const newTask = saveLocalTask(taskData);
        setTasks([...tasks, newTask]);
        return newTask;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      if (status === 'authenticated') {
        const response = await fetch(`/api/tasks/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error('Failed to update task');
        }

        const updatedTask = await response.json();
        setTasks(tasks.map((task) => (task.id === id ? updatedTask : task)));
        return updatedTask;
      } else {
        const updatedTask = updateLocalTask(id, updates);
        if (updatedTask) {
          setTasks(tasks.map((task) => (task.id === id ? updatedTask : task)));
          return updatedTask;
        }
        throw new Error('Task not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      if (status === 'authenticated') {
        const response = await fetch(`/api/tasks/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete task');
        }

        setTasks(tasks.filter((task) => task.id !== id));
      } else {
        const success = deleteLocalTask(id);
        if (success) {
          setTasks(tasks.filter((task) => task.id !== id));
        } else {
          throw new Error('Task not found');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updateTaskStatus = async (id: string, newStatus: Task['status']) => {
    try {
      if (status === 'authenticated') {
        const response = await fetch(`/api/tasks/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error('Failed to update task status');
        }

        const updatedTask = await response.json();
        setTasks(tasks.map((task) => (task.id === id ? updatedTask : task)));
        return updatedTask;
      } else {
        return updateTask(id, { status: newStatus });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    refresh: fetchTasks,
  };
}

