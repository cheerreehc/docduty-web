// pages/profile.tsx
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Header from "@/components/Header";
import { createSupabaseClient } from '@/lib/supabase';
import AvatarUpload from "@/components/AvatarUpload";

const supabase = createSupabaseClient(true);

export default function DoctorProfile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<any>(null);


  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        // console.error("❌ getUser failed:", userError);
        router.push("/login"); // หรือ redirect หน้าอื่น
        return;
      }

    if (!user.email) {
        console.error("⚠️ Email is missing in user object", user);
        return; 
    }
    // console.log("🧪 user", user);
    // console.log("📧 user.email", user.email);

    const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

    if (error) {
    console.error("โหลดโปรไฟล์ล้มเหลว", error);
    return;
    }
    
    setProfile({
    ...data,
    email: user.email,
    });
    setDraft(data);
    setLoading(false);
    };

    fetchProfile();
  }, []);

// SAVE FUNCTION
  const handleSave = async () => {
    const draftToUpdate = { ...draft };
    delete draftToUpdate.email; // ✅ ลบ field ที่ไม่อยู่ใน table

    const { error } = await supabase
        .from("profiles")
        .update(draftToUpdate)
        .eq("id", draft.id);

    if (error) {
        alert("บันทึกล้มเหลว: " + error.message);
        return;
    }

    setProfile(draft);
    setEditing(false);
    };
// END OF SAVE FUNCTION

  if (loading || !profile) return <div className="p-10">กำลังโหลด...</div>;

  return (
    <>
      <Header />
      <div className="pt-32 min-h-screen bg-[#F7FCFD] py-10 px-4">
        <div className="max-w-xl mx-auto bg-white shadow-xl rounded-xl p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <AvatarUpload
  uid={profile.id}
  url={profile.avatar_url}
  onUpload={async (url) => {
    // ✅ อัปเดตทั้ง draft, profile (UI จะเปลี่ยนทันที), และ DB
setDraft({ ...draft, avatar_url: url });
setProfile({ ...profile, avatar_url: url });

    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: url })
      .eq("id", profile.id);

    if (error) {
      alert("อัปเดตรูปไม่สำเร็จ: " + error.message);
    }
  }}
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
            <ProfileItem label="ชื่อเล่น" value={profile.nickname} />
            <ProfileItem label="อีเมล" value={profile.email} />
            <ProfileItem label="เบอร์โทร" value={profile.phone} />
            <ProfileItem label="ชั้นปี" value={profile.year_level} />
          </div>

          {/* ปุ่มแก้ไขโปรไฟล์ */}
          <div className="text-left">
            <button
              onClick={() => {
                setDraft(profile);
                setEditing(true);
              }}
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
            <h3 className="text-lg font-semibold text-[#00677F]">
              แก้ไขโปรไฟล์
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-3">
                <FormItem
                  label="คำนำหน้า"
                  value={draft.title}
                  onChange={(v) => setDraft({ ...draft, prefix: v })}
                />
              </div>
              <div className="sm:col-span-4">
                <FormItem
                  label="ชื่อ"
                  value={draft.first_name}
                  onChange={(v) => setDraft({ ...draft, firstName: v })}
                />
              </div>
              <div className="sm:col-span-5">
                <FormItem
                  label="นามสกุล"
                  value={draft.last_name}
                  onChange={(v) => setDraft({ ...draft, lastName: v })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormItem
                label="ชื่อเล่น"
                value={draft.nickname}
                onChange={(v) => setDraft({ ...draft, nickname: v })}
              />
              <FormItem
                label="ชั้นปี เช่น Extern, Intern, R1, Staff เป็นต้น"
                value={draft.year_level}
                onChange={(v) => setDraft({ ...draft, year: v })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormItem label="อีเมล" value={draft.email} disabled />
              <FormItem
                label="เบอร์โทร"
                value={draft.phone}
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
          disabled ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white"
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
