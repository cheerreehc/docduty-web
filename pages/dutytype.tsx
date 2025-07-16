// pages/dutytype.tsx
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import Header from "@/components/Header";
import { useUser } from '@/contexts/UserContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useDutyType, DutyType } from '@/contexts/DutyTypeContext'; // ⭐ Import useDutyType และ DutyType

const MySwal = withReactContent(Swal);

export default function DutyTypePage() {
  const supabase = createClient();
  const { profile } = useUser();
  const { currentWorkspace, currentRole, loading: workspaceLoading } = useWorkspace();
  // ⭐ ดึงข้อมูลและฟังก์ชันจาก DutyTypeContext
  const { dutyTypes, loading: dutyTypeLoading, addDutyType, updateDutyType, deleteDutyType, error: dutyTypeError } = useDutyType();

  const [newDutyTypeName, setNewDutyTypeName] = useState('');
  const [newDutyTypeColor, setNewDutyTypeColor] = useState('#008191'); // Default color
  const [editingDutyType, setEditingDutyType] = useState<DutyType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- จัดการสถานะการโหลดรวม ---
  const isLoading = workspaceLoading || dutyTypeLoading;

  // --- ฟังก์ชันสำหรับเพิ่ม/แก้ไขประเภทเวร ---
  const handleSubmit = async () => {
    if (!newDutyTypeName.trim() || !newDutyTypeColor.trim()) {
      toast.error("กรุณากรอกชื่อและเลือกสีประเภทเวร");
      return;
    }
    if (!currentWorkspace?.id) {
      toast.error("กรุณาเลือก Workspace ก่อนดำเนินการ");
      return;
    }

    setIsSubmitting(true);
    if (editingDutyType) {
      // แก้ไขประเภทเวร
      await updateDutyType(editingDutyType.id, newDutyTypeName, newDutyTypeColor);
      setEditingDutyType(null); // เคลียร์สถานะแก้ไข
    } else {
      // เพิ่มประเภทเวรใหม่
      await addDutyType(newDutyTypeName, newDutyTypeColor);
    }
    setNewDutyTypeName('');
    setNewDutyTypeColor('#008191');
    setIsSubmitting(false);
  };

  // --- ฟังก์ชันสำหรับเริ่มแก้ไขประเภทเวร ---
  const handleEditClick = (dutyType: DutyType) => {
    setEditingDutyType(dutyType);
    setNewDutyTypeName(dutyType.name);
    setNewDutyTypeColor(dutyType.color);
  };

  // --- ฟังก์ชันสำหรับยกเลิกการแก้ไข ---
  const handleCancelEdit = () => {
    setEditingDutyType(null);
    setNewDutyTypeName('');
    setNewDutyTypeColor('#008191');
  };

  // --- ฟังก์ชันสำหรับลบประเภทเวร ---
  const handleDelete = async (id: string, name: string) => {
    if (currentRole !== 'owner') {
      toast.error("คุณไม่มีสิทธิ์ลบประเภทเวร");
      return;
    }

    MySwal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: `คุณต้องการลบประเภทเวร "${name}" ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#008191',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก'
    }).then(async (result) => {
      if (result.isConfirmed) {
        await deleteDutyType(id);
      }
    });
  };

  // --- ส่วนแสดงผลขณะโหลดหรือไม่มี Workspace ---
  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-[#F7FCFD]">
        <Header />
        <div className="max-w-4xl mx-auto pt-32 px-4 pb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
            <h1 className="text-3xl font-bold font-round mb-2">จัดการประเภทเวร</h1>
            <p className="text-gray-500 mb-6">Workspace: <strong>{currentWorkspace?.name || 'กำลังโหลด...'}</strong></p> {/* แสดงชื่อ Workspace หรือ Loading */}

            {/* Skeleton Form */}
            {currentRole === 'owner' && (
              <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4 border border-gray-200 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="h-10 bg-gray-200 rounded-md flex-1 w-full"></div>
                  <div className="w-12 h-10 bg-gray-200 rounded-md"></div>
                  <div className="h-10 bg-gray-200 rounded-md w-full sm:w-auto"></div>
                </div>
              </div>
            )}

            {/* Skeleton Table */}
            <div className="w-full text-sm text-left border shadow rounded-md overflow-hidden">
              <div className="bg-gray-50 border-b">
                <div className="flex items-center p-3 font-semibold text-gray-600">
                  <span className="flex-1">ชื่อประเภทเวร</span>
                  <span className="w-24 text-center">ตัวอย่างสี</span>
                  {currentRole === 'owner' && <span className="w-32 text-right">จัดการ</span>}
                </div>
              </div>
              <div className="divide-y">
                {/* แสดง Skeleton 3 แถว */}
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center p-3 hover:bg-[#f8fafa] animate-pulse">
                    <div className="flex-1 h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="w-24 text-center">
                      <div className="inline-block w-6 h-6 rounded-full bg-gray-200"></div>
                    </div>
                    {currentRole === 'owner' && (
                      <div className="w-32 text-right space-x-2">
                        <div className="inline-block h-4 bg-gray-200 rounded w-12"></div>
                        <div className="inline-block h-4 bg-gray-200 rounded w-12"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <>
        <div className="min-h-screen bg-[#F7FCFD]">
          <Header />
          <div className="pt-32 p-6 max-w-3xl mx-auto text-center">
            <p>กรุณาเลือก Workspace จากเมนูด้านบน</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#F7FCFD]">
        <Header />
        <div className="max-w-4xl mx-auto pt-32 px-4 pb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
            <h1 className="text-3xl font-bold font-round mb-2">จัดการประเภทเวร</h1>
            <p className="text-gray-500 mb-6">Workspace: <strong>{currentWorkspace.name}</strong></p>

            {/* ฟอร์มเพิ่ม/แก้ไขประเภทเวร */}
            {currentRole === 'owner' && (
              <div className="bg-white rounded-lg shadow p-4 mb-6 space-y-4 border border-gray-200">
                <label className="font-semibold block">{editingDutyType ? 'แก้ไขประเภทเวร' : 'เพิ่มประเภทเวรใหม่'}</label>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <input
                    type="text"
                    value={newDutyTypeName}
                    onChange={(e) => setNewDutyTypeName(e.target.value)}
                    placeholder="ชื่อประเภทเวร เช่น เช้า, บ่าย, ดึก"
                    className="border border-gray-300 rounded-md px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-[#008191] w-full"
                  />
                  <input
                    type="color"
                    value={newDutyTypeColor}
                    onChange={(e) => setNewDutyTypeColor(e.target.value)}
                    className="w-12 h-10 rounded-md border border-gray-300 cursor-pointer"
                    title="เลือกสี"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-md text-white font-semibold transition bg-[#008191] hover:bg-[#015A66] w-full sm:w-auto"
                  >
                    {isSubmitting ? 'กำลังบันทึก...' : editingDutyType ? 'บันทึกการแก้ไข' : 'เพิ่มประเภทเวร'}
                  </button>
                  {editingDutyType && (
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-md text-gray-700 font-semibold transition bg-gray-200 hover:bg-gray-300 w-full sm:w-auto"
                    >
                      ยกเลิก
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ตารางแสดงประเภทเวร */}
            <div className="w-full text-sm text-left border shadow rounded-md overflow-hidden">
              <div className="bg-gray-50 border-b">
                <div className="flex items-center p-3 font-semibold text-gray-600">
                  <span className="flex-1">ชื่อประเภทเวร</span>
                  <span className="w-24 text-center">ตัวอย่างสี</span>
                  {currentRole === 'owner' && <span className="w-32 text-right">จัดการ</span>}
                </div>
              </div>
              <div className="divide-y">
                {isLoading ? (
                  <p className="p-4 text-center">กำลังโหลดประเภทเวร...</p>
                ) : dutyTypes.length > 0 ? (
                  dutyTypes.map((dt) => (
                    <div key={dt.id} className="flex items-center p-3 hover:bg-[#f8fafa]">
                      <span className="flex-1 font-medium text-gray-800">{dt.name}</span>
                      <span className="w-24 text-center">
                        <span
                          className="inline-block w-6 h-6 rounded-full border border-gray-300"
                          style={{ backgroundColor: dt.color }}
                          title={dt.color}
                        ></span>
                      </span>
                      {currentRole === 'owner' && (
                        <span className="w-32 text-right space-x-2">
                          <button
                            onClick={() => handleEditClick(dt)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(dt.id, dt.name)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ลบ
                          </button>
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-gray-500">ยังไม่มีประเภทเวรใน Workspace นี้</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
