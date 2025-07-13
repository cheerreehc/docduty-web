import { useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/utils/supabase/client'
import { useUser } from '@/contexts/UserContext'
import Image from 'next/image'
import Link from 'next/link'

type Props = {
  redirectedFrom?: string
}

export default function SignInForm({ redirectedFrom = '/' }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { setProfile } = useUser() // 👈 ใช้ setProfile โดยตรง
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError || !data.session?.user) {
      setError('ไม่พบข้อมูลผู้ใช้ในระบบ')
      return
    }

    const user = data.session.user

    // ✅ ดึงโปรไฟล์ทันที
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || profileError) {
      setError('ไม่พบข้อมูลผู้ใช้ในระบบ')
      return
    }

    // ✅ setProfile context ทันที
    setProfile({ id: user.id, email: user.email, ...profile })

    // 👉 ที่เหลือให้ signin.tsx จัดการ redirect ตามปกติ
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow max-w-sm w-full space-y-5">
      <div className="flex flex-col items-center space-y-2 mb-2">
        <Image src="/logo.png" alt="DocDuty Logo" width={120} height={120} priority />
        <h1 className="text-2xl font-bold text-gray-800">เข้าสู่ระบบ</h1>
      </div>

      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
        placeholder="อีเมล" className="border px-4 py-2 rounded w-full" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
        placeholder="รหัสผ่าน" className="border px-4 py-2 rounded w-full" />

      <label className="flex items-center space-x-2 text-sm">
        <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
        <span>จดจำฉันไว้</span>
      </label>

      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded w-full">
        เข้าสู่ระบบ
      </button>

      {error && <p className="text-red-600 text-center text-sm">{error}</p>}

      <p className="text-center text-sm text-gray-600">
        ยังไม่มีบัญชี?{' '}
        <Link href="/signup" className="text-blue-600 hover:underline">สมัครสมาชิก</Link>
      </p>
    </form>
  )
}
