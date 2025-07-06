// pages/register.tsx
import SignUpForm from "@/components/SignUpForm";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">สมัครสมาชิก</h1>
        <SignUpForm />
      </div>
    </div>
  );
}
