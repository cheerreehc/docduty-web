// pages/index.tsx
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8 py-12">
        <h1 className="text-4xl font-bold text-gray-800">👨‍⚕️ DocDuty</h1>
        <p className="text-lg text-gray-600">
          ระบบจัดตารางเวรสำหรับทีมแพทย์ ใช้งานง่ายบนเว็บและมือถือ
        </p>

        <div className="space-x-4">
          <Link href="/register">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">
              สมัครใช้งานฟรี
            </button>
          </Link>

          <Link href="/signin">
            <button className="border border-blue-600 text-blue-600 px-6 py-2 rounded-md hover:bg-blue-100 transition">
              เข้าสู่ระบบ
            </button>
          </Link>
        </div>

        <p className="text-sm text-gray-400 pt-8">
          DocDuty © {new Date().getFullYear()} – จัดเวรง่ายในคลิกเดียว
        </p>
      </div>
    </div>
  )
}
