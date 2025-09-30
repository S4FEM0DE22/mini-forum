import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";

export default function AdminRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  // ถ้า AuthContext กำลังโหลด
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  // ถ้าไม่ได้ login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ถ้า login แล้วแต่ไม่ใช่ admin
  if (!(user.is_staff || user.role === 'admin' || user.is_superuser)) {
    return <Navigate to="/" replace />;
  }

  // ถ้าเป็น admin ให้ render children
  return children || null;
}
