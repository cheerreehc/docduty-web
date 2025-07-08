// pages/index.tsx
import Link from 'next/link'
import Image from 'next/image';
import FooterMessage from '@/components/FooterMessage'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-animated flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8 py-12">
        <div className="flex flex-col items-center space-y-2 mb-8">
                <Image
                  src="/logo.png"
                  alt="DocDuty Logo"
                  width={200}
                  height={200}
                  priority
                />
              </div>
          <h1 className="font-round text-3xl "> ระบบจัดตารางเวรสำหรับทีมแพทย์ ใช้งานง่ายบนเว็บและมือถือ</h1>
          
        <div className="space-x-4">
          <Link href="/signup">
            <button className="font-round text-xl bg-[#008191] text-white px-6 py-2 rounded-md hover:bg-[#015A66] transition">
              สมัครใช้งานฟรี
            </button>
          </Link>

          <Link href="/signin">
            <button className="border text-xl border-[#008191] text-[#008191] px-6 py-2 rounded-md hover:bg-white transition">
              เข้าสู่ระบบ
            </button>
          </Link>
        </div>

        <div className="text-xl text-gray-400 pt-8 text-center">
          <p>DocDuty © {new Date().getFullYear()}</p>
          <FooterMessage />
        </div>
      </div>
    </div>
  )
}
