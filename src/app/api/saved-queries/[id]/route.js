import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/saved-queries/[id] - Update a saved query
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { title, tags, isFavorite, folder } = await request.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the saved query belongs to the user
    const existingQuery = await prisma.savedQuery.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!existingQuery) {
      return NextResponse.json({ error: 'Saved query not found' }, { status: 404 });
    }

    const updatedQuery = await prisma.savedQuery.update({
      where: { id },
      data: {
        title: title || existingQuery.title,
        tags: tags ? JSON.stringify(tags) : existingQuery.tags,
        isFavorite: isFavorite !== undefined ? isFavorite : existingQuery.isFavorite,
        folder: folder !== undefined ? folder : existingQuery.folder
      }
    });

    return NextResponse.json({ savedQuery: updatedQuery });
  } catch (error) {
    console.error('Error updating saved query:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/saved-queries/[id] - Delete a saved query
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify the saved query belongs to the user
    const existingQuery = await prisma.savedQuery.findFirst({
      where: {
        id,
        userId: user.id
      }
    });

    if (!existingQuery) {
      return NextResponse.json({ error: 'Saved query not found' }, { status: 404 });
    }

    await prisma.savedQuery.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Saved query deleted successfully' });
  } catch (error) {
    console.error('Error deleting saved query:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 