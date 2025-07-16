// pages/profile.tsx
// ⭐ เพิ่ม 'use client' directive (สำหรับ Next.js 13+ App Router, แต่บางครั้งช่วยแก้ปัญหาใน Pages Router ได้)
'use client'; 

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import AvatarUpload from '@/components/AvatarUpload';
import { useUser } from '@/contexts/UserContext';
import { createClient } from '@/utils/supabase/client';
// ⭐ ลบ import createServerSupabaseClient ออกชั่วคราว เพื่อทดสอบ
// import { createServerSupabaseClient } from '@/utils/supabase/server'; 
import type { GetServerSideProps } from 'next';
import { toast } from 'sonner';

// ขยาย Type ของ Profile เพื่อให้ครอบคลุมข้อมูลทั้งหมดที่ใช้ในหน้านี้
// ควรจะตรงกับ Profile type ใน contexts/UserContext.tsx
interface ProfileDataForForm {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  nickname: string | null;
  avatar_url: string | null;
  title: string | null;
  year_level: string | null;
  phone: string | null;
}

// ⭐ เปลี่ยนชื่อ Component ชั่วคราวเพื่อบังคับ Next.js rebuild
function UserProfileComponent() { 
  const { profile, loading, refreshProfile } = useUser();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileDataForForm | null>(null);

  useEffect(() => {
    if (profile) {
      setDraft({
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        nickname: profile.nickname,
        avatar_url: profile.avatar_url,
        title: profile.title,
        year_level: profile.year_level,
        phone: profile.phone || null,
      });
    }
  }, [profile]);

  const supabase = createClient();

  const handleSave = useCallback(async () => {
    if (!draft) return;

    const { email, ...profileUpdates } = draft;

    const { error } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', draft.id);

    if (error) {
      toast.error('บันทึกล้มเหลว: ' + error.message);
      return;
    }

    await refreshProfile();
    setEditing(false);
    toast.success('บันทึกโปรไฟล์สำเร็จ!');
  }, [draft, supabase, refreshProfile]);

  const onUpload = useCallback(async (url: string) => {
    if (!profile) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', profile.id);

    if (error) {
      toast.error('อัปเดตรูปไม่สำเร็จ: ' + error.message);
      return;
    }

    setDraft((prevDraft) => prevDraft ? { ...prevDraft, avatar_url: url } : null);
    await refreshProfile();
    toast.success('อัปเดตรูปสำเร็จ!');
  }, [profile, supabase, refreshProfile]);

  if (loading || !profile || !draft) {
    return (
      <div className="min-h-screen bg-[#F7FCFD]">
        <Header />
        <div className="max-w-xl mx-auto pt-32 px-4 pb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
            {/* ⭐ Skeleton Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-200 animate-pulse">
              <div className="w-20 h-20 bg-gray-200 rounded-full"></div> {/* Skeleton for Avatar */}
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48"></div> {/* Skeleton for Name */}
                <div className="h-4 bg-gray-200 rounded w-32"></div> {/* Skeleton for Year Level */}
              </div>
            </div>

            {/* ⭐ Skeleton Profile Details */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => ( // Skeleton for 4 profile items
                <div key={i} className="flex flex-col space-y-1 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-24"></div> {/* Skeleton for label */}
                  <div className="h-8 bg-gray-200 rounded w-full"></div> {/* Skeleton for value */}
                </div>
              ))}
            </div>

            {/* Skeleton Edit Button */}
            <div className="text-left">
              <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="pt-32 min-h-screen bg-[#F7FCFD] py-10 px-4">
        <div className="max-w-xl mx-auto bg-white shadow-xl rounded-xl p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <AvatarUpload
              uid={profile.id}
              url={profile.avatar_url ?? ''}
              onUpload={onUpload}
            />
            <div>
              <h2 className="text-xl font-semibold text-[#00677F]">
                {profile.title} {profile.first_name} {profile.last_name}
              </h2>
              <p className="text-gray-500">{profile.year_level}</p>
            </div>
          </div>

          {/* ข้อมูลส่วนตัว */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileItem label="ชื่อเล่น" value={profile.nickname ?? ''} />
            <ProfileItem label="อีเมล" value={profile.email ?? ''} />
            <ProfileItem label="เบอร์โทร" value={profile.phone ?? ''} />
            <ProfileItem label="ชั้นปี" value={profile.year_level ?? ''} />
          </div>

          <div className="text-left">
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-[#E0F6FA] text-[#00677F] hover:bg-[#d0f0f5] rounded-lg text-sm font-medium shadow"
            >
              แก้ไขโปรไฟล์
            </button>
          </div>
        </div>
      </div>

      {/* Modal แก้ไขโปรไฟล์ */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
            <h3 className="text-lg font-semibold text-[#00677F]">แก้ไขโปรไฟล์</h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-3">
                <FormItem
                  label="คำนำหน้า"
                  value={draft.title ?? ''}
                  onChange={(v) => setDraft({ ...draft, title: v })}
                />
              </div>
              <div className="sm:col-span-4">
                <FormItem
                  label="ชื่อ"
                  value={draft.first_name ?? ''}
                  onChange={(v) => setDraft({ ...draft, first_name: v })}
                />
              </div>
              <div className="sm:col-span-5">
                <FormItem
                  label="นามสกุล"
                  value={draft.last_name ?? ''}
                  onChange={(v) => setDraft({ ...draft, last_name: v })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormItem
                label="ชื่อเล่น"
                value={draft.nickname ?? ''}
                onChange={(v) => setDraft({ ...draft, nickname: v })}
              />
              <FormItem
                label="ชั้นปี เช่น Extern, Intern, R1, Staff เป็นต้น"
                value={draft.year_level ?? ''}
                onChange={(v) => setDraft({ ...draft, year_level: v })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormItem label="อีเมล" value={draft.email ?? ''} disabled />
              <FormItem
                label="เบอร์โทร"
                value={draft.phone ?? ''}
                onChange={(v) => setDraft({ ...draft, phone: v })}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditing(false)}
                className="text-gray-500 px-4 py-2 text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                className="bg-[#E0F6FA] text-[#00677F] px-4 py-2 rounded-lg text-sm font-medium shadow"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ⭐ Export Component ด้วยชื่อใหม่
export default UserProfileComponent; 

// ⭐ ลบ getServerSideProps ออกชั่วคราวเพื่อทดสอบ
/*
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createServerSupabaseClient(ctx);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: '/signin?redirectedFrom=/profile',
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};
*/

// FormItem และ ProfileItem ยังคงเหมือนเดิม
function FormItem({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange?: (val: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.value)}
        className={`rounded-lg px-3 py-2 text-m text-gray-700 border border-gray-300 ${
          disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'
        }`}
      />
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-m text-gray-500 mb-1">{label}</span>
      <span className="text-base font-medium text-gray-800">{value}</span>
    </div>
  );
}
