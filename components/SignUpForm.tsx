import { useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/utils/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

export default function SignUpForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const supabase = createClient()
  const [message, setMessage] = useState('')

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('') // เคลียร์ข้อความเก่า
    
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    })

    setLoading(false)

    if (error) {
      setError('สมัครไม่สำเร็จ: ' + error.message)
    } else if (data.user) {
      // สมัครสำเร็จ! แสดงข้อความบอกให้ไปเช็กอีเมล
      setMessage('สมัครสมาชิกสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี')
    }
  }

  return (
    <form onSubmit={handleSignUp} className="space-y-6">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          อีเมล
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#008191] sm:text-sm"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          รหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร)
        </label>
        <div className="mt-1 relative">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#008191] sm:text-sm"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

       {/* บรรทัดสำหรับแสดง Error */}
      {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

      {/* บรรทัดสำหรับแสดงข้อความแจ้งเตือนเมื่อสำเร็จ */}
      {message && <p className="text-green-600 text-sm font-medium">{message}</p>}


      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
        >
          {loading ? 'กำลังสมัคร...' : 'สร้างบัญชี'}
        </button>
      </div>
    </form>
  )
}
