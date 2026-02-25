"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/type";

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ สำคัญมาก: ต้องมีคำว่า "export" ตรงนี้
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("app_token");

      if (!token) {
        router.replace("/login");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Token invalid or expired");

        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error("Auth Error:", error);
        localStorage.removeItem("app_token");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [router]);

  const logout = () => {
    localStorage.removeItem("app_token");
    setUser(null);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {loading ? (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-xl text-gray-500 font-medium">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

// ✅ สำคัญมาก: ต้องมีคำว่า "export" ตรงนี้ด้วย
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}