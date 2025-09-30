// src/pages/Login.js
import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api"; // axios instance
import { AuthContext } from "../context/AuthProvider";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);  // ดึง login() จาก Context
  const [identifier, setIdentifier] = useState(""); // username หรือ email
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Ensure this token request does not accidentally include an Authorization header
      const res = await API.post(
        "token/",
        {
          username: identifier, // ต้องตรงกับ backend (username)
          password,
        },
        { headers: { Authorization: undefined } }
      );

      // Persist access token first so request interceptor adds Authorization header
      localStorage.setItem("accessToken", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      // Fetch full user profile (includes is_staff, role, etc.)
      let userData = { username: res.data.username, avatar: res.data.avatar || "/default-avatar.png" };
      try {
        const me = await API.get("/users/me/");
        userData = me.data;
      } catch (err) {
        // fallback to minimal user info if /users/me/ fails
        console.warn("Could not fetch /users/me/ after login", err);
      }

      login(userData, res.data.access);
      navigate("/"); // redirect หน้าแรก
    } catch (err) {
      console.error(err);
      setError("ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-100">
          เข้าสู่ระบบ
        </h2>

        {error && (
          <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            ชื่อผู้ใช้ หรือ อีเมล
          </label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Username หรือ Email"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 dark:text-gray-300 mb-2">
            รหัสผ่าน
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Password"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
        >
          เข้าสู่ระบบ
        </button>
        <div className="mt-3 text-sm text-center">
          <a href="/reset-password" className="text-blue-600 hover:underline">ลืมรหัสผ่าน?</a>
        </div>
      </form>
    </div>
  );
}
