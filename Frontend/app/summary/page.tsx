"use client";

import { SideNavbar } from "@/components/SideNavbar";
import Navbar from "@/components/Navbar";
import SummaryView from "@/components/SummaryView"; // ✅ Import Component ที่เพิ่งสร้าง
import { useAuth } from "@/provider/AuthProvider";

export default function SummaryPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center">กำลังโหลด...</div>;
  if (!user) return null;

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="md:flex md:gap-6 items-start space-y-6 md:space-y-0">
          <SideNavbar />

          <main className="flex-1 drop-shadow-lg min-w-0">
            <section className="bg-white rounded-lg shadow p-6 min-h-[70vh] flex flex-col">
              {/* ✅ ใส่หัวข้อ <h1> ตามเทมเพลตของคุณ */}
              <h1 className="text-3xl font-bold mb-2">Schedule Summary</h1>
              
              {/* ✅ เรียกใช้ Component */}
              <SummaryView />
              
            </section>
          </main>
        </div>
      </div>
    </>
  );
}