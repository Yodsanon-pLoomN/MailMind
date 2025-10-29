// components/EmailItem.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { EmailItemProps } from '@/lib/utils';
import ThreadDialog from './ThreadDialog';

export default function EmailItem({ email }: EmailItemProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const epoch = Number(email.date);
    const d = Number.isFinite(epoch) && epoch > 0 ? new Date(epoch) : new Date(dateString);
    try {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const extractEmail = (from: string) => {
    const match = from.match(/<(.+?)>/);
    return match ? match[1] : from;
  };

  const extractName = (from: string) => {
    const match = from.match(/^(.+?)\s*</);
    if (match) return match[1].replace(/["']/g, '');
    return from.split('@')[0];
  };

  // เปิด dialog เมื่อคลิกการ์ด
  const handleOpen = () => setOpen(true);

  return (
    <>
      <div
        onClick={handleOpen}
        role="button"
        className={`border rounded-lg p-4 transition-all cursor-pointer ${
          email.isRead ? 'bg-gray-50 opacity-70' : 'bg-white hover:shadow-md'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  email.isRead ? 'bg-transparent' : 'bg-primary'
                }`}
                aria-hidden
              />
              <span className="font-semibold text-foreground truncate">{extractName(email.from)}</span>
              <span className="text-sm text-muted-foreground truncate">
                {extractEmail(email.from)}
              </span>
            </div>

            <h3
              className={
                email.isRead
                  ? 'text-base font-medium text-muted-foreground mb-2 truncate'
                  : 'text-base font-semibold text-foreground mb-2 truncate'
              }
            >
              {email.subject}
            </h3>

            <p className="text-sm text-muted-foreground line-clamp-2">{email.snippet}</p>
          </div>

          <div className="shrink-0 text-sm text-muted-foreground">{formatDate(email.date)}</div>
        </div>
      </div>

      {/* Dialog แสดงทั้งเธรด (เมลหลัก = ตัวที่คลิก) */}
      <ThreadDialog
        open={open}
        onOpenChange={setOpen}
        threadId={email.threadId}
        mainId={email.id}
      />
    </>
  );
}
