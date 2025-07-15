import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { inviteMember } from '@/lib/inviteMember'

export function InviteMemberForm({
  workspaceId,
  onSuccess,
}: {
  workspaceId: string
  onSuccess?: () => void
}) {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleInvite = async () => {
    if (!email) return

    setError('')

    const { error } = await inviteMember(supabase, email, workspaceId)

    if (error) {
      console.warn('❌ inviteMember error:', error)
      setError('ไม่สามารถเชิญสมาชิกได้')
    } else {
      setEmail('')
      onSuccess?.()
    }
  }

  return (
    <div className="space-y-2">
      <input
        type="email"
        value={email}
        placeholder="กรอกอีเมลเพื่อเชิญ"
        onChange={(e) => setEmail(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <button
        onClick={handleInvite}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full font-semibold"
      >
        เชิญสมาชิก
      </button>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  )
}
