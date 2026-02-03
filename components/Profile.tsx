// components/GmailProfileCard.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { NavbarProps } from "@/lib/utils";

export default  function GmailProfileCard({ user }: NavbarProps) {

  return (
    <div className="bg-white p-5 flex flex-col items-center text-center gap-3">
      {/* รูปภาพ */}
      {user.image ? (
        <Image
          src={user.image}
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

      {/* ชื่อ */}
      <p className="text-base font-medium text-gray-900 mt-1">
        {user.name || "Unnamed User"}
      </p>

      {/* อีเมล */}
      <p className="text-sm text-gray-500">
        {user.email || "No email connected"}
      </p>
    </div>
  );
}
