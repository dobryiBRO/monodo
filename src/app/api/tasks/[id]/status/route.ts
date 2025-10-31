import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/tasks/[id]/status - Изменение статуса задачи (для drag-and-drop)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, endTime, completedAt } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Проверка существования задачи и прав доступа
    const existingTask = await prisma.task.findUnique({
      where: {
        id: id,
        userId: (session.user as any).id,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Подготовка данных для обновления
    const updateData: any = {
      status,
    };

    // Если задача переносится в COMPLETED, установить endTime и completedAt
    if (status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      updateData.endTime = endTime ? new Date(endTime) : new Date();
      updateData.completedAt = completedAt ? new Date(completedAt) : new Date();
    }

    // Если задача переносится из COMPLETED обратно в IN_PROGRESS, очистить endTime и completedAt
    // НЕ сбрасываем startTime - оставляем первое фактическое время начала
    if (status === 'IN_PROGRESS' && existingTask.status === 'COMPLETED') {
      updateData.endTime = null;
      updateData.completedAt = null;
    }

    const task = await prisma.task.update({
      where: {
        id: id,
      },
      data: updateData,
      include: {
        category: true,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task status:', error);
    return NextResponse.json(
      { error: 'Failed to update task status' },
      { status: 500 }
    );
  }
}

