import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'sonner' // หรือไลบรารี Toast ที่คุณใช้
import Image from 'next/image'

export default function AuthConfirmedPage() {
  const router = useRouter()

  useEffect(() => {
    // แสดง Toast แจ้งเตือนว่าสำเร็จ
    toast.success('ยืนยันอีเมลสำเร็จ!', {
      description: 'กำลังนำคุณไปยังหน้า Dashboard...',
    })

    // หน่วงเวลาเล็กน้อยแล้วค่อยส่งไปหน้า Dashboard
    // เพื่อให้ผู้ใช้เห็น Toast และให้แอปมีเวลาซิงค์ Session
    const timer = setTimeout(() => {
      router.replace('/dashboard')
    }, 2000) // 2 วินาที

    return () => clearTimeout(timer) // Clear timer ถ้า component unmount ก่อน
  }, [router])

  // UI ของหน้านี้จะเป็นหน้า Loading ง่ายๆ
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
      <Image
        src="/logo-docduty.png"
        alt="Loading"
        width={120}
        height={120}
        className="animate-bounce"
      />
    </div>
  )
}