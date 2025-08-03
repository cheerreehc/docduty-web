'use client';
import { useEffect, useState, useMemo, useRef } from 'react';
import { LocalShiftProvider } from '@/contexts/LocalShiftContext';
import { useLocalShift } from '@/contexts/LocalShiftContext';
import { useThaiHolidays} from '@/hooks/useThaiHolidays';
import { Save, X, CalendarHeart } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

const toYYYYMMDD = (date: Date) => date.toLocaleDateString('sv-SE');

function CalendarGridLocalInner() {
    const { shifts, updateShift } = useLocalShift();

    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const { holidaysMap } = useThaiHolidays(currentYear);

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [tempPairs, setTempPairs] = useState<Map<string, string[]>>(new Map());
    const modalRef = useRef<HTMLDivElement>(null);

    const [tempDoctors, setTempDoctors] = useState<{ id: string; name: string }[]>([]);
    const [tempDutyTypes, setTempDutyTypes] = useState<{ id: string; name: string }[]>([]);
    const [newDoctorName, setNewDoctorName] = useState('');
    const [newDutyTypeName, setNewDutyTypeName] = useState('');

    const addTempDoctor = () => {
    if (!newDoctorName.trim()) return;
    const newDoc = { id: crypto.randomUUID(), name: newDoctorName.trim() };
    setTempDoctors([...tempDoctors, newDoc]);
    setNewDoctorName('');
    };

    const addTempDutyType = () => {
    if (!newDutyTypeName.trim()) return;
    const newType = { id: crypto.randomUUID(), name: newDutyTypeName.trim() };
    setTempDutyTypes([...tempDutyTypes, newType]);
    setNewDutyTypeName('');
    };

  const daysInMonth = useMemo(() => {
    const date = new Date(currentYear, currentMonth, 1);
    const days = [];
    while (date.getMonth() === currentMonth) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [currentMonth, currentYear]);

  const leadingBlanks = new Date(currentYear, currentMonth, 1).getDay();

  const openModal = (date: Date) => {
    const key = toYYYYMMDD(date);
    const todayShifts = shifts[key] || {};
    const map = new Map<string, string[]>();
    Object.entries(todayShifts).forEach(([dutyType, list]) => map.set(dutyType, [...list]));
    setTempPairs(map);
    setSelectedDate(key);
  };

  const updateTemp = (dutyTypeId: string, doctorId: string) => {
    setTempPairs(prev => {
      const updated = new Map(prev);
      const current = updated.get(dutyTypeId) || [];
      if (current.includes(doctorId)) {
        updated.set(dutyTypeId, current.filter(id => id !== doctorId));
      } else {
        updated.set(dutyTypeId, [...current, doctorId]);
      }
      return updated;
    });
  };

  const save = () => {
    if (selectedDate) {
      for (const [dutyType, list] of tempPairs.entries()) {
        updateShift(selectedDate, dutyType, list);
      }
      toast.success('บันทึกสำเร็จ!');
      setSelectedDate(null);
    }
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setSelectedDate(null);
      }
    };
    if (selectedDate) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [selectedDate]);

  const shiftsByDate = shifts;
  const todayKey = toYYYYMMDD(new Date());

  const memberDutySummary = useMemo(() => {
    const summary: Record<string, number> = {};
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    Object.entries(shiftsByDate).forEach(([dateStr, duties]) => {
        if (dateStr.startsWith(monthPrefix)) {
        Object.values(duties).forEach((doctorIds) => {
            doctorIds.forEach((id) => {
            summary[id] = (summary[id] || 0) + 1;
            });
        });
        }
    });
    return Object.entries(summary)
        .map(([id, count]) => {
        const name = tempDoctors.find((d) => d.id === id)?.name;
        return name ? { name, count } : null;
        })
        .filter((item): item is { name: string; count: number } => item !== null)
        .sort((a, b) => b.count - a.count);
    }, [shiftsByDate, tempDoctors, currentMonth, currentYear]);

