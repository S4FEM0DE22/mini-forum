import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(""); // ✅ เพิ่ม success state

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const payload = { ...form };
      if (!payload.email) delete payload.email;

      await API.post("users/", payload);

      // ✅ แสดงข้อความสร้างสำเร็จ
      setSuccess("สมัครสมาชิกสำเร็จ! กำลังไปหน้าเข้าสู่ระบบ...");
      
      // redirect หลัง 2 วินาที
      setTimeout(() => {
        navigate("/login"); // หรือ "/login" ตามระบบของคุณ
      }, 2000);

    } catch (err) {
        console.error(err);

        // แปลง error object เป็น string อ่านง่าย
        if (err.response?.data) {
          // ตัวอย่างสำหรับ Django REST Framework
          const messages = Object.values(err.response.data)
            .flat() // รวม array ของข้อความทั้งหมด
            .join(" "); // ต่อเป็น string เดียว
          setError(messages);
        } else {
          setError("เกิดข้อผิดพลาด");
        }
      }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
          สมัครสมาชิก
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{JSON.stringify(error)}</p>
        )}

        {success && (
          <p className="text-green-500 text-sm mb-4 text-center">{success}</p>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            ชื่อผู้ใช้
          </label>
          <input
            type="text"
            name="username"
            value={form.username}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Username"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Email"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            รหัสผ่าน
          </label>
          <input
            type="password"
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Password"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          สมัครสมาชิก
        </button>
      </form>
    </div>
  );
}
