export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'HIGH';
  
  // Время в секундах
  expectedTime?: number; // in seconds
  actualTime: number; // in seconds (default 0)
  
  // Временные метки
  startTime?: Date; // Фактическое время начала работы
  endTime?: Date; // Время завершения
  
  userId: string;
  categoryId?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  day: Date;
  category?: Category;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