const holidayList = useMemo(() => {
  return (Array.from(holidaysMap.entries()) as [string, string][])
    .filter(([date]) =>
      date.startsWith(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`)
    )
    .map(([date, name]) => ({ date, name }))
    .sort((a, b) => a.date.localeCompare(b.date));
}, [holidaysMap, currentMonth, currentYear]);


  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <Image src="/logo-docduty.png" alt="DocDuty" width={100} height={40} />
          <h1 className="text-xl font-bold">DocDuty หมอเวร</h1>
        </div>
        <span className="text-sm text-gray-500">{new Date().toLocaleDateString('th-TH')}</span>
      </header>

      <div className="flex gap-4 p-4">
        <div className="flex-1">
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setCurrentMonth(m => m === 0 ? (setCurrentYear(y => y - 1), 11) : m - 1)}>&larr; ก่อนหน้า</button>
            <h2 className="font-semibold text-xl">
              {new Date(currentYear, currentMonth).toLocaleString('th-TH', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => setCurrentMonth(m => m === 11 ? (setCurrentYear(y => y + 1), 0) : m + 1)}>ถัดไป &rarr;</button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center font-medium text-gray-600">
            {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map(d => <div key={d}>{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-2 mt-2">
            {Array.from({ length: leadingBlanks }).map((_, i) => <div key={i}></div>)}
            {daysInMonth.map(date => {
            const key = toYYYYMMDD(date);
            const isToday = key === todayKey;
            const holidayName = holidaysMap.get(key);
            const isHoliday = !!holidayName;
            const dayShifts = shiftsByDate[key] || {};
            return (
                <div
                key={key}
                title={holidayName || ''}
                onClick={() => openModal(date)}
                className={`border p-1 rounded-md min-h-[100px] cursor-pointer flex flex-col hover:bg-blue-50
                    ${isToday ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-gray-200'}
                    ${isHoliday ? 'text-red-600' : ''}`}
                >
                <div className="flex items-center justify-between text-base font-semibold">
                    <span className={`${isToday ? 'text-blue-600' : isHoliday ? 'text-red-600' : 'text-gray-800'}`}>{date.getDate()}</span>
                    {isHoliday && (
                    <span className="flex items-center gap-1 text-[12px] text-red-600">
                        <CalendarHeart size={14} className="mt-[1px]" /> {holidayName}
                    </span>
                    )}
                </div>
                <div className="text-sm text-left mt-1">
                    {Object.entries(dayShifts).map(([duty, doctorList]) => (
                        <div key={duty}>
                            <span className="font-semibold">
                            {tempDutyTypes.find(d => d.id === duty)?.name || 'ไม่ทราบเวร'}:
                            </span>{' '}
                            {doctorList.map(id => tempDoctors.find(d => d.id === id)?.name || id).join(', ')}
                        </div>
                        ))}
                </div>
                </div>
            );
            })}
          </div>
        </div>

        <aside className="w-64 xl:w-72 bg-white rounded-xl shadow-md p-4 h-fit space-y-4">
          <div>
            <h2 className="text-lg font-bold mb-2">📊 สรุปเวรประจำเดือน</h2>
            {memberDutySummary.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {memberDutySummary.map(m => (
                  <li key={m.name} className="flex justify-between border-b py-1">
                    <span>{m.name}</span>
                    <span className="font-semibold text-right">{m.count} เวร</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">ยังไม่มีเวรในเดือนนี้</p>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold mb-2">📅 วันหยุดเดือนนี้</h2>
            {holidayList.length > 0 ? (
              <ul className="text-sm space-y-1">
                {holidayList.map((h: { date: string; name: string }) => (
                  <li key={h.date} className="flex items-center gap-1 text-red-600">
                    <CalendarHeart size={14} />
                    <span>{new Date(h.date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}</span>
                    <span className="ml-1">{h.name}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-500 text-sm">ไม่มีวันหยุด</p>}
          </div>
        </aside>
      </div>

      {selectedDate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div ref={modalRef} className="bg-white rounded-xl shadow p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                    เวร{new Date(selectedDate).toLocaleDateString('th-TH', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                    })}
                    </h3>
                <button onClick={() => setSelectedDate(null)}><X /></button>
            </div>

            {/* เพิ่มประเภทเวรใหม่ */}
            <div>
                <label className="block text-sm font-medium mb-1">เพิ่มประเภทเวร:</label>
                <div className="flex gap-2">
                <input
                    type="text"
                    value={newDutyTypeName}
                    onChange={(e) => setNewDutyTypeName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTempDutyType()}
                    placeholder="เช่น ICU, Ward"
                    className="flex-1 border px-2 py-1 rounded text-sm"
                />
                <button onClick={addTempDutyType} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">เพิ่ม</button>
                </div>
            </div>

            {/* เพิ่มชื่อหมอใหม่ */}
            <div>
                <label className="block text-sm font-medium mt-4 mb-1">เพิ่มชื่อหมอ:</label>
                <div className="flex gap-2">
                <input
                    type="text"
                    value={newDoctorName}
                    onChange={(e) => setNewDoctorName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTempDoctor()}
                    placeholder="เช่น นพ.สมชาย"
                    className="flex-1 border px-2 py-1 rounded text-sm"
                />
                <button onClick={addTempDoctor} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">เพิ่ม</button>
                </div>
            </div>

            {tempDutyTypes.length > 0 ? (
                tempDutyTypes.map(duty => {
                    const selectedDoctorIds = Array.from(tempPairs.entries())
                    .filter(([dutyId]) => dutyId !== duty.id)
                    .flatMap(([, ids]) => ids);

                    return (
                    <div key={duty.id} className="border p-2 rounded">
                        <div className="font-bold text-sm mb-1">{duty.name}</div>
                        {tempDoctors.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                            {tempDoctors.map(doc => {
                                const isSelected = tempPairs.get(duty.id)?.includes(doc.id) || false;
                                const isUsedInOtherDuty = selectedDoctorIds.includes(doc.id);

                                return (
                                <button
                                    key={doc.id}
                                    onClick={() => {
                                    if (!isUsedInOtherDuty) updateTemp(duty.id, doc.id);
                                    }}
                                    disabled={isUsedInOtherDuty}
                                    className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap
                                    ${isUsedInOtherDuty ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : isSelected ? 'bg-[#008191] text-white' : 'bg-gray-100'}`}
                                >
                                    {doc.name}
                                </button>
                                );
                            })}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 mt-1">⚠️ กรุณาเพิ่มชื่อหมอก่อน</p>
                        )}
                        </div>
                    );
                })
                ) : (
                <p className="text-sm text-gray-500 mt-2">กรุณาเพิ่มประเภทเวรก่อน</p>
                ) }

            <div className="flex justify-end">
                <button onClick={save} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2">
                <Save size={16} /> บันทึก
                </button>
            </div>
            </div>
        </div>
        )}

    </div>
  );
}

export default function CalendarGridLocalPage() {
  return (
    <LocalShiftProvider>
      <CalendarGridLocalInner />
    </LocalShiftProvider>
  );
}
