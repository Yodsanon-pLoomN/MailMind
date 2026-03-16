"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SideNavbar }  from "@/components/SideNavbar";
import GmailProfileCard from "@/components/Profile";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("app_token");

    if (!token) {
      router.replace("/login");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Token หมดอายุหรือไม่ถูกต้อง");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        localStorage.removeItem("app_token");
        router.replace("/login");
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
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