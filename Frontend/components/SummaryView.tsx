"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calendar, CalendarDays, CalendarRange, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export default function SummaryView() {
  const [activeTab, setActiveTab] = React.useState<TabType>('DAILY');
  const [loading, setLoading] = React.useState(false);
  const [summary, setSummary] = React.useState<string | null>(null);

 const fetchSummary = async (type: TabType, forceNew: boolean = false) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('app_token');
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      const res = await fetch(`${API_BASE}/api/summary?type=${type}&force=${forceNew}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to fetch summary');
      
      const data = await res.json();
      setSummary(data.content);
    } catch (error) {
      console.error(error);
      setSummary("เกิดข้อผิดพลาดในการดึงข้อมูลสรุป โปรดลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSummary(activeTab, false);
  }, [activeTab]);

  const handleRegenerate = () => {
    fetchSummary(activeTab, true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* ส่วนหัว: คำอธิบาย + ปุ่มสรุปใหม่ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <p className="text-sm text-gray-500">สรุปตารางงานและสิ่งที่ต้องทำจากปฏิทิน</p>
        
        <Button 
          onClick={handleRegenerate} 
          disabled={loading}
          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-sm"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          สรุปใหม่
        </Button>
      </div>

      {/* โซน Tabs */}
      <div className="flex p-1 bg-gray-100/80 rounded-lg w-fit mb-6">
        <button
          onClick={() => setActiveTab('DAILY')}
          className={cn(
            "flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-md transition-all",
            activeTab === 'DAILY' ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
          )}
        >
          <Calendar className="w-4 h-4" /> รายวัน
        </button>
        <button
          onClick={() => setActiveTab('WEEKLY')}
          className={cn(
            "flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-md transition-all",
            activeTab === 'WEEKLY' ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
          )}
        >
          <CalendarDays className="w-4 h-4" /> รายสัปดาห์
        </button>
        <button
          onClick={() => setActiveTab('MONTHLY')}
          className={cn(
            "flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-md transition-all",
            activeTab === 'MONTHLY' ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-900"
          )}
        >
          <CalendarRange className="w-4 h-4" /> รายเดือน
        </button>
      </div>

      {/* โซนแสดงเนื้อหา */}
      <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-6 relative overflow-hidden min-h-75">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-sm z-10">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium animate-pulse">✨ AI กำลังวิเคราะห์ตารางงานของคุณ...</p>
          </div>
        ) : (
          <div className="prose prose-blue max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 text-base leading-relaxed">
              {summary || "ไม่พบข้อมูลตารางงาน"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}