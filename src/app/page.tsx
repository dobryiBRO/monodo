'use client';

import { useState } from 'react';
import { DailyProgress } from '@/components/DailyProgress';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { CalendarModal } from '@/components/CalendarModal';
import { DeveloperMode } from '@/components/DeveloperMode';
import { DataMigration } from '@/components/DataMigration';
import { Header } from '@/components/layout/Header';

export default function Home() {
  const [showCalendar, setShowCalendar] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'dashboard'>('tasks');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <DataMigration />
      
      <div className="container mx-auto px-4 py-6">

        {/* Daily Progress */}
        <div className="mb-6">
          <DailyProgress />
        </div>

        {/* Calendar Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCalendar(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ???? Calendar
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'tasks'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === 'tasks' ? (
          <TaskBoard />
        ) : (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Dashboard
            </h2>
            <p className="text-gray-600">
              Dashboard will be available in full version with AI features.
            </p>
          </div>
        )}

        {/* Developer Mode */}
        <div className="mt-6">
          <DeveloperMode />
        </div>
      </div>

      {/* Calendar Modal */}
      {showCalendar && (
        <CalendarModal
          isOpen={showCalendar}
          onClose={() => setShowCalendar(false)}
        />
      )}
    </div>
  );
}
