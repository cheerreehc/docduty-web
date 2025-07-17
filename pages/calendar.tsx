// pages/calendar.tsx
import { useState, useMemo, useCallback, useEffect,useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Save, X, ChevronLeft, ChevronRight, ChevronDown, Check } from 'lucide-react';
import { useDutyType } from '@/contexts/DutyTypeContext';
import { useMember, MemberWithProfile } from '@/contexts/MemberContext';
import { useSchedule } from '@/contexts/ScheduleContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useUser } from '@/contexts/UserContext';
import CalendarHeader from '@/components/CalendarHeader';
import { toast } from 'sonner';

// --- Types ---
type DutyTypeInfo = {
  id: string;
  name: string;
  color: string;
};

type ScheduleWithRelations = {
  id: string;
  date: string;
  member_id: string;
  duty_type_id: string;
  workspace_id: string;
  members: MemberWithProfile | null;
  duty_types: DutyTypeInfo | null;
};

// --- Helper ---
const getMemberDisplayName = (member: MemberWithProfile | { profiles: any } | undefined | null): string => {
  if (!member || !member.profiles) return 'ไม่ระบุ';
  const name = member.profiles.first_name || member.profiles.nickname || member.profiles.email?.split('@')[0] || 'ไม่ระบุ';
  const yearLevel = member.profiles.year_level;
  return yearLevel ? `${name} (${yearLevel})` : name;
};

