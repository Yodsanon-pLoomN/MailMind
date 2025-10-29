// app/mail/[threadId]/page.tsx
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import ThreadView from './thread-view';

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: { threadId: string };
  searchParams: { m?: string };
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  // ให้ client ไปเรียก API เองก็ได้ หรือคุณจะดึงที่ server ก็ได้
  // เพื่อความง่าย ใช้ client fetch /api/threads/[threadId]
  return <ThreadView threadId={params.threadId} mainId={searchParams.m} />;
}
