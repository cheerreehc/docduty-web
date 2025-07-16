// components/Header.tsx
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { HiOutlineMenuAlt2 } from "react-icons/hi";
import { createClient } from '@/utils/supabase/client';
import { useUser } from "@/contexts/UserContext";
import { useWorkspace } from "@/contexts/WorkspaceContext"; // Import useWorkspace
import { ChevronDown, Check } from "lucide-react";

export default function Header() {
  const supabase = createClient();
  const { profile, loading } = useUser();
  // ดึง memberships จาก useWorkspace
  const { currentWorkspace, memberships, switchWorkspace } = useWorkspace(); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);

  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // --- Logic สำหรับปิดเมนูเมื่อคลิกข้างนอก ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ตรวจสอบว่าผู้ใช้มี Workspace อย่างน้อยหนึ่งอันหรือไม่
  const hasWorkspaces = memberships.length > 0;

  return (
    <header className="fixed top-4 inset-x-0 z-10 flex justify-center">
      <div className="w-full max-w-6xl bg-white/90 backdrop-blur-md shadow-lg rounded-full px-6 py-3 flex items-center justify-between border border-gray-200">

        {/* Left: Logo + Greeting */}
        <div className="flex items-center space-x-4">
          <Link href={loading ? "#" : profile ? "/dashboard" : "/signin"}>
            <Image
              src="/logo-docduty.png"
              alt="DocDuty Logo"
              width={80}
              height={32}
              className="h-auto"
            />
          </Link>
          <div className="hidden md:block leading-tight text-sm border-l border-gray-200 pl-4">
            <p className="font-semibold text-gray-600">👋 สวัสดีคุณหมอ !</p>
            <p className="text-gray-500">📅 {today}</p>
          </div>
        </div>

        {/* Right: Workspace Switcher + Profile + Menu */}
        <div className="flex items-center gap-3">
          {/* ปุ่มสลับ Workspace - แสดงเฉพาะเมื่อมี Workspace */}
          {profile && currentWorkspace && hasWorkspaces && (
            <div ref={switcherRef} className="relative">
              <button
                onClick={() => setIsSwitcherOpen(prev => !prev)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition"
              >
                <span className="font-semibold text-sm text-gray-800 truncate max-w-[150px]">{currentWorkspace.name}</span>
                <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
              </button>
              {isSwitcherOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white shadow-lg rounded-xl py-2 z-20 border">
                  <div className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase">สลับ Workspace</div>
                  {memberships.map(m => (
                    <button
                      key={m.workspaces.id}
                      onClick={() => {
                        switchWorkspace(m.workspaces.id);
                        setIsSwitcherOpen(false);
                      }}
                      className="w-full text-left flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]"
                    >
                      <span>{m.workspaces.name}</span>
                      {currentWorkspace.id === m.workspaces.id && <Check size={16} className="text-green-500" />}
                    </button>
                  ))}
                  <div className="border-t my-1"></div>
                  <Link href="/create-workspace" className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]">
                    + สร้าง Workspace ใหม่
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Profile Avatar */}
          {profile && (
            <Link href="/profile" className="cursor-pointer">
              <div className="flex items-center gap-2 bg-[#e5faff] px-2 py-1.5 rounded-full border border-transparent hover:border-[#aef0ff] transition">
                <Image
                  src={profile.avatar_url || "/icon.png"}
                  alt="Doctor Avatar"
                  width={38}
                  height={38}
                  className="rounded-full object-cover w-[32px] h-[32px]" 
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/25x25/008191/FFFFFF?text=D' }} 
                />
                <span className="hidden sm:block text-sm font-medium text-[#00677F]">
                  {profile.nickname || profile.email?.split('@')[0]}
                </span>
              </div>
            </Link>
          )}

          {/* เมนู Dropdown */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-2 rounded-full text-white bg-[#00677F] hover:bg-[#015A66] text-sm font-semibold shadow transition"
            >
              <HiOutlineMenuAlt2 className="text-lg" />
              <span className="hidden sm:block">เมนู</span>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-xl py-2 z-20 border">
                {/* แสดงเมนูย่อยเฉพาะเมื่อมี Workspace */}
                {hasWorkspaces && (
                  <>
                    <Link href="/calendar" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]">
                      📅 ตารางเวร
                    </Link>
                    <Link href="/members" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]">
                      👩‍⚕️ หมอทั้งหมด
                    </Link>
                    <Link href="/dutytype" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]">
                      ⚙️ ประเภทเวร
                    </Link>
                    <div className="border-t my-1"></div>
                  </>
                )}
                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/signin";
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
