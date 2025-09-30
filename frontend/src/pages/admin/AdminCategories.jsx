import { useState, useEffect } from "react";
import API from "../../api/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  // โหลด categories
  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories/");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถโหลดหมวดหมู่ได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // เพิ่มหมวดหมู่ใหม่
  const handleAdd = async () => {
    if (!newCategory.trim()) return alert("กรุณากรอกชื่อหมวดหมู่");
    try {
      await API.post("/categories/", { name: newCategory });
      setNewCategory("");
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert("เพิ่มหมวดหมู่ไม่สำเร็จ");
    }
  };

  // เริ่มแก้ไข
  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  // บันทึกแก้ไข
  const handleEdit = async (id) => {
    if (!editingName.trim()) return alert("กรุณากรอกชื่อหมวดหมู่");
    try {
      await API.patch(`/categories/${id}/`, { name: editingName });
      setEditingId(null);
      setEditingName("");
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert("แก้ไขหมวดหมู่ไม่สำเร็จ");
    }
  };

  // ลบหมวดหมู่
  const handleDelete = async (id) => {
    if (!window.confirm("คุณแน่ใจว่าจะลบหมวดหมู่นี้?")) return;
    try {
      await API.delete(`/categories/${id}/`);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alert("ลบหมวดหมู่ไม่สำเร็จ");
    }
  };

  if (loading) return <p className="p-8 text-gray-700 dark:text-gray-300">Loading categories...</p>;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Categories</h1>

        {/* เพิ่มหมวดหมู่ใหม่ */}
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="เพิ่มหมวดหมู่ใหม่"
            className="border rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        {/* รายการหมวดหมู่ */}
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {categories.map((cat) => (
            <li key={cat.id} className="py-3 flex items-center justify-between">
              {editingId === cat.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(cat.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-gray-700 dark:text-gray-300">{cat.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(cat)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
