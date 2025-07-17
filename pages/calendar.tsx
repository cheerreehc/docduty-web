// pages/calendar.tsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useDutyType } from '@/contexts/DutyTypeContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { useMember, MemberWithProfile } from '@/contexts/MemberContext';
import { useThaiHolidays } from '@/hooks/useThaiHolidays';
import { ChevronLeft, ChevronRight, Trash2, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/contexts/UserContext';

// --- Helper Functions ---
const getMemberDisplayName = (member: (MemberWithProfile | { profiles: any }) | undefined | null): string => {
  if (!member || !member.profiles) return 'ไม่ระบุ';
  const name = member.profiles.first_name || member.profiles.nickname || member.profiles.email?.split('@')[0] || 'ไม่ระบุ';
  const yearLevel = member.profiles.year_level;
  return yearLevel ? `${name} (${yearLevel})` : name;
};

const toYYYYMMDD = (date: Date): string => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
};

// --- Component ---
export default function CalendarPage() {
  // --- Hooks & State ---
  const { currentWorkspace, currentRole } = useWorkspace();
  const { dutyTypes } = useDutyType();
  const { schedules, loadSchedules, addSchedule, removeSchedule, updateSchedule } = useSchedule();
  const { members } = useMember();
  const { profile } = useUser();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClearMonthModalOpen, setIsClearMonthModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schedulePairs, setSchedulePairs] = useState<Map<string, string>>(new Map());

  const { holidaysMap } = useThaiHolidays(currentYear);
  const filteredMembers = useMemo(() => members.filter(member => getMemberDisplayName(member) !== 'ไม่ระบุ'), [members]);

  //  console.log("CalendarPage กำลัง re-render, จำนวน schedules:", schedules.length);

  // --- Effects & Memos ---
  useEffect(() => {
    // ✅ FIX: เพิ่มเงื่อนไข !profile เข้าไปในการตรวจสอบ
    if (!currentWorkspace?.id || !profile) {
      return; // ถ้าอย่างใดอย่างหนึ่งยังไม่พร้อม ให้ออกจากฟังก์ชันไปก่อน
    }

    // เมื่อทั้งสองอย่างพร้อมแล้วจึงเรียก loadSchedules
    loadSchedules(currentYear, currentMonth + 1);
    
  // ✅ FIX: เพิ่ม profile เข้าไปใน dependency array ด้วย
  }, [currentYear, currentMonth, currentWorkspace?.id, profile, loadSchedules]);


  const schedulesByDate = useMemo(() => schedules.reduce((acc, schedule) => {
    const dateKey = schedule.date.split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(schedule);
    return acc;
  }, {} as { [key: string]: any[] }), [schedules]);

  const memberDutySummary = useMemo(() => {
    if (!members.length) return [];
    const memberMap = new Map(members.map(m => [m.id, getMemberDisplayName(m)]));
    const summary = schedules.reduce((acc, schedule) => {
      const memberName = memberMap.get(schedule.member_id) || 'ไม่ระบุ';
      acc[memberName] = (acc[memberName] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    return Object.entries(summary).sort((a, b) => b[1] - a[1]);
  }, [schedules, members]);

  const daysInMonth = useMemo(() => {
    const date = new Date(currentYear, currentMonth, 1);
    const days = [];
    while (date.getMonth() === currentMonth) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentYear, currentMonth]);

  const leadingBlanksCount = useMemo(() => new Date(currentYear, currentMonth, 1).getDay(), [currentYear, currentMonth]);

  // --- Handlers (without useCallback for state-mutating functions) ---
  const goToPreviousMonth = useCallback(() => setCurrentMonth(m => m === 0 ? (setCurrentYear(y => y - 1), 11) : m - 1), []);
  const goToNextMonth = useCallback(() => setCurrentMonth(m => m === 11 ? (setCurrentYear(y => y + 1), 0) : m + 1), []);

  const handleDayClick = (date: Date) => {
    if (currentRole !== 'owner' && currentRole !== 'editor') return toast.error("คุณไม่มีสิทธิ์จัดเวร");
    const dateKey = toYYYYMMDD(date);
    setSelectedDate(dateKey);
    const todaysSchedules = schedulesByDate[dateKey] || [];
    const initialPairs = new Map<string, string>();
    todaysSchedules.forEach(s => initialPairs.set(s.duty_type_id, s.member_id));
    setSchedulePairs(initialPairs);
    setIsModalOpen(true);
  };

  const handlePairChange = (dutyTypeId: string, memberId: string) => {
    setSchedulePairs(prevPairs => {
      const newPairs = new Map(prevPairs);
      if (memberId === "NONE") {
        newPairs.delete(dutyTypeId);
      } else {
        newPairs.set(dutyTypeId, memberId);
      }
      return newPairs;
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedDate) return;
    setIsSubmitting(true);
    // const toastId = toast.loading("กำลังบันทึกการเปลี่ยนแปลง...");

    const originalSchedules = schedules.filter(s => s.date.startsWith(selectedDate));
    const originalPairs = new Map(originalSchedules.map(s => [s.duty_type_id, { memberId: s.member_id, scheduleId: s.id }]));
    
    const promises = [];
    // --- ส่วน Logic ในการหาว่าจะ Add, Update, หรือ Delete เหมือนเดิม ---
    for (const [dutyTypeId, memberId] of schedulePairs.entries()) {
      const original = originalPairs.get(dutyTypeId);
      if (original) {
        if (original.memberId !== memberId) promises.push(updateSchedule(original.scheduleId, memberId, dutyTypeId));
      } else {
        promises.push(addSchedule(selectedDate, memberId, dutyTypeId));
      }
    }
    for (const [dutyTypeId, { scheduleId }] of originalPairs.entries()) {
      if (!schedulePairs.has(dutyTypeId)) promises.push(removeSchedule(scheduleId));
    }
    // --- จบส่วน Logic ---

    const results = await Promise.all(promises);

    // ✅ FIX: แทนที่จะรอ loadSchedules อย่างเดียว เราจะ "บังคับ" อัปเดตข้อมูลในหน้าเว็บทันที
    // เพื่อให้ UI แสดงผลการเปลี่ยนแปลงทันทีโดยไม่ต้องรอ
    await loadSchedules(currentYear, currentMonth + 1);
    
    // toast.dismiss(toastId);

    if (results.some(res => !res)) {
      toast.error("เกิดข้อผิดพลาดบางอย่าง ไม่สามารถบันทึกได้ครบถ้วน");
    } else {
      toast.success("บันทึกการเปลี่ยนแปลงสำเร็จ!");
    }

    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleClearTodaysSchedules = async () => {
    if (!selectedDate) return;
    const todaysSchedules = schedules.filter(s => s.date.startsWith(selectedDate));
    if (todaysSchedules.length === 0) return toast.info("ไม่มีเวรให้ลบในวันนี้");
    setIsSubmitting(true);
    // const toastId = toast.loading("กำลังลบเวรของวันนี้...");
    await Promise.all(todaysSchedules.map(s => removeSchedule(s.id)));
    await loadSchedules(currentYear, currentMonth + 1);
    // toast.dismiss(toastId);
    toast.success("ลบเวรทั้งหมดของวันนี้สำเร็จ!");
    setSchedulePairs(new Map());
    setIsSubmitting(false);
  };

  const handleClearMonthSchedules = async () => {
    setIsClearMonthModalOpen(false);
    if (schedules.length === 0) return toast.info("ไม่มีเวรในเดือนนี้ให้ลบ");
    setIsSubmitting(true);
    // const toastId = toast.loading("กำลังลบเวรทั้งหมดของเดือนนี้...");
    await Promise.all(schedules.map(s => removeSchedule(s.id)));
    await loadSchedules(currentYear, currentMonth + 1);
    // toast.dismiss(toastId);
    toast.success("ลบเวรทั้งหมดในเดือนนี้สำเร็จ!");
    setIsSubmitting(false);
  };

  // --- Render ---
  return (
    <>
      <div className="min-h-screen bg-[#F7FCFD]">
        <Header />
        <main className="max-w-7xl mx-auto pt-28 sm:pt-32 px-4 pb-12">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
              <h1 className="text-2xl sm:text-3xl font-bold font-round mb-2 sm:mb-0">จัดตารางเวร</h1>
              <p className="text-gray-500 text-sm sm:text-base">Workspace: <strong>{currentWorkspace?.name || '...'}</strong></p>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 bg-gray-50 rounded-xl p-4 shadow-inner">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-200 transition"><ChevronLeft size={24} /></button>
                  <h2 className="text-xl font-semibold text-gray-800 text-center">{new Date(currentYear, currentMonth).toLocaleString('th-TH', { month: 'long', year: 'numeric' })}</h2>
                  <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-200 transition"><ChevronRight size={24} /></button>
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center font-medium text-gray-600 mb-2">
                  {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => <div key={day}>{day}</div>)}
                </div>
                {/* ✅ FIX: ตรวจสอบโครงสร้าง .map และการ return JSX */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {Array.from({ length: leadingBlanksCount }).map((_, i) => <div key={`blank-${i}`} className="aspect-square bg-gray-100 rounded-lg"></div>)}
                  {daysInMonth.map(date => {
                    const dateKey = toYYYYMMDD(date);
                    const dailySchedules = schedulesByDate[dateKey] || [];
                    const holidayName = holidaysMap.get(dateKey);
                    const isToday = toYYYYMMDD(new Date()) === dateKey;
                    
                    return (
                      <div key={dateKey} onClick={() => handleDayClick(date)}
                        className={`relative aspect-square p-1.5 rounded-lg border flex flex-col items-start justify-start overflow-auto cursor-pointer hover:bg-blue-50 transition-colors ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                        <span className={`text-sm font-semibold self-center ${holidayName ? 'text-red-600' : isToday ? 'text-blue-600' : 'text-gray-800'}`}>{date.getDate()}</span>
                        <div className="flex flex-col items-stretch gap-1 mt-1 w-full">
                          {dailySchedules.map(schedule => {
                            // ✅✅✅ FIX: จุดแก้ไขหลักอยู่ตรงนี้ ✅✅✅
                            // เราจะใช้ข้อมูล `schedule.members` ที่ join มาโดยตรง
                            // ไม่ต้องใช้ `members.find(...)` อีกต่อไป
                            const memberDisplayName = getMemberDisplayName(schedule.members);
                            
                            return (
                              <div 
                                key={schedule.id} 
                                className="px-1.5 py-0.5 rounded text-xs font-medium text-white max-w-full truncate text-left" 
                                style={{ backgroundColor: schedule.duty_types?.color || '#cccccc' }} 
                                title={memberDisplayName}
                              >
                                <span className='font-bold'>{schedule.duty_types?.name}:</span> {memberDisplayName}
                              </div>
                            );
                          })}
                        </div>
                        {holidayName && (
                          <div className="absolute bottom-1 left-1.5 right-1.5 px-1 text-center text-[10px] font-semibold text-red-700 bg-red-100 rounded-full truncate">
                            {holidayName}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <aside className="w-full lg:w-64 xl:w-72 bg-gray-50 rounded-xl p-4 shadow-inner flex-shrink-0">
                <div className='flex justify-between items-center mb-4'>
                    <h2 className="text-xl font-semibold text-gray-800">สรุปเวร</h2>
                    {(currentRole === 'owner' || currentRole === 'editor') &&
                        <button onClick={() => setIsClearMonthModalOpen(true)} disabled={isSubmitting} className="p-1.5 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 transition disabled:opacity-50" title="ล้างเวรทั้งหมดในเดือนนี้">
                            <Trash2 size={18} />
                        </button>
                    }
                </div>
                {memberDutySummary.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {memberDutySummary.map(([memberName, count]) => (
                      <div key={memberName} className="flex justify-between items-center text-gray-700">
                        <span className="truncate pr-2">{memberName}</span>
                        <span className="font-semibold flex-shrink-0">{count} เวร</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-500 text-sm">ยังไม่มีการจัดเวรในเดือนนี้</p>}
              </aside>
            </div>
          </div>
        </main>
      </div>
      
      {/* Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-lg space-y-5 animate-in fade-in-0 zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[#00677F]">จัดเวร {selectedDate ? new Date(selectedDate).toLocaleDateString('th-TH', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }) : ''}</h3>
              <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="p-1 rounded-full hover:bg-gray-200"><X size={20}/></button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1">
              {dutyTypes.map(dutyType => {
                const currentMemberId = schedulePairs.get(dutyType.id) || "NONE";
                const usedMemberIds = new Set(Array.from(schedulePairs.values()));
                return (
                  <div key={dutyType.id} className="grid grid-cols-3 gap-3 items-center">
                    <label htmlFor={`duty-${dutyType.id}`} className="font-medium text-gray-700 col-span-1 truncate" title={dutyType.name}>{dutyType.name}</label>
                    <div className="col-span-2">
                      <select id={`duty-${dutyType.id}`} value={currentMemberId} onChange={(e) => handlePairChange(dutyType.id, e.target.value)} disabled={isSubmitting} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 cursor-pointer">
                        <option value="NONE">-- เลือกแพทย์ --</option>
                        {filteredMembers.map(member => (
                          <option key={member.id} value={member.id} disabled={usedMemberIds.has(member.id) && currentMemberId !== member.id}>{getMemberDisplayName(member)}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center gap-2 pt-3 border-t">
                <button onClick={handleClearTodaysSchedules} disabled={isSubmitting} className="text-red-600 px-4 py-2 text-sm rounded-md hover:bg-red-50 transition flex items-center gap-1.5 disabled:opacity-50">
                  <Trash2 size={14}/> ล้างเวรวันนี้
                </button>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="text-gray-700 px-4 py-2 text-sm rounded-md hover:bg-gray-100 transition">ยกเลิก</button>
                    <button onClick={handleSaveChanges} disabled={isSubmitting} className="bg-[#008191] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-[#015A66] transition disabled:opacity-50 flex items-center gap-2">
                      <Save size={16}/> {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
      {isClearMonthModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-sm space-y-4">
                <h3 className="text-lg font-semibold text-red-700">ยืนยันการล้างเวร</h3>
                <p className="text-gray-600">คุณต้องการลบตารางเวรทั้งหมดของเดือน <strong>{new Date(currentYear, currentMonth).toLocaleString('th-TH', { month: 'long' })}</strong> ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setIsClearMonthModalOpen(false)} className="px-4 py-2 text-sm rounded-md hover:bg-gray-100">ยกเลิก</button>
                    <button onClick={handleClearMonthSchedules} className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-red-700">ยืนยันการลบ</button>
                </div>
            </div>
        </div>
      )}
    </>
  );
}