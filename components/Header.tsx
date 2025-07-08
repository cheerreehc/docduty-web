import Link from "next/link";
import Image from "next/image";
import { HiOutlineMenuAlt2 } from "react-icons/hi";

export default function Header() {
    const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    });

  return (
    <header className="fixed top-4 inset-x-0 z-10 flex justify-center">
          <div className="w-full max-w-6xl bg-white/90 backdrop-blur-md shadow-lg rounded-full px-6 py-3 flex items-center justify-between border border-gray-200">
            {/* Left: Logo + Greeting */}
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Image
                  src="/logo-docduty.png"
                  alt="DocDuty Logo"
                  width={60}
                  height={24}
                  className="h-auto w-auto"
                />
              </Link>
              <div className="leading-tight text-sm">
                <p className="font-semibold">👋 สวัสดีคุณหมอ !</p>
                <p className="text-gray-500">📅 {today}</p>
              </div>
            </div>

          

            {/* ขวา: ปุ่มเมนู + Avatar */}
            <div className="flex items-center gap-4">
                {/* Avatar + ชื่อหมอ */}
                <div className="flex items-center gap-2 bg-[#F7FCFD] px-3 py-2 rounded-full shadow-sm">
                {/* <Image
                    src="/doctor-avatar.png"
                    alt="Doctor Avatar"
                    width={32}
                    height={32}
                    className="rounded-full object-cover"
                /> */}
                <span className="text-sm font-medium text-[#00677F]">หมอบุญกัญญา</span>
                </div>

                {/* เมนู Dropdown */}
                <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#F0FAFC] hover:bg-[#dff5f9] text-sm font-medium shadow transition">
                    <HiOutlineMenuAlt2 className="text-lg" />
                    เมนู
                </button>
                <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-xl py-2 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transform transition-all duration-300 ease-out pointer-events-none group-hover:pointer-events-auto z-20">
                    <Link href="/calendar" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]">📅 ตารางเวร</Link>
                    <Link href="/members" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]">👩‍⚕️ หมอทั้งหมด</Link>
                    <Link href="/dutytype" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]">⚙️ ประเภทเวร</Link>
                    <Link href="/stats" className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]">📊 สถิติเวร</Link>
                </div>
                </div>

            
          </div>
          </div>
        </header>

);}
       