// components/SignInForm.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';
import { signIn } from '@/lib/auth/signin';
import Link from 'next/link';
import Image from 'next/image';

export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      await signIn(email, password,rememberMe);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-lg shadow max-w-sm w-full space-y-5"
    >
      <div className="flex flex-col items-center space-y-2 mb-2">
        <Image
          src="/logo.png"
          alt="DocDuty Logo"
          width={120}
          height={120}
          priority
        />
        <h1 className="text-2xl font-bold text-gray-800">เข้าสู่ระบบ</h1>
      </div>

      <input
        type="email"
        placeholder="อีเมล"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border px-4 py-2 rounded w-full focus:outline-none focus:ring focus:border-blue-300"
        required
      />

      <input
        type="password"
        placeholder="รหัสผ่าน"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border px-4 py-2 rounded w-full focus:outline-none focus:ring focus:border-blue-300"
        required
      />

       <label className="flex items-center space-x-2 text-sm">
        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
        />
        <span>จดจำฉันไว้</span>
      </label>

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded w-full transition"
      >
        เข้าสู่ระบบ
      </button>

      {error && <p className="text-red-600 text-center text-sm">{error}</p>}

      <p className="text-center text-sm text-gray-600">
        ยังไม่มีบัญชี?{' '}
        <Link href="/signup" className="text-blue-600 hover:underline">
          สมัครสมาชิก
        </Link>
      </p>
    </form>
  );
}
