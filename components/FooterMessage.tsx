'use client'

import { useEffect, useState } from 'react'

const FooterMessage = () => {
  const messages = [
  "👩‍💻 เขียนโค้ดเพราะอยาก impress หมอคนหนึ่ง... you know who 😘",
  "🥲 What’s harder — shift scheduling or hiding feelings for you, doc?",
  "❤️ Built with love by someone who's *totally not* stalking a doctor.",
  "🩺 หมอว่างไหมคะ อยากฝากหัวใจไว้ในตารางเวร",
  "📅 แอปนี้จัดเวรได้ แต่จัดใจไม่อยู่เลย doc 🥲",
  "💌 Dedicated to someone in scrubs... who’ll never know.",
  "🧩 อยากเป็นแค่ตัวแปรในชีวิตหมอ... even a const ก็ยังดี",
  "☕ คิดว่าโค้ดนี้รันเพราะ React จริงเหรอ? มันรันเพราะรักต่างหาก 💗",
  "👀 This footer knows secrets — especially who's crushing on a doctor.",
  "🧠 สมองเขียน logic ได้ แต่ logic ความรักแพ้หมอทุกที",
  "☕ Made with love... and probably *too much* coffee.",
  "💌 Not just a side project — it’s a love letter in code.",
  "🤖 Because someone fell for a doctor... and learned to code.",
  "👩‍💻 Built this just to impress a *certain doctor*. 👀",
  "🩺 Any doctor here need a frontend dev... or a date?",
  "📅 Made this for shift scheduling — but really, to manage my feelings. 💗",
  "💘 This UI is smoother than my pickup lines, doc.",
  "🧠 Smart code. Dumb in love with a doctor.",
  "❤️ Created with React... and reactions to *one particular MD*.",
  "💘 Falling for doctors may cause sleepless nights & side projects.",
  "✨ This app runs on love, caffeine, and a crush on someone in scrubs.",
  "💘 Scheduling shifts... but can’t schedule my feelings for you.",
  "📟 If you're a doctor and single... this app was made for you 😉",
]
  
  const easterEggs = [
    "👀 You found the secret message.",
    "💘 Page built under intense emotional pressure.",
    "🫣 Did someone say 'crush on a doc'?",
    "💡 This message self-destructs in 5 seconds...",
    "🤫 Don't tell the doctor I wrote this.",
  ]

  const [showEasterEgg, setShowEasterEgg] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const list = showEasterEgg ? easterEggs : messages
    const random = list[Math.floor(Math.random() * list.length)]
    setMessage(random)
  }, [showEasterEgg])

  return (
    <p
      className="text-xl text-center text-gray-400 mt-2 cursor-pointer transition hover:text-pink-500 select-none"
      onClick={() => setShowEasterEgg(!showEasterEgg)}
      title="👀 click me"
    >
      {message || '...'}
    </p>
  )
}

export default FooterMessage
