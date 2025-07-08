// components/AvatarUpload.tsx
import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabase";

const supabase = createSupabaseClient(true);

export default function AvatarUpload({
  uid,
  url,
  onUpload,
}: {
  uid: string;
  url: string | null;
  onUpload: (path: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("ต้องเลือกไฟล์ก่อน");
      }

        const file = event.target.files[0];
        const fileExt = file.name.split(".").pop();
        const filePath = `${uid}/avatar-${Date.now()}.${fileExt}`;

        // ✅ ลบไฟล์เก่า (ถ้ามี)
        if (url) {
            const oldPath = url.split("/storage/v1/object/public/avatars/")[1];
            console.log("oldPath:", oldPath);
            if (oldPath) {
                await supabase.storage.from("avatars").remove([oldPath]);
            }
        }

        // ⬆️ อัปโหลดไฟล์ใหม่
        const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: false }); // ไม่ใช้ upsert แล้ว

        if (uploadError) throw uploadError;

        // 👇 แปลงเป็น public URL แล้วส่งกลับ
        const { data: { publicUrl } } = supabase
        .storage
        .from("avatars")
        .getPublicUrl(filePath);

        onUpload(publicUrl);
        console.log("publicUrl : ", publicUrl);

    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setUploading(false);
    }
   
  };

  return (
    <div className="flex flex-col items-center">
        <label className="block text-sm text-gray-500 mb-1">รูปโปรไฟล์</label>

        {url ? (
        <img
            src={url}
            alt="avatar"
            className="w-24 h-24 rounded-full border border-gray-300 object-cover"
        />
        ) : (
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
            ไม่มีรูป
        </div>
        )}

        {/* ปุ่มเปลี่ยนรูป */}
        <label
        htmlFor="avatarUpload"
        className="mt-2 text-sm text-[#00677F] underline cursor-pointer hover:text-[#004f61]"
        >
        เปลี่ยนรูปโปรไฟล์
        </label>

        {/* input แบบซ่อน */}
        <input
        id="avatarUpload"
        type="file"
        accept="image/*"
        onChange={uploadAvatar}
        className="hidden"
        />

        {uploading && <p className="text-xs text-gray-500 mt-1">กำลังอัปโหลด...</p>}
    </div>
    );
}
