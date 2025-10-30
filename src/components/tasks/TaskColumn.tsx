'use client';

import { useState } from 'react';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';

interface TaskColumnProps {
  title: string;
  status: 'BACKLOG' | 'IN_PROGRESS' | 'COMPLETED';
  description: string;
}

export function TaskColumn({ title, status, description }: TaskColumnProps) {
  const [showModal, setShowModal] = useState(false);
  
  // Mock data for demonstration
  const mockTasks = [
    {
      id: '1',
      title: 'Example task',
      description: 'Task description',
      status: status,
      priority: 'MEDIUM' as const,
      expectedTime: 30,
      actualTime: 0,
      userId: 'mock-user-id',
     createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: status === 'COMPLETED' ? new Date() : null,
     day: new Date(),
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      
	  
      <div className="p-4 min-h-[400px]">
        <div className="space-y-3">
          {mockTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="w-full mt-4 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          + Add task
        </button>
      </div>

      {showModal && (
        <TaskModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          task={null}
          status={status}
        />
      )}
    </div>
  );
}
