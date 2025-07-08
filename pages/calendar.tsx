import { useState } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  subMonths,
  addMonths,
} from 'date-fns'
import Head from 'next/head'
import Header from "@/components/Header";

export default function CalendarPage() {
  
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const rows = []
  let days = []
  let day = startDate

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      const cloneDay = day
      const isCurrentMonth = isSameMonth(cloneDay, monthStart)
      const isToday = isSameDay(cloneDay, new Date())

      days.push(
        <div
          key={cloneDay.toString()}
          className={`h-24 rounded-xl m-1 p-2 flex items-start justify-start text-sm relative shadow-sm ${
            isCurrentMonth ? 'bg-white text-gray-800' : 'bg-gray-100 text-gray-400'
          } ${isToday ? 'ring-2 ring-blue-400 font-bold' : ''}`}
        >
          <span>{format(cloneDay, 'd')}</span>
        </div>
      )
      day = addDays(day, 1)
    }
    rows.push(
      <div className="grid grid-cols-7" key={day.toString()}>
        {days}
      </div>
    )
    days = []
  }

  return (
    <>
      <Head>
        <title>ตารางเวร | DocDuty</title>
      </Head>
      <div className="pt-28 px-4 w-full max-w-4xl mx-auto">
        <Header />
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <button onClick={prevMonth} className="text-gray-500 hover:text-gray-800">
              ⬅️
            </button>
            <h1 className="text-xl font-semibold">{format(currentDate, 'MMMM yyyy')}</h1>
            <button onClick={nextMonth} className="text-gray-500 hover:text-gray-800">
              ➡️
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-600 mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="uppercase tracking-wide">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="space-y-1">{rows}</div>
        </div>
      </div>
    </>
  )
}
