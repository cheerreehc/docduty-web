import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useUser } from '@/contexts/UserContext'

type WorkspaceContextType = {
  workspaceId: string | null
  workspaceName: string | null
  myRole: string | null
  loading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { session, isSessionLoading } = useUser()

  const [workspaceId, setWorkspaceId] = useState<string | null>(null)
  const [workspaceName, setWorkspaceName] = useState<string | null>(null)
  const [myRole, setMyRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isSessionLoading || !session?.user?.id) {
      return
    }

    const loadWorkspace = async () => {
      setLoading(true)

      const userId = session.user.id
      console.log('👤 userId (workspace):', userId)

      const { data: myMember, error } = await supabase
        .from('members_for_policy')
        .select('workspace_id, role')
        .eq('user_id', userId)
        .maybeSingle()

      if (error || !myMember) {
        console.warn('⚠️ ไม่พบ workspace ของ user นี้:', error)
        setWorkspaceId(null)
        setWorkspaceName(null)
        setMyRole(null)
      } else {
        setWorkspaceId(myMember.workspace_id)
        setMyRole(myMember.role ?? null)
      }

      setLoading(false)
    }

    loadWorkspace()
  }, [session?.user?.id, isSessionLoading]) // 👈 ถูกต้องสุด

  return (
    <WorkspaceContext.Provider
      value={{ workspaceId, workspaceName, myRole, loading }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used within a WorkspaceProvider')
  return context
}
