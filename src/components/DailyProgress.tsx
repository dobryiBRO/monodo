'use client';

export function DailyProgress() {
  // Mock data for 7 days
  const progressData = [
    { day: 'Mon', completed: 3, total: 5, percentage: 60 },
    { day: 'Tue', completed: 4, total: 6, percentage: 67 },
    { day: 'Wed', completed: 2, total: 4, percentage: 50 },
    { day: 'Thu', completed: 5, total: 7, percentage: 71 },
    { day: 'Fri', completed: 3, total: 5, percentage: 60 },
    { day: 'Sat', completed: 1, total: 3, percentage: 33 },
    { day: 'Sun', completed: 0, total: 2, percentage: 0 },
  ];

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Weekly Progress
      </h2>
      <div className="flex justify-between">
        {progressData.map((day, index) => (
          <div key={index} className="flex flex-col items-center">
            <div className="relative w-12 h-12 mb-2">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200"
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={`${
                    day.percentage >= 80
                      ? 'text-green-500'
                      : day.percentage >= 60
                      ? 'text-blue-500'
                      : day.percentage >= 40
                      ? 'text-yellow-500'
                      : 'text-red-500'
                  }`}
                  stroke="currentColor"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${day.percentage}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-600">
                  {day.percentage}%
                </span>
              </div>
            </div>
            <span className="text-xs text-gray-600">{day.day}</span>
            <span className="text-xs text-gray-500">
              {day.completed}/{day.total}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
