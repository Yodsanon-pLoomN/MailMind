'use client';

export default function LoginButton() {
  const handleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`;
  };

  return (
    <button onClick={handleLogin} style={{ padding: '10px 20px', cursor: 'pointer', background: '#4285F4', color: 'white', border: 'none', borderRadius: '4px' }}>
      Sign in with Google
    </button>
  );
}