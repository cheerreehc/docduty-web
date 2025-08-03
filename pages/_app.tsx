// pages/_app.tsx
import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Toaster } from 'sonner'
import { UserProvider } from '@/contexts/UserContext'
import { DutyTypeProvider } from '@/contexts/DutyTypeContext'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'
import { ScheduleProvider } from '@/contexts/ScheduleContext'; 
import { MemberProvider } from '@/contexts/MemberContext';
import { LocalShiftProvider } from '@/contexts/LocalShiftContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Head from 'next/head';



export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [isPageLoading, setIsPageLoading] = useState(false);

   useEffect(() => {
    const handleStart = () => setIsPageLoading(true);
    const handleComplete = () => setIsPageLoading(false);

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return (
    <>
      <Head>
        <title>DocDuty - หมอเวร</title>
        <meta name="description" content="เปลี่ยนเรื่องจัดเวรที่วุ่นวายให้เป็นเรื่องง่ายสำหรับคุณหมอ" />
      </Head>
      <UserProvider>
          <WorkspaceProvider>
            <MemberProvider>
            <DutyTypeProvider>
              <ScheduleProvider> 
                {isPageLoading && (
                  <div className="fixed inset-0 bg-white/70 z-[9999] flex items-center justify-center">
                    <Image
                      src="/logo-docduty.png"
                      alt="Loading"
                      width={120}
                      height={120}
                      className="animate-bounce"
                    />
                  </div>
                )}
                <Component {...pageProps} />
                <Toaster richColors position="top-center" theme="light" />
              </ScheduleProvider>
            </DutyTypeProvider>
            </MemberProvider>
          </WorkspaceProvider>
      </UserProvider>
    </>
  )
}
