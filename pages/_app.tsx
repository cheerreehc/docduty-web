// pages/_app.tsx
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Toaster } from 'sonner'
import { UserProvider } from '@/contexts/UserContext'
import { DutyTypeProvider } from '@/contexts/DutyTypeContext'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'
import { ScheduleProvider } from '@/contexts/ScheduleContext'; 
import { MemberProvider } from '@/contexts/MemberContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <UserProvider>
      <WorkspaceProvider>
        <MemberProvider>
        <DutyTypeProvider>
          <ScheduleProvider> 
            <Component {...pageProps} />
            <Toaster richColors position="top-center" theme="light" />
          </ScheduleProvider>
        </DutyTypeProvider>
        </MemberProvider>
      </WorkspaceProvider>
    </UserProvider>
  )
}
