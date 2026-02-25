'use client';

import * as React from 'react';
import ThreadDialog from './ThreadDialog';
import { Badge } from '@/components/ui/badge';
import type { Email } from './EmailList'; // ✅ ดึง Type มาจากไฟล์ด้านบนให้ตรงกัน

type EmailItemWithCbProps = {
  email: Email;
  onEmailUpdate?: (id: string, patch: Partial<Email>) => void;
};

export default function EmailItem({ email, onEmailUpdate }: EmailItemWithCbProps) {
  const [open, setOpen] = React.useState(false);

  // ✅ ปรับปรุงการแปลงวันที่ให้ปลอดภัยและรองรับหลายฟอร์แมต
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const epoch = Number(dateString);
    const d = Number.isFinite(epoch) && epoch > 0 ? new Date(epoch) : new Date(dateString);
    try {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // ✅ ป้องกัน Error กรณี Header เมลไม่ได้ส่ง From มา
  const extractEmail = (from: string) => {
    if (!from) return 'Unknown';
    const match = from.match(/<(.+?)>/);
    return match ? match[1] : from;
  };

  const extractName = (from: string) => {
    if (!from) return 'Unknown Sender';
    const match = from.match(/^(.+?)\s*</);
    if (match) return match[1].replace(/["']/g, '').trim();
    return from.split('@')[0];
  };

  const handleOpen = () => setOpen(true);

  const renderStatus = () => {
    if (!email.status) return null;
    const lower = email.status.toLowerCase();
    if (lower === 'sent') {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Sent</Badge>;
    }
    if (lower === 'draft') {
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Draft</Badge>;
    }
    return <Badge variant="outline">{email.status}</Badge>;
  };

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
                  email.isRead ? 'bg-transparent' : 'bg-blue-600'
                }`}
                aria-hidden
              />
              <span className="font-semibold text-gray-900 truncate">
                {extractName(email.from)}
              </span>
              <span className="text-sm text-gray-500 truncate hidden sm:inline-block">
                {extractEmail(email.from)}
              </span>
            </div>

            <h3
              className={
                email.isRead
                  ? 'text-base font-medium text-gray-600 mb-2 truncate'
                  : 'text-base font-semibold text-gray-900 mb-2 truncate'
              }
            >
              {email.subject}
            </h3>

            {/* แกะข้อความอันตราย (HTML tag) ออกก่อนแสดงเป็น snippet */}
            <p className="text-sm text-gray-500 line-clamp-2">
              {email.snippet.replace(/&#39;/g, "'").replace(/&quot;/g, '"')}
            </p>
          </div>

          {/* ฝั่งขวา: วันที่ + status */}
          <div className="shrink-0 flex flex-col items-end gap-2 text-sm text-gray-500">
            <span>{formatDate(email.date)}</span>
            {renderStatus()}
          </div>
        </div>
      </div>

      <ThreadDialog
        open={open}
        onOpenChange={setOpen}
        threadId={email.threadId}
        mainId={email.id}
        onEmailUpdate={onEmailUpdate}
      />
    </>
  );
}