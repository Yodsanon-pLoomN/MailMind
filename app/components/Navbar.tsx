'use client';
import React from 'react';

const items = [
  { label: 'Inbox'},
  { label: 'Settings' },
];

export function Navbar() {
  return (
    <>
      {/* Mobile topbar */}
      <div className="md:hidden sticky top-0 z-40 bg-white backdrop-blur rounded-sm drop-shadow-lg  ">
        <div className="mx-auto max-w-screen-xl px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">MailMind</div>
          <div className='flex gap-10'>
            <div className='flex'>
          {items.map((it) => (
                <button
                  key={it.label}
                  className=" flex  gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition text-left"
                >
                  
                  <span className="font-medium">{it.label}</span>
                </button>
              ))}
              </div>
          <button className="px-3 py-1 rounded-lg hover:bg-gray-100 transition text-left">Profile</button>
          </div>
        </div>
      </div>

      {/* Desktop left navbar */}
      <aside className="hidden sticky top-0 z-40 md:block w-[280px] shrink-0">
        <div className="sticky top-0">
          <div className="bg-white rounded-sm drop-shadow-lg p-3">
            <div className="px-3 py-2 mb-2 flex items-center gap-3">
              
              <div className="font-bold text-lg">MailMind</div>
            </div>

            <nav className="space-y-1">
              {items.map((it) => (
                <button
                  key={it.label}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition text-left"
                >
                  
                  <span className="font-medium">{it.label}</span>
                </button>
              ))}

              <div className="my-2" />
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition mt-10">
                <span className="font-medium">Profile</span>
              </button>
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}
