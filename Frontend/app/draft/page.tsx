"use client";

import { SideNavbar } from "@/components/SideNavbar";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/provider/AuthProvider";
import DraftList from "@/components/DraftList";

export default function DraftPage() {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex min-h-screen items-center justify-center">กำลังโหลด...</div>;
  if (!user) return null;

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="md:flex md:gap-6 items-start space-y-6">
          <SideNavbar />

          <main className="flex-1 drop-shadow-lg">
            <section className="bg-white rounded-lg shadow p-6 min-h-[70vh]">
              <h1 className="text-3xl font-bold mb-6">Drafts</h1>
              <DraftList />
            </section>
          </main>
        </div>
      </div>
    </>
  );
}