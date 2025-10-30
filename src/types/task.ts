export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  expectedTime?: number; // in minutes
  actualTime?: number; // in minutes
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
