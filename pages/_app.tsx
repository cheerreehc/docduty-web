// pages/_app.tsx
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useState } from 'react'
import { Toaster } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { UserProvider } from '@/contexts/UserContext'
import { DutyTypeProvider } from '@/contexts/DutyTypeContext'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'

export default function App({ Component, pageProps }: AppProps) {
  const [supabase] = useState(() => createClient())

  return (
    <UserProvider supabase={supabase}>
      <WorkspaceProvider>
        <DutyTypeProvider>
          <Component {...pageProps} />
          <Toaster richColors position="top-center" theme="light" />
        </DutyTypeProvider>
      </WorkspaceProvider>
    </UserProvider>
  )
}
