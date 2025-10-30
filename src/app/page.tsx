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
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors font-semibold shadow-md"
          >
            📅 Календарь
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-2 bg-gray-200 p-2 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 rounded-xl transition-all font-semibold ${
                activeTab === 'tasks'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Задачи
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-6 py-3 rounded-xl transition-all font-semibold ${
                activeTab === 'dashboard'
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Панель
            </button>
          </div>
        </div>

        {/* Main Content */}
        {activeTab === 'tasks' ? (
          <TaskBoard />
        ) : (
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Панель управления
            </h2>
            <p className="text-gray-700 font-medium">
              Панель управления будет доступна в полной версии с AI-функциями.
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
