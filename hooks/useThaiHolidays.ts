// hooks/useThaiHolidays.ts
import { useMemo } from 'react';

// ✅ 1. สร้างฐานข้อมูลวันหยุดของเราเอง รองรับหลายปี
const HOLIDAY_DATA: { [year: number]: { date: string; name: string }[] } = {
  2024: [
    { date: '2024-01-01', name: 'วันขึ้นปีใหม่' },
    { date: '2024-02-24', name: 'วันมาฆบูชา' },
    { date: '2024-04-06', name: 'วันจักรี' },
    { date: '2024-04-08', name: 'ชดเชยวันจักรี' },
    { date: '2024-04-13', name: 'วันสงกรานต์' },
    { date: '2024-04-14', name: 'วันสงกรานต์' },
    { date: '2024-04-15', name: 'วันสงกรานต์' },
    { date: '2024-05-01', name: 'วันแรงงาน' },
    { date: '2024-05-04', name: 'วันฉัตรมงคล' },
    { date: '2024-05-22', name: 'วันวิสาขบูชา' },
    { date: '2024-06-03', name: 'วันเฉลิมฯ พระราชินี' },
    { date: '2024-07-20', name: 'วันอาสาฬหบูชา' },
    { date: '2024-07-28', name: 'วันเฉลิมฯ ร.10' },
    { date: '2024-08-12', name: 'วันแม่แห่งชาติ' },
    { date: '2024-10-13', name: 'วันนวมินทรมหาราช' },
    { date: '2024-10-23', name: 'วันปิยมหาราช' },
    { date: '2024-12-05', name: 'วันพ่อแห่งชาติ' },
    { date: '2024-12-10', name: 'วันรัฐธรรมนูญ' },
    { date: '2024-12-31', name: 'วันสิ้นปี' },
  ],
  2025: [
    { date: '2025-01-01', name: 'วันขึ้นปีใหม่' },
    { date: '2025-02-12', name: 'วันมาฆบูชา' },
    { date: '2025-04-06', name: 'วันจักรี' },
    { date: '2025-04-07', name: 'ชดเชยวันจักรี' },
    { date: '2025-04-13', name: 'วันสงกรานต์' },
    { date: '2025-04-14', name: 'วันสงกรานต์' },
    { date: '2025-04-15', name: 'วันสงกรานต์' },
    { date: '2025-05-01', name: 'วันแรงงาน' },
    { date: '2025-05-04', name: 'วันฉัตรมงคล' },
    { date: '2025-05-05', name: 'ชดเชยวันฉัตรมงคล' },
    { date: '2025-06-03', name: 'วันเฉลิมฯ พระราชินี' },
    { date: '2025-06-10', name: 'วันวิสาขบูชา' },
    { date: '2025-07-28', name: 'วันเฉลิมฯ ร.10' },
    { date: '2025-07-29', name: 'ชดเชยวันเฉลิมฯ ร.10' },
    { date: '2025-08-12', name: 'วันแม่แห่งชาติ' },
    { date: '2025-10-13', name: 'วันนวมินทรมหาราช' },
    { date: '2025-10-23', name: 'วันปิยมหาราช' },
    { date: '2025-12-05', name: 'วันพ่อแห่งชาติ' },
    { date: '2025-12-10', name: 'วันรัฐธรรมนูญ' },
    { date: '2025-12-31', name: 'วันสิ้นปี' },
  ]
  // คุณสามารถเพิ่มข้อมูลปี 2026, 2027 เข้าไปตรงนี้ได้เลยในอนาคต
};

// ✅ 2. Hook ที่ปรับปรุงใหม่ให้ใช้ง่ายและเสถียร
export const useThaiHolidays = (year: number) => {

  const holidaysMap = useMemo(() => {
    // ดึงข้อมูลวันหยุดของปีที่ต้องการจากฐานข้อมูลของเรา
    const yearHolidays = HOLIDAY_DATA[year] || [];
    
    const map = new Map<string, string>();
    yearHolidays.forEach(holiday => {
      map.set(holiday.date, holiday.name);
    });

    return map;
  }, [year]);

  // ไม่มี loading หรือ error อีกต่อไป เพราะข้อมูลมาจากในแอปเอง
  return { holidaysMap, loadingHolidays: false, holidayError: null };
};