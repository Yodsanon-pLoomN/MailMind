'use client';

import { useState, useEffect, useCallback } from 'react';
import DraftItem from './DraftItem';
import { useAuth } from '@/provider/AuthProvider';

export interface Draft {
  id: string;
  threadId: string;
  messageId: string;
  subject: string;
  suggestedDate: string | null;
  location: string | null;
  draftReply: string;
  createdAt: string;
  status: string; // PENDING, APPROVED, REJECTED
}

export default function DraftList() {
  const { logout } = useAuth();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = useCallback(async () => {
    try {
      setLoading(true);
      const appToken = localStorage.getItem('app_token');
      if (!appToken) return logout();

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/drafts`, {
        headers: { Authorization: `Bearer ${appToken}` },
      });

      if (response.status === 401) return logout();
      if (!response.ok) throw new Error('ไม่สามารถเชื่อมต่อข้อมูล Draft ได้');

      const data: Draft[] = await response.json();
      setDrafts(data);
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const handleUpdateDraftStatus = (id: string, newStatus: string) => {
    setDrafts((prev) => prev.map((d) => (d.id === id ? { ...d, status: newStatus } : d)));
  };

  if (loading) return <div className="text-center py-12">กำลังโหลดรายการ...</div>;
  if (error) return <div className="text-red-600 text-center py-12">{error}</div>;
  if (drafts.length === 0) return <div className="text-center py-12 text-gray-500">ไม่มีอีเมลรอการอนุมัติ AI จัดการทุกอย่างเรียบร้อยแล้ว</div>;

  return (
    <div className="space-y-3">
      {drafts.map((draft) => (
        <DraftItem key={draft.id} draft={draft} onUpdateDraft={handleUpdateDraftStatus} />
      ))}
    </div>
  );
}