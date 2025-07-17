// components/CalendarHeader.tsx
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { createClient } from '@/utils/supabase/client';
import { useUser } from "@/contexts/UserContext";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { ChevronDown, Check, Menu, Calendar, Users, Settings, LogOut, Plus } from "lucide-react";

export default function CalendarHeader() {
  const supabase = createClient();
  const { profile } = useUser();
  const { currentWorkspace, memberships, switchWorkspace } = useWorkspace();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasWorkspaces = memberships && memberships.length > 0;

  return (
    <div ref={menuRef} className="relative w-full flex justify-end">
      <button
        onClick={() => setIsMenuOpen(prev => !prev)}
        className="flex items-center gap-2 bg-[#008191] hover:bg-[#00677F] text-white shadow-md rounded-full px-4 py-2 transition-shadow"
      >
        <Menu size={20} className="text-white" />
        <span className="font-semibold text-sm">เมนู</span>
      </button>

      {isMenuOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white shadow-2xl rounded-xl py-2 z-20 border animate-in fade-in-0 zoom-in-95">
          {profile && (
            <div className="px-4 py-3 border-b flex items-center gap-3">
              <Image
                src={profile.avatar_url || "/icon.png"}
                alt="Avatar"
                width={70}
                height={70}
                className="rounded-full object-cover border-2 border-[#008191]"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/40x40/008191/FFFFFF?text=D' }}
              />
              <div className="flex flex-col">
                <p className="font-semibold text-gray-800 truncate">{profile.nickname || profile.first_name || profile.email?.split('@')[0]}</p>
                <p className="text-sm text-gray-500 truncate">{profile.email}</p>
                <Link href="/profile" className="text-sm text-[#008191] hover:underline mt-1">ดูโปรไฟล์</Link>
              </div>
            </div>
          )}

          {currentWorkspace && hasWorkspaces && (
            <div className="py-2 border-b">
              <div className="px-4 py-1 text-xs text-gray-400 font-semibold uppercase">Workspace</div>
               <div className="px-4 mt-1">
                  <div className="relative">
                    <div className="w-full flex items-center justify-between gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                      <span className="font-semibold text-sm text-gray-800 truncate">{currentWorkspace.name}</span>
                    </div>
                     <div className="mt-1 space-y-1">
                        {memberships.filter(m => m.workspaces.id !== currentWorkspace.id).map(m => (
                          <button
                            key={m.workspaces.id}
                            onClick={() => { if(switchWorkspace) { switchWorkspace(m.workspaces.id); } setIsMenuOpen(false); }}
                            className="w-full text-left flex items-center justify-between px-3 py-1.5 text-sm text-gray-700 hover:bg-[#E8FAFF] rounded-md"
                          >
                            <span>{m.workspaces.name}</span>
                          </button>
                        ))}
                      </div>
                  </div>
                   <Link href="/create-workspace" className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF] rounded-md mt-1">
                      <Plus size={16}/> สร้าง Workspace ใหม่
                    </Link>
               </div>
            </div>
          )}

          {hasWorkspaces && (
            <div className="py-2 border-b">
              <Link href="/calendar" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF] font-semibold text-[#00677F]">
                <Calendar size={18} /> ตารางเวร
              </Link>
              <Link href="/members" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]">
                <Users size={18} /> หมอทั้งหมด
              </Link>
              <Link href="/dutytype" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]">
                <Settings size={18} /> ประเภทเวร
              </Link>
            </div>
          )}

          <div className="py-2">
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/signin"; }}
              className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} /> ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
