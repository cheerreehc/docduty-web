// pages/signup.tsx
import Link from 'next/link'
import Image from 'next/image'
import SignUpForm from '@/components/SignUpForm'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import { GetServerSideProps } from 'next'
import { CalendarDays, Zap, Users } from 'lucide-react'

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createServerSupabaseClient(ctx)
  const { data } = await supabase.auth.getSession()

  if (data.session) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}

const ValueProposition = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <li className="flex items-center gap-4">
    <div className="bg-white/20 p-2 rounded-full">
      {icon}
    </div>
    <span className="text-lg">{text}</span>
  </li>
);

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen font-sans">
      {/* Left Panel: Value Proposition */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#008191] to-[#00677F] text-white p-12 flex-col justify-between">
        <div>
          <Link href="/">
            <Image
              src="/logo-docduty-white.png" // โลโก้สีขาวสำหรับพื้นหลังเข้ม
              alt="DocDuty Logo"
              width={140}
              height={40}
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/140x40/FFFFFF/008191?text=DocDuty' }}
            />
          </Link>
          <div className="mt-20 space-y-8">
            <h1 className="text-4xl font-bold leading-tight">
              เปลี่ยนเรื่องจัดเวรที่วุ่นวาย<br />ให้เป็นเรื่องง่ายสำหรับคุณหมอ
            </h1>
            <ul className="space-y-5">
              <ValueProposition icon={<CalendarDays size={24} />} text="เห็นภาพรวมตารางเวรทั้งหมดในที่เดียว" />
              <ValueProposition icon={<Users size={24} />} text="แลกเวรสะดวก แจ้งเตือนอัตโนมัติ" />
              <ValueProposition icon={<Zap size={24} />} text="ลดความผิดพลาด เพิ่มเวลาให้คุณ" />
            </ul>
          </div>
        </div>
        <p className="text-sm text-white/70">© 2025 DocDuty. All rights reserved.</p>
      </div>

      {/* Right Panel: Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-8 lg:p-12">
        <div className="w-full max-w-md">
          
          {/* 👇 *** จุดที่แก้ไข: เพิ่มโลโก้เข้ามาตรงนี้ *** 👇 */}
          <div className="mb-8 text-center">
             <Link href="/">
              <Image
                src="/logo-docduty.png" // ใช้โลโก้ไฟล์เดียวกับหน้า Sign In
                alt="DocDuty Logo"
                width={140}
                height={40}
                className="mx-auto"
                onError={(e) => { e.currentTarget.src = 'https://placehold.co/140x40/008191/FFFFFF?text=DocDuty' }}
              />
            </Link>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 text-center">
            สร้างบัญชีใหม่
          </h2>
          <p className="mt-2 text-gray-600 text-center">
            มีบัญชีอยู่แล้ว?{' '}
            <Link href="/signin" className="font-semibold text-[#008191] hover:underline">
              เข้าสู่ระบบที่นี่
            </Link>
          </p>
          <div className="mt-8">
            <SignUpForm />
          </div>
        </div>
      </div>
    </div>
  )
}