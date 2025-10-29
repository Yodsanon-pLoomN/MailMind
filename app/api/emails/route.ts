import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { listMessages } from '@/lib/gmail';
import { z } from 'zod';

const querySchema = z.object({
  pageToken: z.string().optional(),
  pageSize: z.coerce.number().min(1).max(50).default(10),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const params = querySchema.parse({
      pageToken: searchParams.get('pageToken') || undefined,
      pageSize: searchParams.get('pageSize') || 10,
    });

    const result = await listMessages(session.user.id, params.pageToken, params.pageSize);

    return NextResponse.json({
      items: result.items,
      nextPageToken: result.nextPageToken,
      hasMore: !!result.nextPageToken,
    });
  } catch (error: any) {
    console.error('Error fetching emails:', error);

    if (error.code === 403) {
      return NextResponse.json(
        {
          error: 'Gmail API access denied. Please ensure the Gmail API is enabled.',
          details: error.message,
        },
        { status: 403 }
      );
    }

    if (error.code === 401) {
      return NextResponse.json(
        { error: 'Authentication failed. Please sign in again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch emails', details: error.message },
      { status: 500 }
    );
  }
}