'use client';

import * as React from 'react';
import DraftDialog from './DraftDialog';
import { Badge } from '@/components/ui/badge';
import type { Draft } from './DraftList'; 

type DraftItemProps = {
  draft: Draft;
  onUpdateDraft: (id: string, newStatus: string) => void;
};

export default function DraftItem({ draft, onUpdateDraft }: DraftItemProps) {
  const [open, setOpen] = React.useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderStatus = () => {
    if (draft.status === 'APPROVED') {
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Sent</Badge>;
    }
    if (draft.status === 'REJECTED') {
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Rejected</Badge>;
    }
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>;
  };

  // 🌟 ฟังก์ชันสำหรับโชว์ Badge ความด่วน (Priority)
  const renderPriority = () => {
    if (!draft.priority) return null; // ถ้าไม่มีข้อมูลให้ซ่อนไว้

    switch (draft.priority) {
      case 'HIGH':
        return <Badge className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-50 text-xs font-medium">🔥 ด่วนมาก</Badge>;
      case 'NORMAL':
        return <Badge className="bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-50 text-xs font-medium">ปกติ</Badge>;
      case 'LOW':
        return <Badge className="bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-100 text-xs font-medium">ทั่วไป</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        role="button"
        className={`border rounded-lg p-4 transition-all cursor-pointer ${
          draft.status !== 'PENDING' ? 'bg-gray-50 opacity-75' : 'bg-white hover:shadow-md'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-block h-2 w-2 rounded-full ${draft.status === 'PENDING' ? 'bg-blue-600' : 'bg-gray-400'}`} />
              <span className="font-semibold text-gray-900 truncate">AI Assistant</span>
              
              {/* 🌟 เรียกใช้ Priority Badge ตรงนี้ (ข้างๆ คำว่า AI Assistant) */}
              {renderPriority()}
            </div>
            
            <h3 className={`text-base mb-2 truncate ${draft.status === 'PENDING' ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
              Re: {draft.subject || 'ไม่มีหัวข้อ'}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2">{draft.draftReply}</p>
          </div>

          <div className="shrink-0 flex flex-col items-end gap-2 text-sm text-gray-500">
            <span>{formatDate(draft.createdAt)}</span>
            {renderStatus()}
          </div>
        </div>
      </div>

      <DraftDialog
        open={open}
        onOpenChange={setOpen}
        draft={draft}
        onUpdateDraft={onUpdateDraft}
      />
    </>
  );
}