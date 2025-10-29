// app/api/threads/[threadId]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getThread } from '@/lib/gmail-thread';

export async function GET(
  _req: Request,
  { params }: { params: { threadId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const messages = await getThread(session.user.id, params.threadId);
    return NextResponse.json({ items: messages });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Failed' }, { status: 500 });
  }
}
