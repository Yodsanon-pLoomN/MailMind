'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SuccessHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('app_token', token);
      router.replace('/');
    } else {
      router.replace('/?error=invalid_token');
    }
  }, [router, searchParams]);

  return <p>กำลังเข้าสู่ระบบและยืนยันข้อมูล...</p>;
}

export default function LoginSuccess() {
  return (
    <div style={{ padding: '50px' }}>
      <Suspense fallback={<p>Loading...</p>}>
        <SuccessHandler />
      </Suspense>
    </div>
  );
}