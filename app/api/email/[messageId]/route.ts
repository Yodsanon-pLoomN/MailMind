import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { messageId: string } }
) {
  try {
    const { messageId } = params;
    const email = await prisma.email.findUnique({ where: { messageId } });
    if (!email) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ email });
  } catch (e: any) {
    console.error('GET /api/email/[messageId] error:', e);
    return NextResponse.json({ error: 'Failed to fetch email' }, { status: 500 });
  }
}
