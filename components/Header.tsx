// components/Header.tsx
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { HiOutlineMenuAlt2 } from "react-icons/hi";
import { createClient } from '@/utils/supabase/client'
import { useUser } from "@/contexts/UserContext";


export default function Header() {
  const supabase = createClient()
  const { profile, loading } = useUser()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  useEffect(() => {
    console.log("📦 Header profile:", profile)
  }, [profile])

  useEffect(() => {
  }, [loading])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="fixed top-4 inset-x-0 z-10 flex justify-center">
      <div className="w-full max-w-6xl bg-white/90 backdrop-blur-md shadow-lg rounded-full px-6 py-3 flex items-center justify-between border border-gray-200">

        {/* Left: Logo + Greeting */}
        <div className="flex items-center space-x-3">
          <Link href={loading ? "#" : profile ? "/dashboard" : "/signin"}>
            <Image
              src="/logo-docduty.png"
              alt="DocDuty Logo"
              width={60}
              height={24}
              className="h-auto w-auto"
            />
          </Link>
          <div className="leading-tight text-sm">
            <p className="font-semibold text-gray-500">👋 สวัสดีคุณหมอ !</p>
            <p className="text-gray-500">📅 {today}</p>
          </div>
        </div>

        {/* Right: Avatar + ชื่อเล่น + เมนู */}
        <div className="flex items-center gap-4">
          {profile && (
            <Link href="/profile" className="cursor-pointer">
              <div className="flex items-center gap-1 bg-[#e5faff] px-1 pr-2 py-1 rounded-full border border-[#aef0ff] hover:bg-[#bbf3ff]">
                <Image
                  src={profile.avatar_url || "/default-avatar.png"}
                  alt="Doctor Avatar"
                  width={32}
                  height={32}
                  className="rounded-full object-cover w-[32px] h-[32px]"
                />
                <span className="text-sm font-regular text-[#00677F]">
                  👋 Hi, {profile.nickname}
                </span>
              </div>
            </Link>
          )}

          {/* เมนู Dropdown */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setIsOpen((prev) => !prev)}
              className="flex items-center gap-3 px-4 py-2 rounded-full text-white bg-[#00677F] hover:bg-[#45808d] text-sm font-semibold shadow transition"
            >
              <HiOutlineMenuAlt2 className="text-lg" />
              เมนู
            </button>
            {isOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-xl py-2 z-20">
                <Link href="/calendar" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]">
                  📅 ตารางเวร
                </Link>
                <Link href="/members" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]">
                  👩‍⚕️ หมอทั้งหมด
                </Link>
                <Link href="/dutytype" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]">
                  ⚙️ ประเภทเวร
                </Link>
                {/* <Link href="/stats" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]">
                  📊 สถิติเวร
                </Link> */}
                <button
                  onClick={async () => {
                    await supabase.auth.signOut()
                    window.location.href = "/signin"
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  🚪 ออกจากระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
