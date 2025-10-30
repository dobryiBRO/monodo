'use client';

import { TaskColumn } from './TaskColumn';

export function TaskBoard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <TaskColumn
        title="Tasks"
        status="BACKLOG"
        description="Planned tasks"
      />
      <TaskColumn
        title="In Progress"
        status="IN_PROGRESS"
        description="Active tasks"
      />
      <TaskColumn
        title="Completed"
        status="COMPLETED"
        description="Finished tasks"
      />
    </div>
  );
}
