// pages/signup.tsx
import Head from 'next/head'
import SignUpForm from '@/components/SignUpForm'

export default function SignupPage() {
  return (
    <>
      <Head>
        <title>สมัครสมาชิก | DocDuty</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="w-full max-w-sm space-y-4">
          <SignUpForm />
        </div>
      </div>
    </>
  )
}
