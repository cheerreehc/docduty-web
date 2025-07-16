// pages/_app.tsx
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { useState } from 'react' // ไม่จำเป็นต้องใช้ useState สำหรับ createClient() ที่นี่แล้ว
import { Toaster } from 'sonner'
import { createClient } from '@/utils/supabase/client' // ไม่จำเป็นต้อง import ที่นี่แล้ว
import { UserProvider } from '@/contexts/UserContext'
import { DutyTypeProvider } from '@/contexts/DutyTypeContext'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'

export default function App({ Component, pageProps }: AppProps) {
  // ไม่จำเป็นต้องสร้าง supabase client ที่นี่แล้ว เพราะ UserProvider สร้างเอง
  // const [supabase] = useState(() => createClient()) 

  return (
    // ⭐ ลบ prop 'supabase' ออกจาก UserProvider
    <UserProvider>
      <WorkspaceProvider>
        <DutyTypeProvider>
          <Component {...pageProps} />
          <Toaster richColors position="top-center" theme="light" />
        </DutyTypeProvider>
      </WorkspaceProvider>
    </UserProvider>
  )
}
