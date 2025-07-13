// pages/profile.tsx
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import AvatarUpload from '@/components/AvatarUpload'
import { useUser } from '@/contexts/UserContext'
import { createClient } from '@/utils/supabase/client'
import { createServerSupabaseClient } from '@/utils/supabase/server'
import type { GetServerSideProps } from 'next'

export default function DoctorProfile() {
  const { profile, setProfile, fetchProfile, loading } = useUser()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<any>(null)

  useEffect(() => {
    if (profile) {
      setDraft({ ...profile })
    }
  }, [profile])

  const supabase = createClient()

  const handleSave = async () => {
    const draftToUpdate = { ...draft }
    delete draftToUpdate.email

    const { error } = await supabase
      .from('profiles')
      .update(draftToUpdate)
      .eq('id', draft.id)

    if (error) {
      alert('บันทึกล้มเหลว: ' + error.message)
      return
    }

    await fetchProfile()
    setEditing(false)
  }

  if (loading || !profile || !draft) {
    return <div className="p-10">กำลังโหลด...</div>
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
              onUpload={async (url) => {
                setDraft({ ...draft, avatar_url: url })
                const { error } = await supabase
                  .from('profiles')
                  .update({ avatar_url: url })
                  .eq('id', profile.id)

                if (error) {
                  alert('อัปเดตรูปไม่สำเร็จ: ' + error.message)
                  return
                }

                await fetchProfile()
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
                  value={draft.title}
                  onChange={(v) => setDraft({ ...draft, title: v })}
                />
              </div>
              <div className="sm:col-span-4">
                <FormItem
                  label="ชื่อ"
                  value={draft.first_name}
                  onChange={(v) => setDraft({ ...draft, first_name: v })}
                />
              </div>
              <div className="sm:col-span-5">
                <FormItem
                  label="นามสกุล"
                  value={draft.last_name}
                  onChange={(v) => setDraft({ ...draft, last_name: v })}
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
                onChange={(v) => setDraft({ ...draft, year_level: v })}
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
  )
}

function FormItem({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string
  value: string
  onChange?: (val: string) => void
  disabled?: boolean
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
  )
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-m text-gray-500 mb-1">{label}</span>
      <span className="text-base font-medium text-gray-800">{value}</span>
    </div>
  )
}


export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createServerSupabaseClient(ctx)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      redirect: {
        destination: '/signin?redirectedFrom=/profile',
        permanent: false,
      },
    }
  }

  return {
    props: {},
  }
}
