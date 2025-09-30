import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  // ถ้า AuthContext กำลังโหลด
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <p className="text-gray-700 dark:text-gray-300">กำลังตรวจสอบสิทธิ์...</p>
      </div>
    );
  }

  // ถ้าไม่มี user ให้เด้งไป login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ถ้ามี user ให้ render children
  return children || null;
}
