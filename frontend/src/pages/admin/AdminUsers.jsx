// src/pages/admin/AdminUsers.jsx
import { useEffect, useState } from "react";
import API from "../../api/api";
import AdminSidebar from "../../components/admin/AdminSidebar";
import Avatar from "../../components/Avatar";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users/");
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถโหลดผู้ใช้ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("คุณแน่ใจว่าจะลบผู้ใช้นี้?")) return;
    try {
      await API.delete(`/users/${id}/`);
      alert("ลบผู้ใช้สำเร็จ");
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("ลบผู้ใช้ไม่สำเร็จ");
    }
  };

  const handleToggleAdmin = async (id, current) => {
    // Optimistic update: change locally without refetching to preserve order
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_staff: !current } : u)));
    try {
      const res = await API.patch(`/users/${id}/`, { is_staff: !current });
      // if API returned updated user, sync it (keeps order because we map in-place)
      if (res && res.data) {
        setUsers((prev) => prev.map((u) => (u.id === id ? res.data : u)));
      }
    } catch (err) {
      // revert optimistic update on error
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_staff: current } : u)));
      console.error(err);
      alert("เปลี่ยนสถานะ Admin ไม่สำเร็จ");
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p className="p-8 text-gray-700 dark:text-gray-300">Loading...</p>;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <aside className="w-64">
        <AdminSidebar />
      </aside>
      <main className="flex-1 p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Users</h1>

        {/* Search */}
        <input
          type="text"
          placeholder="ค้นหาผู้ใช้..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {filteredUsers.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">ไม่พบผู้ใช้</p>
        ) : (
          <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="px-4 py-2 text-left">Avatar</th>
                <th className="px-4 py-2 text-left">Username</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Admin</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">
                    <Avatar src={u.avatar} size={32} />
                  </td>
                  <td className="px-4 py-2">{u.username}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleToggleAdmin(u.id, u.is_staff)}
                      className={`px-3 py-1 rounded text-white ${
                        u.is_staff ? "bg-gray-500 hover:bg-gray-600" : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {u.is_staff ? "Admin" : "Make Admin"}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}
