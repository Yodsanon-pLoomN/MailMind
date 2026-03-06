"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Draft } from "@/lib/type";

export default function AiDraftList() {
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
  const [drafts, setDrafts] = React.useState<Draft[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingText, setEditingText] = React.useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const token = localStorage.getItem("app_token");
      const res = await fetch(`${API_BASE}/api/drafts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDrafts(data);
        
        // เอาข้อความร่างมาใส่ใน state เผื่อผู้ใช้กดแก้
        const initialText: Record<string, string> = {};
        data.forEach((d: Draft) => {
          initialText[d.id] = d.draftReply;
        });
        setEditingText(initialText);
      }
    } catch (error) {
      console.error("Error fetching drafts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (id: string, text: string) => {
    setEditingText((prev) => ({ ...prev, [id]: text }));
  };

  const handleAction = async (id: string, action: "send" | "reject") => {
    setActionLoading(id);
    try {
      const token = localStorage.getItem("app_token");
      const url = `${API_BASE}/api/drafts/${id}/${action}`;
      
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: action === "send" ? JSON.stringify({ editedReply: editingText[id] }) : undefined,
      });

      if (res.ok) {
        // ลบ Draft ออกจากหน้าจอถ้ายิง API สำเร็จ
        setDrafts((prev) => prev.filter((d) => d.id !== id));
      } else {
        alert("เกิดข้อผิดพลาดในการดำเนินการ");
      }
    } catch (error) {
      console.error("Action error:", error);
      alert("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">กำลังโหลดรายการรออนุมัติ...</div>;

  if (drafts.length === 0) {
    return (
      <div className="p-12 text-center border border-dashed rounded-xl bg-slate-50">
        <h3 className="text-lg font-medium text-slate-700">🎉 ไม่มีอีเมลรอการอนุมัติ</h3>
        <p className="text-sm text-slate-500 mt-1">AI จัดการเช็คและรอรับคำสั่งให้คุณอยู่ที่นี่</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">🤖 AI Drafts Waiting for Approval</h2>
          <p className="text-sm text-muted-foreground">ตรวจสอบ แก้ไข และกดส่งอีเมลที่ AI ร่างไว้ให้</p>
        </div>
        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
          {drafts.length} Pending
        </div>
      </div>

      <div className="space-y-4">
        {drafts.map((draft) => {
          const isProcessing = actionLoading === draft.id;
          
          return (
            <div key={draft.id} className="p-5 bg-white border rounded-xl shadow-sm space-y-4">
              {/* ส่วนหัวอีเมล */}
              <div className="border-b pb-3">
                <h3 className="font-semibold text-lg text-slate-900">Re: {draft.subject}</h3>
                <div className="flex gap-4 mt-2 text-sm text-slate-600">
                  {draft.suggestedDate && (
                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                      📅 {new Date(draft.suggestedDate).toLocaleString('th-TH')}
                    </span>
                  )}
                  {draft.location && (
                    <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md">
                      📍 {draft.location}
                    </span>
                  )}
                </div>
              </div>

              {/* ส่วนแก้ไขข้อความ */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Draft Message (แก้ไขได้):</label>
                <Textarea
                  value={editingText[draft.id] || ""}
                  onChange={(e) => handleTextChange(draft.id, e.target.value)}
                  className="min-h-[150px] font-sans"
                  placeholder="ข้อความตอบกลับ..."
                />
              </div>

              {/* ปุ่ม Action */}
              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleAction(draft.id, "reject")}
                  disabled={isProcessing}
                >
                  Reject (ลบทิ้ง)
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleAction(draft.id, "send")}
                  disabled={isProcessing || !editingText[draft.id]?.trim()}
                >
                  {isProcessing ? "กำลังส่ง..." : "Approve & Send"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}