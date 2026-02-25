"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SideNavbar }  from "@/components/SideNavbar";
import Navbar from "@/components/Navbar";
import GmailProfileCard from "@/components/Profile"; // หรือ path เดิมของคุณ
// import {mockUser} from "@/lib/mock"; // ไม่ได้ใช้แล้ว เอาออกได้เลยครับ

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. ดึง Token จาก Local Storage
    const token = localStorage.getItem("app_token");

    // 2. ถ้าไม่มี Token ให้เตะกลับไปหน้า Login ทันที
    if (!token) {
      router.replace("/login");
      return;
    }

    // 3. ถ้ามี Token ให้ยิงไปถาม Backend ว่า Token นี้ของใคร
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Token หมดอายุหรือไม่ถูกต้อง");
        return res.json();
      })
      .then((data) => {
        // นำข้อมูลจริงมาใส่ใน State
        setUser(data.user);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        // ถ้า Token พัง ให้ลบทิ้งแล้วพาไปหน้า Login
        localStorage.removeItem("app_token");
        router.replace("/login");
      });
  }, [router]);

  // ระหว่างที่กำลังโหลดข้อมูล ให้แสดงหน้าโหลดว่างๆ ไปก่อน (กันเลย์เอาต์กระพริบ)
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // ถ้าโหลดเสร็จแล้วไม่มี user (กำลังจะ redirect) ให้คืนค่า null
  if (!user) return null;

  return (
    <>
      {/* โยนข้อมูล user จริงเข้า Navbar */}
      <Navbar/>
      
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="md:flex md:gap-6 items-start space-y-6">
          <SideNavbar />

          <main className="flex-1 drop-shadow-lg">
            <section className="bg-white rounded-lg shadow p-6 min-h-[70vh]">
              <h1 className="text-3xl font-bold mb-6">Profile</h1>
              
              {/* โยนข้อมูล user จริงเข้า Profile Card */}
              <GmailProfileCard user={user} />
              
            </section>
          </main>
        </div>
      </div>
    </>
  );
}