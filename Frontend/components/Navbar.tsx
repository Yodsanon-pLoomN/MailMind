"use client";

import Image from 'next/image';
import Link from 'next/link'; // 🌟 นำเข้า Link สำหรับปุ่ม Login
import { useAuth } from '@/provider/AuthProvider';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isAiActive, setIsAiActive] = useState<boolean | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const token = localStorage.getItem("app_token");
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data && data.setting && typeof data.setting.isAutoReplyActive !== 'undefined') {
            setIsAiActive(data.setting.isAutoReplyActive);
          }
        } else {
          console.error("Failed to fetch settings, Status:", res.status);
        }
      } catch (error) {
        console.error('Failed to fetch AI status:', error);
      }
    };

    if (user) fetchStatus();
  }, [user, API_BASE]);

if (pathname === '/login') {
    return null;
  }

if (pathname === '/terms') {
    return null;
  }

  const handleToggleCron = async () => {
    if (isToggling || isAiActive === null) return;
    setIsToggling(true);
    
    const oldValue = isAiActive;
    const newValue = !isAiActive;
    setIsAiActive(newValue); 

    try {
      const token = localStorage.getItem('app_token');
      const response = await fetch(`${API_BASE}/api/settings/toggle-cron`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isAutoReplyActive: newValue })
      });

      if (!response.ok) throw new Error('Update failed in Database');
      
    } catch (error) {
      console.error(error);
      setIsAiActive(oldValue); 
      alert('ไม่สามารถเปลี่ยนสถานะผู้ช่วย AI ได้');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              MailMind
            </Link>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            
            {user ? (
              <>
                <div className="flex items-center gap-2 border-r border-gray-200 pr-4 sm:pr-6 sm:flex">
                  <span className={`text-sm font-medium transition-colors ${
                    isAiActive === null ? 'text-gray-300' : isAiActive ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {isAiActive === null ? 'Checking...' : isAiActive ? 'AI Active' : 'AI Paused'}
                  </span>
                  <button
                    onClick={handleToggleCron}
                    disabled={isToggling || isAiActive === null}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      isAiActive ? 'bg-green-500' : 'bg-gray-300'
                    } ${(isToggling || isAiActive === null) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isAiActive ? "ปิดระบบตอบรับอัตโนมัติ" : "เปิดระบบตอบรับอัตโนมัติ"}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isAiActive ? 'translate-x-6' : 'translate-x-1'
                      } shadow-sm`}
                    />
                  </button>
                </div>

                {/* โปรไฟล์ User */}
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

                {/* ปุ่ม Sign Out */}
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                  เข้าสู่ระบบ (Login)
                </Link>
              </>
            )}
            
          </div>
        </div>
      </div>
    </nav>
  );
}