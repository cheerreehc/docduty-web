// pages/signin.tsx
import Head from 'next/head';
import SignInForm from '@/components/SignInForm';

export default function SignInPage() {
  return (
    <>
      <Head>
        <title>เข้าสู่ระบบ | DocDuty</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <SignInForm />
      </div>
    </>
  );
}
