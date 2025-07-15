import { useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@/utils/supabase/client'

export function SignUpForm() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 1. สมัครผู้ใช้
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError || !data.session) {
      setError('Signup error: ' + signUpError?.message);
      return;
    }

    // 2. ดึง session เพื่อให้แน่ใจว่า user ถูกสร้างแล้ว
    const { data: sessionData } = await supabase.auth.getSession()
    const user = sessionData.session?.user

    if (!user) {
      setError('ไม่พบ session หลังสมัคร กรุณาลองใหม่')
      setLoading(false)
      return
    }

    // // 3. insert profile (แค่ id)
    // const { error: profileError } = await supabase.from('profiles').insert({
    //   id: user.id,
    // })

    // if (profileError) {
    //   setError('บันทึกโปรไฟล์ไม่สำเร็จ: ' + profileError.message)
    //   setLoading(false)
    //   return
    // }

    // 4. ไปหน้า dashboard
    router.replace('/dashboard')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">อีเมล</label>
        <input
          type="email"
          className="w-full border px-3 py-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium">รหัสผ่าน</label>
        <input
          type="password"
          className="w-full border px-3 py-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
      >
        {loading ? 'กำลังสมัคร...' : '✅ สมัครสมาชิก'}
      </button>
    </form>
  )
}



// import { useState } from 'react'
// import { useRouter } from 'next/router'
// import { createClient } from '@/utils/supabase/client'
// import { useUser } from '@/contexts/UserContext'
// import Image from 'next/image'
// import Link from 'next/link'

// export default function SignUpForm() {
//   const router = useRouter()
//   const supabase = createClient()
//   const { setProfile } = useUser()

//   const [email, setEmail] = useState('')
//   const [password, setPassword] = useState('')
//   const [error, setError] = useState('')

//   async function handleSubmit(e: React.FormEvent) {
//     e.preventDefault()
//     setError('')

//     console.log('📨 Signup:', email)

//     const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
//       email,
//       password,
//     })

//     if (signUpError || !signUpData.user) {
//       console.warn('❌ Signup error:', signUpError)
//       setError(signUpError?.message || 'สมัครสมาชิกไม่สำเร็จ')
//       return
//     }

//     const user = signUpData.user

//     console.log('✅ Signup success, now login...')

//     // Auto login ทันที
//     const { error: loginError } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     })

//     if (loginError) {
//       console.warn('❌ Auto-login error:', loginError)
//       setError('เข้าสู่ระบบไม่สำเร็จหลังสมัคร')
//       return
//     }

//     console.log('🔐 Auto-login success, fetching profile...')

//     // 1️⃣ สร้าง profile ถ้ายังไม่มี
//     let { data: profile, error: profileError } = await supabase
//       .from('profiles')
//       .select('*')
//       .eq('id', user.id)
//       .maybeSingle()

//     if (!profile) {
//       const { data: newProfile, error: createError } = await supabase
//         .from('profiles')
//         .insert({
//           id: user.id,
//           email: user.email,
//         })
//         .select()
//         .maybeSingle()

//       if (createError || !newProfile) {
//         console.warn('❌ createProfile error:', createError)
//         setError('ไม่สามารถสร้างโปรไฟล์ได้')
//         return
//       }

//       profile = newProfile
//       console.log('✅ created profile:', profile)
//     }

//     // 2️⃣ claim invite จาก table members
//     const { data: invitedMember, error: memberError } = await supabase
//       .from('members')
//       .select('*')
//       .eq('email', user.email)
//       .is('user_id', null)
//       .maybeSingle()

//     if (invitedMember) {
//       const { error: claimError } = await supabase
//         .from('members')
//         .update({
//           user_id: user.id,
//           profile_user_id: user.id,
//           status: 'active',
//         })
//         .eq('id', invitedMember.id)

//       if (claimError) {
//         console.warn('❌ claimInvite error:', claimError)
//         setError('ไม่สามารถเชื่อมต่อคำเชิญได้')
//         return
//       }

//       console.log('🎉 claimed invite:', invitedMember)
//     } else {
//       console.log('ℹ️ no invite found for this email')
//     }

//     // 3️⃣ เซ็ต profile ใน Context แล้ว redirect
//     setProfile({ id: user.id, email: user.email, ...profile })
//     router.replace('/dashboard')
//   }

//   return (
//     <form
//       onSubmit={handleSubmit}
//       className="bg-white p-8 rounded-lg shadow max-w-sm w-full space-y-5"
//     >
//       <div className="flex flex-col items-center space-y-2 mb-2">
//         <Image src="/logo.png" alt="DocDuty Logo" width={120} height={120} priority />
//         <h1 className="text-2xl font-bold text-gray-800">สมัครสมาชิก</h1>
//       </div>

//       <input
//         type="email"
//         placeholder="อีเมล"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         className="border px-4 py-2 rounded w-full"
//         required
//       />

//       <input
//         type="password"
//         placeholder="รหัสผ่าน"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//         className="border px-4 py-2 rounded w-full"
//         required
//       />

//       <button
//         type="submit"
//         className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded w-full"
//       >
//         สมัครสมาชิก
//       </button>

//       {error && <p className="text-red-600 text-center text-sm">{error}</p>}

//       <p className="text-center text-sm text-gray-600">
//         มีบัญชีอยู่แล้ว?{' '}
//         <Link href="/signin" className="text-blue-600 hover:underline">
//           เข้าสู่ระบบ
//         </Link>
//       </p>
//     </form>
//   )
// }
