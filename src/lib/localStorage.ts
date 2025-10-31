import { Task, Category } from '@/types/task';

const TASKS_KEY = 'monodo_tasks';
const CATEGORIES_KEY = 'monodo_categories';
const TASK_COUNTER_KEY = 'monodo_task_counter';

/**
 * Проверка доступности localStorage
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Генерация временного ID для задачи
 */
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ===== TASKS =====

/**
 * Получение всех задач из localStorage
 */
export function getLocalTasks(): Task[] {
  if (!isLocalStorageAvailable()) return [];
  
  try {
    const data = localStorage.getItem(TASKS_KEY);
    if (!data) return [];
    
    const tasks = JSON.parse(data);
    const categories = getLocalCategories();
    
    // Преобразование строк дат обратно в объекты Date и присоединение категорий
    return tasks.map((task: any) => ({
      ...task,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
      startTime: task.startTime ? new Date(task.startTime) : undefined,
      endTime: task.endTime ? new Date(task.endTime) : undefined,
      scheduledStartTime: task.scheduledStartTime ? new Date(task.scheduledStartTime) : undefined,
      day: new Date(task.day),
      category: task.categoryId ? categories.find((c) => c.id === task.categoryId) : undefined,
    }));
  } catch (error) {
    console.error('Error getting local tasks:', error);
    return [];
  }
}

/**
 * Сохранение задачи в localStorage
 */
export function saveLocalTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
  if (!isLocalStorageAvailable()) {
    throw new Error('localStorage is not available');
  }

  const tasks = getLocalTasks();
  const categories = getLocalCategories();
  const newTask: Task = {
    ...task,
    id: generateTempId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    category: task.categoryId ? categories.find((c) => c.id === task.categoryId) : undefined,
  };

  tasks.push(newTask);
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  
  // Увеличить счетчик задач
  incrementTaskCounter();
  
  return newTask;
}

/**
 * Обновление задачи в localStorage
 */
export function updateLocalTask(id: string, updates: Partial<Task>): Task | null {
  if (!isLocalStorageAvailable()) {
    throw new Error('localStorage is not available');
  }

  const tasks = getLocalTasks();
  const categories = getLocalCategories();
  const index = tasks.findIndex(t => t.id === id);
  
  if (index === -1) return null;

  const updatedTask = {
    ...tasks[index],
    ...updates,
    updatedAt: new Date(),
  };
  
  // Присоединяем категорию если есть categoryId
  if (updatedTask.categoryId) {
    updatedTask.category = categories.find((c) => c.id === updatedTask.categoryId);
  }

  tasks[index] = updatedTask;
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  
  return updatedTask;
}

/**
 * Удаление задачи из localStorage
 */
export function deleteLocalTask(id: string): boolean {
  if (!isLocalStorageAvailable()) {
    throw new Error('localStorage is not available');
  }

  const tasks = getLocalTasks();
  const filteredTasks = tasks.filter(t => t.id !== id);
  
  if (filteredTasks.length === tasks.length) return false;

  localStorage.setItem(TASKS_KEY, JSON.stringify(filteredTasks));
  return true;
}

/**
 * Получение задач по дате
 */
export function getLocalTasksByDate(date: Date): Task[] {
  const tasks = getLocalTasks();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  return tasks.filter(task => {
    const taskDate = new Date(task.day);
    const taskYear = taskDate.getFullYear();
    const taskMonth = String(taskDate.getMonth() + 1).padStart(2, '0');
    const taskDay = String(taskDate.getDate()).padStart(2, '0');
    const taskDateStr = `${taskYear}-${taskMonth}-${taskDay}`;
    return taskDateStr === dateStr;
  });
}

/**
 * Очистка всех задач из localStorage
 */
export function clearLocalTasks(): void {
  if (!isLocalStorageAvailable()) return;
  localStorage.removeItem(TASKS_KEY);
  localStorage.removeItem(TASK_COUNTER_KEY);
}

// ===== CATEGORIES =====

/**
 * Получение всех категорий из localStorage
 */
export function getLocalCategories(): Category[] {
  if (!isLocalStorageAvailable()) return [];
  
  try {
    const data = localStorage.getItem(CATEGORIES_KEY);
    if (!data) return [];
    
    const categories = JSON.parse(data);
    return categories.map((cat: any) => ({
      ...cat,
      createdAt: new Date(cat.createdAt),
      updatedAt: new Date(cat.updatedAt),
    }));
  } catch (error) {
    console.error('Error getting local categories:', error);
    return [];
  }
}

/**
 * Сохранение категории в localStorage
 */
export function saveLocalCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Category {
  if (!isLocalStorageAvailable()) {
    throw new Error('localStorage is not available');
  }

  const categories = getLocalCategories();
  const newCategory: Category = {
    ...category,
    id: generateTempId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  categories.push(newCategory);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  
  return newCategory;
}

/**
 * Обновление категории в localStorage
 */
export function updateLocalCategory(id: string, updates: Partial<Category>): Category | null {
  if (!isLocalStorageAvailable()) {
    throw new Error('localStorage is not available');
  }

  const categories = getLocalCategories();
  const index = categories.findIndex(c => c.id === id);
  
  if (index === -1) return null;

  const updatedCategory = {
    ...categories[index],
    ...updates,
    updatedAt: new Date(),
  };

  categories[index] = updatedCategory;
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  
  return updatedCategory;
}

/**
 * Удаление категории из localStorage
 */
export function deleteLocalCategory(id: string): boolean {
  if (!isLocalStorageAvailable()) {
    throw new Error('localStorage is not available');
  }

  const categories = getLocalCategories();
  const filteredCategories = categories.filter(c => c.id !== id);
  
  if (filteredCategories.length === categories.length) return false;

  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(filteredCategories));
  return true;
}

/**
 * Очистка всех категорий из localStorage
 */
export function clearLocalCategories(): void {
  if (!isLocalStorageAvailable()) return;
  localStorage.removeItem(CATEGORIES_KEY);
}

// ===== TASK COUNTER =====

/**
 * Получение счетчика созданных задач
 */
export function getTaskCounter(): number {
  if (!isLocalStorageAvailable()) return 0;
  
  const counter = localStorage.getItem(TASK_COUNTER_KEY);
  return counter ? parseInt(counter, 10) : 0;
}

/**
 * Увеличение счетчика задач
 */
function incrementTaskCounter(): void {
  if (!isLocalStorageAvailable()) return;
  
  const current = getTaskCounter();
  localStorage.setItem(TASK_COUNTER_KEY, (current + 1).toString());
}

/**
 * Проверка, есть ли несохраненные данные
 */
export function hasUnsavedData(): boolean {
  const tasks = getLocalTasks();
  const categories = getLocalCategories();
  return tasks.length > 0 || categories.length > 0;
}

/**
 * Экспорт всех данных из localStorage
 */
export function exportLocalData(): {
  tasks: Task[];
  categories: Category[];
} {
  return {
    tasks: getLocalTasks(),
    categories: getLocalCategories(),
  };
}