const toYYYYMMDD = (date: Date): string => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function CalendarPage() {
  const { currentWorkspace, currentRole, memberships, switchWorkspace } = useWorkspace();
  const { dutyTypes } = useDutyType();
  const { addSchedule, updateSchedule, removeSchedule, loadSchedules, schedules } = useSchedule();
  const { members } = useMember();
  const { profile } = useUser();
  const modalRef = useRef<HTMLDivElement>(null);
  const switcherRef = useRef<HTMLDivElement>(null);
  const isReadonly = currentRole !== 'owner';

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClearMonthModalOpen, setIsClearMonthModalOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [schedulePairs, setSchedulePairs] = useState<Map<string, string>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentWorkspace?.id && profile) {
      loadSchedules(currentYear, currentMonth + 1);
    }
  }, [currentYear, currentMonth, currentWorkspace?.id, profile, loadSchedules]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsModalOpen(false);
      }
      if (switcherRef.current && !switcherRef.current.contains(event.target as Node)) {
        setIsSwitcherOpen(false);
      }
    };
    if (isModalOpen || isSwitcherOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen, isSwitcherOpen]);

  const schedulesByDate = useMemo(() => {
    if (!schedules) return {};
    return (schedules as ScheduleWithRelations[]).reduce((acc, schedule) => {
      const dateKey = schedule.date?.split('T')[0];
      if (dateKey) {
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(schedule);
      }
      return acc;
    }, {} as { [key: string]: ScheduleWithRelations[] });
  }, [schedules]);

  const filteredMembers = useMemo(() => members.filter(member => getMemberDisplayName(member) !== 'ไม่ระบุ'), [members]);

  const memberDutySummary = useMemo(() => {
    if (!members || members.length === 0) return [];
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

  const goToPreviousMonth = useCallback(() => setCurrentMonth(m => m === 0 ? (setCurrentYear(y => y - 1), 11) : m - 1), []);
  const goToNextMonth = useCallback(() => setCurrentMonth(m => m === 11 ? (setCurrentYear(y => y + 1), 0) : m + 1), []);

  const handleDayClick = (date: Date) => {
    setSelectedDate(toYYYYMMDD(date));
    const dateKey = toYYYYMMDD(date);
    const todaysSchedules = schedulesByDate[dateKey] || [];
    const initialPairs = new Map<string, string>();
    todaysSchedules.forEach(s => initialPairs.set(s.duty_type_id, s.member_id));
    setSchedulePairs(initialPairs);
    setIsModalOpen(true);
  };

  const handlePairChange = (dutyTypeId: string, memberId: string) => {
    setSchedulePairs(prevPairs => {
      const newPairs = new Map(prevPairs);
      if (memberId === "NONE") newPairs.delete(dutyTypeId);
      else newPairs.set(dutyTypeId, memberId);
      return newPairs;
    });
  };

  const handleSaveChanges = async () => {
    if (!selectedDate) return;
    setIsSubmitting(true);
    const originalSchedules = schedules.filter(s => s.date.startsWith(selectedDate));
    const originalPairs = new Map(originalSchedules.map(s => [s.duty_type_id, { memberId: s.member_id, scheduleId: s.id }]));
    const promises = [];
    for (const [dutyTypeId, memberId] of schedulePairs.entries()) {
      const original = originalPairs.get(dutyTypeId);
      if (original) {
        if (original.memberId !== memberId)
          promises.push(updateSchedule(original.scheduleId, memberId, dutyTypeId));
      } else {
        promises.push(addSchedule(selectedDate, memberId, dutyTypeId));
      }
    }
    for (const [dutyTypeId, { scheduleId }] of originalPairs.entries()) {
      if (!schedulePairs.has(dutyTypeId))
        promises.push(removeSchedule(scheduleId));
    }
    const results = await Promise.all(promises);
    await loadSchedules(currentYear, currentMonth + 1);
    if (results.some(res => !res)) toast.error("เกิดข้อผิดพลาดบางอย่าง ไม่สามารถบันทึกได้ครบถ้วน");
    else toast.success("บันทึกการเปลี่ยนแปลงสำเร็จ!");
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleClearTodaysSchedules = async () => {
    if (!selectedDate) return;
    const todaysSchedules = schedules.filter(s => s.date.startsWith(selectedDate));
    if (todaysSchedules.length === 0) return toast.info("ไม่มีเวรให้ลบในวันนี้");
    setIsSubmitting(true);
    await Promise.all(todaysSchedules.map(s => removeSchedule(s.id)));
    await loadSchedules(currentYear, currentMonth + 1);
    toast.success("ลบเวรทั้งหมดของวันนี้สำเร็จ!");
    setSchedulePairs(new Map());
    setIsSubmitting(false);
  };

  // CLEAR MONTHLY
  const handleClearMonthSchedules = async () => {
    setIsClearMonthModalOpen(false);

    const monthSchedules = schedules.filter(s => {
      const date = new Date(s.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    if (monthSchedules.length === 0) {
      return toast.info("ไม่มีเวรในเดือนนี้ให้ลบ");
    }

    setIsSubmitting(true);
    await Promise.all(monthSchedules.map(s => removeSchedule(s.id)));
    await loadSchedules(currentYear, currentMonth + 1);
    toast.success("ลบเวรทั้งหมดในเดือนนี้สำเร็จ!");
    setIsSubmitting(false);
  };
  // END OF CLEAR MONTHLY

  return (
    <>
      <div className="h-screen bg-[#F7FCFD] overflow-hidden p-4 lg:p-6 flex gap-6">
        <main className="flex-1 flex flex-col bg-white rounded-xl shadow-lg">
          <header className="p-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard"><Image src="/logo-docduty.png" alt="DocDuty Logo" width={100} height={40} priority /></Link>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  ตารางเวรเดือน {new Date(currentYear, currentMonth).toLocaleString('th-TH', { month: 'long', year: 'numeric' })}
                </h1>
                <div className="relative inline-flex items-center gap-2" ref={switcherRef}>
                  <span className="text-sm text-gray-600">Workspace:</span>
                  <button
                    onClick={() => setIsSwitcherOpen(prev => !prev)}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition"
                  >
                    <span className="font-semibold text-sm text-gray-800 truncate max-w-[150px]">
                      {currentWorkspace?.name || '...'}
                    </span>
                    <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
                  </button>
                  {isSwitcherOpen && (
                    <div className="absolute left-0 mt-2 w-60 bg-white shadow-lg rounded-xl py-2 z-30 border">
                      <div className="px-4 py-2 text-xs text-gray-400 font-semibold uppercase">สลับ Workspace</div>
                      {(memberships || []).map(m => (
                        <button
                          key={m.workspaces.id}
                          onClick={() => {
                            switchWorkspace(m.workspaces.id);
                            setIsSwitcherOpen(false);
                          }}
                          className="w-full text-left flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]"
                        >
                          <span>{m.workspaces.name}</span>
                          {currentWorkspace?.id === m.workspaces.id && <Check size={16} className="text-green-500" />}
                        </button>
                      ))}
                      <div className="border-t my-1"></div>
                      <Link href="/create-workspace" className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#E8FAFF]">
                        + สร้าง Workspace ใหม่
                      </Link>
                    </div>
                  )}
                </div>

              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-100 transition"><ChevronLeft size={24} /></button>
              <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-100 transition"><ChevronRight size={24} /></button>
              <CalendarHeader />
            </div>
          </header>

          <div className="flex-1 flex flex-col p-4 min-h-0">
            <div className="grid grid-cols-7 gap-1 text-center font-medium text-gray-500 text-xs sm:text-sm mb-2 flex-shrink-0">
              {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 auto-rows-auto gap-2 flex-1">
                {Array.from({ length: leadingBlanksCount }).map((_, i) => <div key={`blank-${i}`} className="bg-gray-50 rounded-lg"></div>)}
                {daysInMonth.map(date => {
                    const dateKey = toYYYYMMDD(date);
                    const dailySchedules: ScheduleWithRelations[] = schedulesByDate[dateKey] || [];
                    const isToday = toYYYYMMDD(new Date()) === dateKey;
                    
                    return (
                        <div key={dateKey} onClick={() => handleDayClick(date)}
                             className={`relative rounded-lg border flex flex-col cursor-pointer overflow-y-auto max-h- hover:bg-blue-50 transition-colors 
                            ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'} 
                            min-h-[80px] p-1 justify-start`}>
                            <span className={`text-sm font-semibold text-center mt-1.5 ${isToday ? 'text-blue-600' : 'text-gray-800'}`}>{date.getDate()}</span>
                             <div className="flex flex-col gap-1 p-1">
                                {dailySchedules.map(schedule => (
                                    <div key={schedule.id} className="px-1.5 py-0.5 rounded text-xs font-medium text-white max-w-full truncate text-left" style={{ backgroundColor: schedule.duty_types?.color || '#cccccc' }} title={getMemberDisplayName(schedule.members)}>
                                        <span className='font-bold'>{schedule.duty_types?.name}:</span> {getMemberDisplayName(schedule.members)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
        </main>
        {/* MODAL เพิ่มเวร */}
        
        {/* END MODAL เพิ่มเวร */}

        <aside className="w-64 xl:w-72 bg-white rounded-xl shadow-lg p-4 flex flex-col gap-4">
            <div className="flex-1 flex flex-col min-h-0">
                <div className='flex justify-between items-center mb-2'>
                    <h2 className="text-xl font-semibold text-gray-800">
                      สรุปเวร เดือน {new Date(currentYear, currentMonth).toLocaleString('th-TH', { month: 'long', year: 'numeric' })}
                    </h2>
                    {(currentRole === 'owner' || currentRole === 'editor') &&
                        <button onClick={() => setIsClearMonthModalOpen(true)} className="p-1.5 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 transition" title="ล้างเวรทั้งหมดในเดือนนี้">
                            <Trash2 size={18} />
                        </button>
                    }
                </div>
                <div className="overflow-y-auto">
                    {memberDutySummary.length > 0 ? (
                        <div className="space-y-2">
                          {memberDutySummary.map(([memberName, count]) => (
                            <div key={memberName} className="flex justify-between items-center text-gray-700">
                              <span className="truncate pr-2">{memberName}</span>
                              <span className="font-semibold flex-shrink-0">{count} เวร</span>
                            </div>
                          ))}
                        </div>
                    ) : <p className="text-gray-500 text-sm">ยังไม่มีการจัดเวรในเดือนนี้</p>}
                </div>
            </div>
        </aside>
      </div>
      
      {isModalOpen && (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
        <div ref={modalRef} className="bg-white rounded-xl p-6 shadow-xl w-full max-w-lg space-y-5 animate-in fade-in-0 zoom-in-95">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[#00677F]">
                เวร {selectedDate ? new Date(selectedDate).toLocaleDateString("th-TH", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }) : ''}
              </h3>
              <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="p-1 rounded-full hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto p-1">
              {dutyTypes.map((dutyType) => {
                const currentMemberId = schedulePairs.get(dutyType.id) || "NONE";
                const usedMemberIds = new Set(Array.from(schedulePairs.values()));
                return (
                  <div key={dutyType.id} className="grid grid-cols-3 gap-3 items-center">
                    <label htmlFor={`duty-${dutyType.id}`} className="font-extrabold text-gray-700 col-span-1 truncate" title={dutyType.name}>{dutyType.name}</label>
                    <div className="col-span-2">
                      <select id={`duty-${dutyType.id}`} value={currentMemberId} onChange={(e) => handlePairChange(dutyType.id, e.target.value)} disabled={isReadonly || isSubmitting} className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100 cursor-pointer">
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
            <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t">
            {!isReadonly && (
              <button
                onClick={handleClearTodaysSchedules}
                disabled={isSubmitting}
                className="text-red-600 px-4 py-2 text-sm rounded-md hover:bg-red-50 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Trash2 size={14}/> ล้างเวรวันนี้
              </button>
            )}

            <div className="flex items-center gap-2 justify-end">
              {currentRole !== 'owner' ? (
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="bg-cyan-100 px-4 py-2 text-cyan-600 rounded-md hover:bg-gray-200 transition"
                >
                  ปิด
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    disabled={isSubmitting}
                    className="text-gray-700 px-4 py-2 text-sm rounded-md hover:bg-gray-100 transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSubmitting}
                    className="bg-[#008191] text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-[#015A66] transition disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save size={16} />
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                  </button>
                </>
              )}
            </div>
          </div>

          </div>
        </div>
      )}

      {isClearMonthModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold text-red-700">ยืนยันการล้างเวร</h3>
            <p className="text-gray-600">
              คุณต้องการลบตารางเวรทั้งหมดของเดือน{" "}
              <strong>{new Date(currentYear, currentMonth).toLocaleString("th-TH", { month: "long" })}</strong>{" "}
              ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
            </p>
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