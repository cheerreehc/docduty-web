import { useState } from 'react'
import { useRouter } from 'next/router'
import Header from '@/components/Header'
import { useUser } from '@/contexts/UserContext'
import { createClient } from '@/utils/supabase/client'

export default function CreateWorkspacePage() {
  const router = useRouter()
  const { session, profile } = useUser()

  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    setError('')

    if (!session?.user || !profile) {
      setError('ยังไม่ได้ login')
      return
    }

    if (!name.trim()) {
      setError('กรุณาระบุชื่อ workspace')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('ไม่พบข้อมูลผู้ใช้')
      setLoading(false)
      return
    }

    try {
      // ✅ 1. สร้าง workspace พร้อมระบุ created_by
      const { data: workspace, error: wsError } = await supabase
      
        .from('workspaces')
        .insert({
          name: name.trim(),
          // created_by: user.id, // 👈 สำคัญมาก สำหรับผ่าน RLS
        })
        .select()
        .single()
    
    
        console.log('👤 created_by', user.id)
      if (wsError || !workspace) {
        throw wsError ?? new Error('ไม่สามารถสร้าง workspace ได้')
      }

      // ✅ 2. เพิ่มผู้ใช้เป็น owner
      const { error: memberError } = await supabase.from('members').insert({
        workspace_id: workspace.id,
        user_id: session.user.id,
        profile_user_id: profile.id,
        email: profile.email,
        role: 'owner',
        status: 'active',
      })

      if (memberError) {
        throw new Error('เพิ่มสมาชิกไม่สำเร็จ: ' + memberError.message)
      }

      // ✅ สำเร็จ → redirect
      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.message ?? 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7FCFD]">
      <Header />
       <div className="max-w-4xl mx-auto pt-32 px-4 pb-12">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
        <h1 className="text-2xl font-bold mb-4">🚀 สร้าง Workspace ของคุณ</h1>

        <label className="block mb-2 text-lg font-medium">ชื่อ Workspace</label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น MED DOCDUTY"
        />

        {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="mt-4 bg-[#008191] text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? 'กำลังสร้าง...' : 'สร้าง Workspace'}
        </button>
      </div>
    </div>
    </div>
  )
}
