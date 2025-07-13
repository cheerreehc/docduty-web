import { useState } from "react";
import { useDutyType } from "@/contexts/DutyTypeContext";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Header from '@/components/Header';

export default function DutyTypePage() {
  const { dutyTypes, addDutyType, removeDutyType, loading } = useDutyType();
  const [name, setName] = useState("");

  const handleAdd = async () => {
    if (!name.trim()) return;
    await addDutyType(name.trim());
    setName("");
  };

  return (
     <>
        <Header />
            <div className="pt-32 max-w-xl mx-auto px-4 py-8 space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">⚙️ จัดการประเภทเวร</h1>

            <div className="flex gap-2">
                <Input
                placeholder="ชื่อประเภทเวร เช่น ICU, Ward"
                value={name}
                onChange={(e) => setName(e.target.value)}
                />
                <button
                    disabled={!name.trim()}
                    onClick={handleAdd}
                    className={`px-8 py-2 rounded-md text-white font-semibold transition ${
                    !name.trim()
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-[#008191] hover:bg-[#015A66]'
                    }`}
                >
                เพิ่ม
                </button>
            </div>

            {loading ? (
                <p className="text-gray-500">กำลังโหลด...</p>
            ) : (
                <ul className="space-y-2">
                {dutyTypes.length === 0 ? (
                    <li className="text-gray-500">ยังไม่มีประเภทเวร</li>
                ) : (
                    dutyTypes.map((type) => (
                    <li
                        key={type.id}
                        className="flex justify-between items-center bg-white rounded border px-4 py-2 shadow-sm"
                    >
                        <span className="text-gray-800">{type.name}</span>
                        <Button
                        variant="destructive"
                        onClick={() => removeDutyType(type.id)}
                        className="text-red-600 hover:underline text-sm font-medium"
                        >
                        ลบ
                        </Button>
                    </li>
                    ))
                )}
                </ul>
            )}
            </div>
    </>
  );
}
