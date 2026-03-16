"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SideNavbar } from "@/components/SideNavbar";
import { useAuth } from "@/provider/AuthProvider";
import EmailList from "@/components/EmailList";

export default function DraftPage() {
  const { user, loading } = useAuth();
    const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) return <div className="flex min-h-screen items-center justify-center">กำลังโหลด...</div>;
  if (!user) return null;

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="md:flex md:gap-6 items-start space-y-6">
          <SideNavbar />

          <main className="flex-1 drop-shadow-lg">
            <section className="bg-white rounded-lg shadow p-6 min-h-[70vh]">
              <h1 className="text-3xl font-bold mb-6">Drafts</h1>
              <EmailList />
            </section>
          </main>
        </div>
      </div>
    </>
  );
}