'use client';

import { useEffect, useState } from 'react';
import LoginButton from '@/components/LoginButton';
import UserProfile from '@/components/UserProfile';

export default function Home() {
  const [user, setUser] = useState<{ name: string; email: string; picture: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('app_token');
    
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error('Token invalid');
        return res.json();
      })
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('app_token');
        setLoading(false);
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('app_token');
    setUser(null);
  };

  if (loading) return <p style={{ padding: '50px' }}>Loading...</p>;

  return (
    <div style={{ padding: '50px', fontFamily: 'sans-serif' }}>
      <h1>Mailmind - เข้าสู่ระบบ</h1>
      {!user ? <LoginButton /> : <UserProfile user={user} onLogout={handleLogout} />}
    </div>
  );
}