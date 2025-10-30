import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PUT /api/categories/[id] - Обновление категории
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, color } = body;

    // Проверка существования категории и прав доступа
    const existingCategory = await prisma.category.findUnique({
      where: {
        id: params.id,
        userId: (session.user as any).id,
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Проверка на дубликат имени (если имя изменяется)
    if (name && name !== existingCategory.name) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          userId: (session.user as any).id,
          name,
          id: { not: params.id },
        },
      });

      if (duplicateCategory) {
        return NextResponse.json(
          { error: 'Category with this name already exists' },
          { status: 400 }
        );
      }
    }

    const category = await prisma.category.update({
      where: {
        id: params.id,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(color !== undefined && { color }),
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Удаление категории
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверка существования категории и прав доступа
    const category = await prisma.category.findUnique({
      where: {
        id: params.id,
        userId: (session.user as any).id,
      },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // При удалении категории, связанные задачи не удаляются (onDelete: SetNull)
    await prisma.category.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({
      success: true,
      tasksAffected: category._count.tasks,
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    );
  }
}

