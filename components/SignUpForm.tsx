// components/SignUpForm.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/utils/supabase/client'
import { useUser } from '@/contexts/UserContext'
import Image from 'next/image'
import Link from 'next/link'

export default function SignUpForm() {
  const router = useRouter()
  const supabase = createClient()
  const { setProfile } = useUser()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError || !data.session?.user) {
      setError(signUpError?.message || 'สมัครสมาชิกไม่สำเร็จ')
      return
    }

    const user = data.session.user

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile || profileError) {
      setError('ไม่พบข้อมูลผู้ใช้ในระบบ')
      return
    }

    setProfile({ id: user.id, email: user.email, ...profile })

    router.replace('/dashboard')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-8 rounded-lg shadow max-w-sm w-full space-y-5"
    >
      <div className="flex flex-col items-center space-y-2 mb-2">
        <Image src="/logo.png" alt="DocDuty Logo" width={120} height={120} priority />
        <h1 className="text-2xl font-bold text-gray-800">สมัครสมาชิก</h1>
      </div>

      <input
        type="email"
        placeholder="อีเมล"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border px-4 py-2 rounded w-full"
        required
      />

      <input
        type="password"
        placeholder="รหัสผ่าน"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border px-4 py-2 rounded w-full"
        required
      />

      <button
        type="submit"
        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded w-full"
      >
        สมัครสมาชิก
      </button>

      {error && <p className="text-red-600 text-center text-sm">{error}</p>}

      <p className="text-center text-sm text-gray-600">
        มีบัญชีอยู่แล้ว?{' '}
        <Link href="/signin" className="text-blue-600 hover:underline">
          เข้าสู่ระบบ
        </Link>
      </p>
    </form>
  )
}
