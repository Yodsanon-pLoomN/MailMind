"use client";

import * as React from "react";
import Image from "next/image";

// กำหนด Type ให้ตรงกับที่ Backend ของเราส่งมา
export interface UserProfileProps {
  user: {
    name: string;
    email: string;
    picture?: string; // เปลี่ยนจาก image เป็น picture
  } | null;
}

export default function GmailProfileCard({ user }: UserProfileProps) {
  // ถ้ายังไม่มีข้อมูล user ให้ซ่อนไว้ก่อน หรือจะใส่เป็น Skeleton Loading ก็ได้ครับ
  if (!user) return null; 

  return (
    <div className="bg-white p-5 flex flex-col items-center text-center gap-3 rounded-xl shadow-sm border">
      {/* รูปภาพ */}
      {user.picture ? (
        <Image
          src={user.picture}
          alt={user.name || "User"}
          width={80}
          height={80}
          className="rounded-full border object-cover"
        />
      ) : (
        <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xl font-semibold">
          {(user.name || user.email || "U").charAt(0).toUpperCase()}
        </div>
      )}

      {/* ข้อมูล */}
      <div>
        <p className="text-base font-medium text-gray-900 mt-1">
          {user.name || "Unnamed User"}
        </p>
        <p className="text-sm text-gray-500">
          {user.email || "No email connected"}
        </p>
      </div>
    </div>
  );
}