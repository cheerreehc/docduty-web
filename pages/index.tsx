// // pages/index.tsx
// import Link from 'next/link'
// import Image from 'next/image';
// import FooterMessage from '@/components/FooterMessage'

// export default function HomePage() {
//   return (
//     <div className="min-h-screen bg-animated flex items-center justify-center px-4">
//       <div className="max-w-2xl w-full text-center space-y-8 py-12">
//         <div className="flex flex-col items-center space-y-2 mb-8">
//                 <Image
//                   src="/logo.png"
//                   alt="DocDuty Logo"
//                   width={200}
//                   height={200}
//                   priority
//                 />
//               </div>
//           <h1 className="font-round text-3xl "> ระบบจัดตารางเวรสำหรับทีมแพทย์ ใช้งานง่ายบนเว็บและมือถือ</h1>
          
//         <div className="space-x-4">
//           <Link href="/signup">
//             <button className="font-round text-xl bg-[#008191] text-white px-6 py-2 rounded-md hover:bg-[#015A66] transition">
//               สมัครใช้งานฟรี
//             </button>
//           </Link>

//           <Link href="/signin">
//             <button className="border text-xl border-[#008191] text-[#008191] px-6 py-2 rounded-md hover:bg-white transition">
//               เข้าสู่ระบบ
//             </button>
//           </Link>
//         </div>

//         <div className="text-xl text-gray-400 pt-8 text-center">
//           <p>DocDuty © {new Date().getFullYear()}</p>
//           <FooterMessage />
//         </div>
//       </div>
//     </div>
//   )
// }


// pages/index.tsx
import Link from 'next/link';
import Image from 'next/image';
import FooterMessage from '@/components/FooterMessage';
import Header from '@/components/Header';
import HelloDocPage from '@/components/HelloDocPage'

export default function HomePage() {
  return (
    <div className="bg-white min-h-screen">
      <Header />

      {/* HERO Section */}
      <section className="bg-[#F0FBFD] py-40 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold font-round text-[#008191] mb-6">
            ระบบจัดตารางเวรที่หมอเลือกใช้
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            ใช้งานได้บนเว็บไซต์ จัดเวรง่าย สะดวก พร้อมแชร์ทันทีในรูปแบบภาพหรือลิงก์ให้ทีมของคุณ
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/signup">
              <button className="bg-[#008191] text-white px-6 py-3 rounded-md text-lg font-semibold hover:bg-[#016676]">
                เริ่มต้นใช้ฟรี
              </button>
            </Link>
            <Link href="/signin">
              <button className="border border-[#008191] text-[#008191] px-6 py-3 rounded-md text-lg font-semibold hover:bg-white">
                เข้าสู่ระบบ
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          <div>
            <Image
              src="/calendar-preview.png"
              alt="calendar preview"
              width={600}
              height={400}
              className="rounded-xl border shadow"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#008191] mb-4">DocDuty Pro เพียง 69 บาท/เดือน</h2>
            <ul className="text-gray-700 space-y-3 text-lg">
              <li>✅ แชร์ตารางให้ทีมผ่านลิงก์ส่วนตัว</li>
              <li>✅ Dashboard สรุปตารางเวรและจำนวนเวรตลอดทั้งปี</li>
              <li>✅ บันทึกและจัดการเวรได้ทุกที่ทุกเวลา</li>
              <li>✅ Export ตารางเป็นรูปภาพแชร์ได้ทันที</li>
              <li>✅ ใช้งานบนเว็บไซต์ไม่ต้องโหลดแอปฯ</li>
            </ul>
            <p className="mt-6 text-sm text-gray-500">*ทดลองใช้ฟรี ไม่ต้องกรอกบัตรเครดิต</p>
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section className="bg-[#F8FAFC] py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-[#008191] mb-6">ชมตัวอย่างการใช้งาน</h2>
          <div className="aspect-w-16 aspect-h-9">
            <iframe
              className="w-full h-64 sm:h-96 rounded-xl border shadow"
              src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
              title="Demo Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </section>

      

      {/* Live Demo Embed */}
      <section className="bg-[#F0FBFD] py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[#008191] mb-6 text-center">ทดลองใช้งาน DocDuty</h2>
          <HelloDocPage />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-[#008191] mb-8 text-center">คำถามที่พบบ่อย (FAQ)</h2>
          <div className="space-y-6 text-gray-800">
            <div>
              <h3 className="font-semibold text-lg">DocDuty ใช้งานฟรีจริงไหม?</h3>
              <p className="text-sm mt-1">ใช่! คุณสามารถทดลองใช้ได้ฟรีโดยไม่ต้องกรอกบัตรเครดิต</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">ถ้าปิดแอป ข้อมูลจะหายหรือไม่?</h3>
              <p className="text-sm mt-1">สำหรับผู้ใช้แบบไม่สมัคร ข้อมูลจะหายเมื่อปิดแอป หากต้องการบันทึกถาวรแนะนำให้สมัครใช้งาน</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg">สามารถ export ตารางเวรได้อย่างไร?</h3>
              <p className="text-sm mt-1">เพียงคลิกปุ่ม export ในหน้าเวร ระบบจะสร้างรูปภาพให้คุณสามารถแชร์ได้ทันที</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-[#F8FAFC] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#008191] mb-8">เสียงจากผู้ใช้งานจริง</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-700 italic">
                “ใช้งานง่ายมาก เราใช้จัดเวรแผนก ICU ทุกสัปดาห์ ทีมพอใจมาก”
              </p>
              <p className="text-right text-sm text-gray-500 mt-4">— พญ.วรางค์ แพทย์ ICU</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-700 italic">
                “มี export เป็นภาพ ช่วยให้แชร์ในกลุ่ม LINE ได้ง่ายขึ้นเยอะ”
              </p>
              <p className="text-right text-sm text-gray-500 mt-4">— นพ.ก้องเกียรติ อายุรกรรม</p>
            </div>
          </div>
        </div>
      </section>


      <footer className="text-center text-sm text-gray-400 py-6">
        <p>DocDuty © {new Date().getFullYear()}</p>
        <FooterMessage />
      </footer>
    </div>
  );
}