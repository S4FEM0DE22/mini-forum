import { Link } from "react-router-dom";

export default function AdminSidebar() {
  return (
  <aside className="w-64 p-6 sticky top-20 self-start">
      {/* Admin Panel heading removed and background/border cleared */}
      <nav className="space-y-2">
        <Link to="/admin/dashboard" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
          Dashboard
        </Link>
        <Link to="/admin/users" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
          Users
        </Link>
        <Link to="/admin/posts" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
          Posts
        </Link>
        <Link to="/admin/categories" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
          Categories
        </Link>
        <Link to="/admin/tags" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
          Tags
        </Link>
        {/* เพิ่มเมนู Reports */}
        <Link to="/admin/reports" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
          Reports
        </Link>
      </nav>
    </aside>
  );
}
