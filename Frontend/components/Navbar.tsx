"use client";

import Image from 'next/image';
import { useAuth } from '@/provider/AuthProvider';
import { useState, useEffect } from 'react'; // ✅ เพิ่ม Hook สำหรับจัดการ State

export default function Navbar() {
  const { user, logout } = useAuth();
  
  // ✅ State สำหรับเก็บสถานะเปิด/ปิด AI และสถานะโหลด
  const [isAiActive, setIsAiActive] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // ✅ ดึงค่าสถานะเริ่มต้นจาก Database เมื่อโหลดหน้าเว็บ
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem("app_token");
        if (!token) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/setting`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.setting && data.setting.isAutoReplyActive !== undefined) {
            setIsAiActive(data.setting.isAutoReplyActive);
          }
        }
      } catch (error) {
        console.error('Failed to fetch AI status:', error);
      }
    };

    if (user) fetchStatus();
  }, [user]);

  // ✅ ฟังก์ชันสลับสถานะเมื่อกดปุ่ม
  const handleToggleCron = async () => {
    if (isToggling) return;
    setIsToggling(true);
    
    const newValue = !isAiActive;
    setIsAiActive(newValue); // เปลี่ยนสี UI ทันที (Optimistic Update)

    try {
      const token = localStorage.getItem('app_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/settings/toggle-cron`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAutoReplyActive: newValue })
      });

      if (!response.ok) throw new Error('Update failed');
      
    } catch (error) {
      console.error(error);
      setIsAiActive(!newValue); // ถ้า Error ให้ดีดสวิตช์กลับไปค่าเดิม
      alert('ไม่สามารถเปลี่ยนสถานะผู้ช่วย AI ได้');
    } finally {
      setIsToggling(false);
    }
  };

  if (!user) return null;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          
          {/* ด้านซ้าย */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">MailMind</h1>
          </div>

          {/* ด้านขวา */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* ✅ ส่วนควบคุมการเปิด-ปิด AI */}
            <div className="flex items-center gap-2 border-r border-gray-200 pr-4 sm:pr-6">
              <span className={`text-sm font-medium transition-colors ${isAiActive ? 'text-green-600' : 'text-gray-400'}`}>
                {isAiActive ? 'AI Active' : 'AI Paused'}
              </span>
              <button
                onClick={handleToggleCron}
                disabled={isToggling}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  isAiActive ? 'bg-green-500' : 'bg-gray-300'
                } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={isAiActive ? "ปิดระบบตอบรับอัตโนมัติ" : "เปิดระบบตอบรับอัตโนมัติ"}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAiActive ? 'translate-x-6' : 'translate-x-1'
                  } shadow-sm`}
                />
              </button>
            </div>

            {/* ข้อมูลผู้ใช้ */}
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>

            {user.picture && (
              <Image
                src={user.picture}
                alt={user.name || 'User'}
                width={40}
                height={40}
                className="rounded-full object-cover shadow-sm border border-gray-100"
              />
            )}

            <button
              onClick={logout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}