import { signOut } from '@/lib/auth';
import Image from 'next/image';
import { NavbarProps } from '@/lib/utils';

export default function Navbar({ user }: NavbarProps) {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* ✅ เพิ่ม justify-between เพื่อให้ MailMind ชิดซ้าย / Profile ชิดขวา */}
        <div className="flex items-center justify-between h-16">
          
          {/* ด้านซ้าย */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">MailMind</h1>
          </div>

          {/* ด้านขวา */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>

            {user.image && (
              <Image
                src={user.image}
                alt={user.name || 'User'}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}

            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
