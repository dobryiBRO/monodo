import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/tasks/[id] - Получение одной задачи
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const task = await prisma.task.findUnique({
      where: {
        id: id,
        userId: (session.user as any).id,
      },
      include: {
        category: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Обновление задачи
export async function PUT(
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
    const {
      title,
      description,
      status,
      priority,
      expectedTime,
      actualTime,
      categoryId,
      day,
      startTime,
      endTime,
      completedAt,
    } = body;

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

    // Серверный предохранитель: если устанавливаем startTime, сбрасываем другие активные таймеры
    if (startTime !== undefined && startTime !== null) {
      await prisma.task.updateMany({
        where: {
          userId: (session.user as any).id,
          id: { not: id },
          startTime: { not: null },
          endTime: null,
          status: 'IN_PROGRESS',
        },
        data: {
          startTime: null,
          endTime: null,
        },
      });
    }

    const task = await prisma.task.update({
      where: {
        id: id,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(status !== undefined && { status }),
        ...(priority !== undefined && { priority }),
        ...(expectedTime !== undefined && { expectedTime }),
        ...(actualTime !== undefined && { actualTime }),
        ...(categoryId !== undefined && { categoryId }),
        ...(day !== undefined && { day: new Date(day) }),
        ...(startTime !== undefined && { 
          startTime: startTime ? new Date(startTime) : null 
        }),
        ...(endTime !== undefined && { 
          endTime: endTime ? new Date(endTime) : null 
        }),
        ...(completedAt !== undefined && { 
          completedAt: completedAt ? new Date(completedAt) : null 
        }),
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Удаление задачи
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const userRole = (session.user as any).role;

    // Проверка существования задачи и прав доступа
    const task = await prisma.task.findUnique({
      where: {
        id: id,
        userId: (session.user as any).id,
      },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Бизнес-логика: можно удалять только задачи в BACKLOG
    // Исключение: роли DEVELOPER и ADMIN
    if (task.status !== 'BACKLOG' && userRole !== 'DEVELOPER' && userRole !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Can only delete tasks in BACKLOG status' },
        { status: 403 }
      );
    }

    await prisma.task.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}

