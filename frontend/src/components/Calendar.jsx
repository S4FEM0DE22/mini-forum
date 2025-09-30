// src/components/Calendar.jsx
import { useState, useEffect } from "react";

export default function Calendar() {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(null);
  const [time, setTime] = useState(new Date());

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // อัพเดทเวลาแบบเรียลไทม์
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Reset highlight หลังเลือกวัน 5 วิ
  useEffect(() => {
    if (!selectedDate) return;
    const timer = setTimeout(() => setSelectedDate(null), 5000);
    return () => clearTimeout(timer);
  }, [selectedDate]);

  const months = [
    "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
    "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-lg">
      <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-100 text-lg text-center">
        ปฏิทิน
      </h3>

      {/* เวลา */}
      <div className="text-center text-xl font-mono font-semibold text-blue-600 dark:text-blue-400 mb-4">
        {time.toLocaleTimeString("th-TH")}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={handlePrevMonth}
          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          ←
        </button>
        <span className="font-semibold text-gray-800 dark:text-gray-100 text-md">
          {months[currentMonth]} {currentYear + 543}
        </span>
        <button
          onClick={handleNextMonth}
          className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          →
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
        <div>อา</div>
        <div>จ</div>
        <div>อ</div>
        <div>พ</div>
        <div>พฤ</div>
        <div>ศ</div>
        <div>ส</div>
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 text-center gap-1 text-sm">
        {days.map((day, i) => {
          if (!day) return <div key={i}></div>;

          const isToday =
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();

          const isSelected = selectedDate === day;

          return (
            <button
              key={i}
              onClick={() => setSelectedDate(day)}
              className={`p-2 rounded-full transition font-medium ${
                isSelected
                  ? "bg-blue-500 text-white"
                  : isToday
                  ? "bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white border border-blue-400"
                  : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
