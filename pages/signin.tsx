// pages/signin.tsx
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect,useState } from 'react'
import SignInForm from '@/components/SignInForm'
import { useUser } from '@/contexts/UserContext'

export default function SignInPage() {
  const router = useRouter()
  const { session, isSessionLoading, profile, loading } = useUser()
  const [hasRedirected, setHasRedirected] = useState(false)

  const redirectedFrom =
    typeof router.query.redirectedFrom === 'string'
      ? router.query.redirectedFrom
      : '/'

  const message = router.query.message


  // ✅ ป้องกัน user ที่ login อยู่แล้วเข้าหน้านี้
  useEffect(() => {
      console.log('🧭 checking redirect', {
      session,
      profile,
      loading,
      isSessionLoading,
      hasRedirected,
    })
    // if (!isSessionLoading && session) {
    //   const safeRedirect = redirectedFrom === '/signin' ? '/dashboard' : redirectedFrom

    //   console.log('🔁 Redirecting to:', safeRedirect)
    //   setTimeout(() => {
    //     router.replace(safeRedirect)
    //   }, 200) // 👈 ป้องกัน redirect ก่อน session ถูกเซ็ต
    // }
   if (!isSessionLoading && !loading && session && profile && !hasRedirected) {
    setHasRedirected(true)
      router.replace('/dashboard')
    }

}, [session, isSessionLoading, profile, loading, hasRedirected])


  return (
    <>
      <Head>
        <title>เข้าสู่ระบบ | DocDuty</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-sm space-y-4">
          {message === 'signup-success' && (
            <div className="text-green-600 text-center mb-4">
              สมัครเรียบร้อย! กรุณาเข้าสู่ระบบ
            </div>
          )}
          <SignInForm redirectedFrom={redirectedFrom} />
          
        </div>
      </div>
    </>
  )
}
