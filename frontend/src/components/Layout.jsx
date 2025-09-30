// components/Layout.jsx
import { useContext } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { AuthContext } from "../context/AuthProvider";

export default function Layout() {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Navbar />

      <div className="flex flex-1 max-w-7xl mx-auto p-4 sm:p-6 gap-6">
        {/* Sidebar (ซ้าย) */}
        {user && (
          <aside className="hidden md:block w-64 shrink-0">
            <Sidebar />
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>

      <footer className="mt-12 p-6 text-center text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700">
        © 2025 Mini Forum. สร้างด้วย TailwindCSS และ React.
      </footer>
    </div>
  );
}
