// components/Sidebar.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar";

export default function Sidebar({ popularPosts = [], recentComments = [], categories = [] }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // อัปเดตเวลาแบบเรียลไทม์ทุก 1 วินาที
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ฟังก์ชันแปลงวันและเวลาให้อ่านง่าย
  const formatDate = (date) => {
    return date.toLocaleDateString("th-TH", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Calendar & Time */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-inner text-center">
        <div className="font-bold text-gray-800 dark:text-gray-100 mb-1">
          {formatDate(currentTime)}
        </div>
        <div className="text-blue-600 dark:text-blue-400 font-mono text-lg">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Popular Posts */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-inner">
        <h3 className="font-bold mb-3 text-gray-800 dark:text-gray-100">
          กระทู้ยอดนิยม
        </h3>
        <ul className="space-y-2">
          {popularPosts.map((p) => (
            <li key={p.id}>
              <Link
                to={`/thread/${p.id}`}
                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Avatar src={p.user?.avatar} size={24} />
                <span className="truncate">{p.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Recent Comments */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-inner">
        <h3 className="font-bold mb-3 text-gray-800 dark:text-gray-100">
          ความคิดเห็นล่าสุด
        </h3>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
          {recentComments.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <Avatar src={c.user?.avatar} size={24} />
              <span>
                <b>{c.user?.username || "Anonymous"}:</b> {c.body.slice(0, 40)}...
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Trending Categories */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 shadow-inner">
        <h3 className="font-bold mb-3 text-gray-800 dark:text-gray-100">
          หมวดยอดนิยม
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/forum?room=${cat.slug}`}
              className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 px-2 py-1 rounded-full text-xs font-semibold hover:bg-blue-200 dark:hover:bg-blue-700 transition"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
