import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { refreshAccessToken } from '@/lib/gmail';

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await refreshAccessToken(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token', details: error.message },
      { status: 500 }
    );
  }
}