'use client';

type UserProfileProps = {
  user: { name: string; email: string; picture: string };
  onLogout: () => void;
};

export default function UserProfile({ user, onLogout }: UserProfileProps) {
  return (
    <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', maxWidth: '400px' }}>
      <h2>ยินดีต้อนรับ, {user.name} 👋</h2>
      <p>อีเมล: {user.email}</p>
      
      <br /><br />
      <button onClick={onLogout} style={{ padding: '10px 20px', cursor: 'pointer', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
        Logout
      </button>
    </div>
  );
}