'use client';
import Link from 'next/link'
import React from 'react';

const items = [
  { label: 'Back', path: '/' },

];

export function Back() {
  return (
    <>
      {/* Mobile topbar */}
      <div className="md:hidden sticky top-0 z-40 bg-white backdrop-blur rounded-lg drop-shadow-lg  ">
        <div className="mx-auto max-w-screen-xl px-4 py-3 flex items-center justify-between">
          <div className='flex gap-10'>
            <div className='flex'>
          {items.map((it) => (
                <Link
                  key={it.label}
                  href={it.path}
                  className=" flex  gap-3 px-3 py-2 rounded-lg hover:bg-[#E9ECEF] transition text-left"
                >
                  
                  <span className="font-medium">{it.label}</span>
                </Link>
              ))}
              </div>
          </div>
        </div>
      </div>

      {/* Desktop left navbar */}
      <aside className="hidden sticky top-0 z-40 md:block w-[280px] shrink-0">
        <div className="sticky top-0">
          <div className="bg-white rounded-lg drop-shadow-lg p-3">
            <div className="px-3 py-2 mb-2 flex items-center gap-3">
            </div>

            <nav className="space-y-1">
              {items.map((it) => (
                <Link
                  key={it.label}
                  href={it.path}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition text-left"
                >
                  
                  <span className="font-medium">{it.label}</span>
                </Link>
              ))}

              <div className="my-2" />
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-gray-100 transition mt-10">
              </button>
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}
