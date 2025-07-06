import { useState } from 'react';
import { signUp } from '@/lib/auth/signup';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      await signUp(email, password);
      setMessage('สมัครเรียบร้อย! กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาด');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto">
      <input
        type="email"
        placeholder="อีเมล"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border px-3 py-2 w-full"
        required
      />
      <input
        type="password"
        placeholder="รหัสผ่าน"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border px-3 py-2 w-full"
        required
      />
      <button type="submit" className="bg-green-600 text-white px-4 py-2 w-full">
        สมัครสมาชิก
      </button>
      {message && <p className="text-green-600">{message}</p>}
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}
