import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/saved-queries - Get all saved queries for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        savedQueries: {
          orderBy: { updatedAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ savedQueries: user.savedQueries });
  } catch (error) {
    console.error('Error fetching saved queries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/saved-queries - Save a new query
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, query, mode, url, result, tags, folder } = await request.json();

    if (!title || !query || !mode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const savedQuery = await prisma.savedQuery.create({
      data: {
        userId: user.id,
        title,
        query,
        mode,
        url: url || null,
        result: result || null,
        tags: JSON.stringify(tags || []),
        folder: folder || null
      }
    });

    return NextResponse.json({ savedQuery });
  } catch (error) {
    console.error('Error saving query:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 