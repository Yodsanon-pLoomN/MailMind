"use client";

import Image from 'next/image';
import { useAuth } from '@/provider/AuthProvider'; // ✅ นำเข้า Hook จาก Context ที่เราสร้างไว้

// ✅ ไม่ต้องรับ Props { user } แล้ว เพราะเราจะดึงจาก Context แทน
export default function Navbar() {
  // ✅ ดึงข้อมูล user และฟังก์ชัน logout ออกมาใช้งานได้เลย
  const { user, logout } = useAuth();

  // กันเหนียว เผื่อ user ยังโหลดไม่มา
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
          <div className="flex items-center gap-4">
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
                className="rounded-full object-cover"
              />
            )}

            {/* ✅ เรียกใช้ฟังก์ชัน logout จาก Context ได้ทันที */}
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