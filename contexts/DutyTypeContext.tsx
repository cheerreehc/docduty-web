import { createContext, useContext, useEffect, useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import { useWorkspace } from './WorkspaceContext'
import { createClient } from '@/utils/supabase/client'

export type DutyType = {
  id: string
  name: string
}

type DutyTypeContextType = {
  dutyTypes: DutyType[]
  loading: boolean
  fetchDutyTypes: () => void
  addDutyType: (name: string) => Promise<void>
  updateDutyType: (id: string, name: string) => Promise<void>
  removeDutyType: (id: string) => Promise<void>
}

const DutyTypeContext = createContext<DutyTypeContextType | null>(null)

export function DutyTypeProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { session } = useUser()
  const { workspaceId } = useWorkspace()
  const [dutyTypes, setDutyTypes] = useState<DutyType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDutyTypes = async () => {
    if (!workspaceId || !session?.user?.id) {
      console.log('⏳ รอ workspaceId หรือ session')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('duty_types')
        .select('id, name')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (error) {
        console.warn('⚠️ fetchDutyTypes error:', error)
        setDutyTypes([])
      } else {
        setDutyTypes(data || [])
      }
    } catch (err) {
      console.error('❌ fetchDutyTypes unexpected error:', err)
      setDutyTypes([])
    } finally {
      setLoading(false)
    }
  }

  const addDutyType = async (name: string) => {
    if (!workspaceId || !name) return

    const { data, error } = await supabase
      .from('duty_types')
      .insert([{ name, workspace_id: workspaceId }])
      .select('id, name')
      .single()

    if (error) {
      console.warn('⚠️ addDutyType error:', error)
      return
    }

    setDutyTypes((prev) => [...prev, data])
  }

  const updateDutyType = async (id: string, name: string) => {
    const { data, error } = await supabase
      .from('duty_types')
      .update({ name })
      .eq('id', id)
      .select('id, name')
      .single()

    if (error) {
      console.warn('⚠️ updateDutyType error:', error)
      return
    }

    setDutyTypes((prev) => prev.map((d) => (d.id === id ? data : d)))
  }

  const removeDutyType = async (id: string) => {
    const userId = session?.user?.id
    if (!userId || !workspaceId) {
      console.warn('⛔️ ยังไม่มี user หรือ workspaceId')
      return
    }

    const now = new Date().toISOString()

    const { error } = await supabase
      .from('duty_types')
      .update({
        deleted_at: now,
        workspace_id: workspaceId,
      })
      .eq('id', id)
      .eq('workspace_id', workspaceId)

    if (error) {
      console.warn('⚠️ removeDutyType error:', error)
      return
    }

    setDutyTypes((prev) => prev.filter((d) => d.id !== id))
  }

  useEffect(() => {
    if (workspaceId && session?.user?.id) {
      fetchDutyTypes()
    }
  }, [workspaceId, session?.user?.id])

  return (
    <DutyTypeContext.Provider
      value={{
        dutyTypes,
        loading,
        fetchDutyTypes,
        addDutyType,
        updateDutyType,
        removeDutyType,
      }}
    >
      {children}
    </DutyTypeContext.Provider>
  )
}

export const useDutyType = () => {
  const context = useContext(DutyTypeContext)
  if (!context) throw new Error('useDutyType must be used within a DutyTypeProvider')
  return context
}
