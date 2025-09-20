"use client";
import Link from "next/link";
import { useState } from "react";

export default function Settings() {
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("17:00");
  const [meetingDuration, setMeetingDuration] = useState("30");
  const [buffer, setBuffer] = useState("15");
  const [autoSend, setAutoSend] = useState(false);

  const handleSave = () => {
    // TODO: ส่งค่าไปเก็บใน API/DB
    alert(
      JSON.stringify(
        {
          workStart,
          workEnd,
          meetingDuration,
          buffer,
          autoSend,
        },
        null,
        2
      )
    );
  };

  return (
    <div className="mx-auto max-w-screen-md px-4 py-6">
      <main className="flex-1 drop-shadow-lg">
        <section className="bg-white rounded-lg shadow p-6 min-h-[70vh]">
          <h1 className="text-3xl font-bold mb-8 text-center">Settings</h1>

          <div className="space-y-6">
            {/* Work Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Hours
              </label>
              <div className="flex space-x-4">
                <input
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm flex-1"
                />
                <span className="self-center text-gray-500">to</span>
                <input
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  className="border rounded-lg px-3 py-2 text-sm flex-1"
                />
              </div>
            </div>

            {/* Meeting Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Meeting Duration
              </label>
              <select
                value={meetingDuration}
                onChange={(e) => setMeetingDuration(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-full"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            {/* Buffer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buffer Time (minutes before/after)
              </label>
              <input
                type="number"
                min="0"
                value={buffer}
                onChange={(e) => setBuffer(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm w-full"
              />
            </div>

            {/* Auto Send */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium">Auto-Send Replies</h2>
                <p className="text-xs text-gray-500">
                  ส่งอีเมลอัตโนมัติเมื่อมั่นใจว่าถูกต้อง
                </p>
              </div>
              <button
                onClick={() => setAutoSend((s) => !s)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                  autoSend ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${
                    autoSend ? "translate-x-6" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Save */}
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>
          <div className="mt-8 flex justify-start">
          <Link
                 
                  href="/"
                  className=" flex  gap-3 px-3 py-2 rounded-lg hover:bg-[#E9ECEF] transition text-left"
                >
                  
                  <span className="font-medium">Back</span>
                </Link>
                </div>
        </section>
        
      </main>
      
      </div>
  );
}
