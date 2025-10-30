'use client';

import { useDeveloperMode } from '@/contexts/DeveloperModeContext';

export function DeveloperMode() {
  const { isDeveloperMode, toggleDeveloperMode, canUseDeveloperMode } = useDeveloperMode();

  if (!canUseDeveloperMode) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            🛠️ Режим разработчика
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Снимает ограничения для тестирования и отладки
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isDeveloperMode}
            onChange={toggleDeveloperMode}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      
      {isDeveloperMode && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <p className="font-medium">⚠️ Режим разработчика активен</p>
          <ul className="mt-1 space-y-0.5 list-disc list-inside">
            <li>Можно удалять задачи из "В процессе"</li>
            <li>Можно редактировать исторические данные</li>
            <li>Сняты все UI-ограничения</li>
          </ul>
        </div>
      )}
    </div>
  );
}
