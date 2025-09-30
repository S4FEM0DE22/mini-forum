import { useState, useEffect } from "react";
import API from "../../api/api";
import AdminSidebar from "../../components/admin/AdminSidebar";
import ActionButton from "../../components/ActionButton";

export default function AdminTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTag, setNewTag] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  // load tags
  const fetchTags = async () => {
    try {
      const res = await API.get("/tags/");
      setTags(res.data);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถโหลดแท็กได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const handleAdd = async () => {
    if (!newTag.trim()) return alert("กรุณากรอกชื่อแท็ก");
    try {
      await API.post("/tags/", { name: newTag.trim() });
      setNewTag("");
      fetchTags();
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถเพิ่มแท็กได้");
    }
  };

  const startEdit = (tag) => {
    setEditingId(tag.id);
    setEditingName(tag.name);
  };

  const handleEdit = async (id) => {
    if (!editingName.trim()) return alert("กรุณากรอกชื่อแท็ก");
    try {
      await API.patch(`/tags/${id}/`, { name: editingName.trim() });
      setEditingId(null);
      setEditingName("");
      fetchTags();
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถแก้ไขแท็กได้");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("คุณแน่ใจว่าจะลบแท็กนี้?")) return;
    try {
      await API.delete(`/tags/${id}/`);
      fetchTags();
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถลบแท็กได้");
    }
  };

  if (loading) return <p className="p-8 text-gray-700 dark:text-gray-300">Loading tags...</p>;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Tags</h1>

        <div className="mb-6 flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="เพิ่มแท็กใหม่"
            className="border rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <ActionButton variant="primary" onClick={handleAdd}>Add</ActionButton>
        </div>

        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {tags.map((tag) => (
            <li key={tag.id} className="py-3 flex items-center justify-between">
              {editingId === tag.id ? (
                <>
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <ActionButton variant="primary" size="sm" onClick={() => handleEdit(tag.id)}>Save</ActionButton>
                    <ActionButton variant="outline" size="sm" onClick={() => setEditingId(null)}>Cancel</ActionButton>
                  </div>
                </>
              ) : (
                <>
                  <span className="text-gray-700 dark:text-gray-300">{tag.name}</span>
                  <div className="flex gap-2">
                    <ActionButton variant="ghost" size="sm" onClick={() => startEdit(tag)}>Edit</ActionButton>
                    <ActionButton variant="danger" size="sm" onClick={() => handleDelete(tag.id)}>Delete</ActionButton>
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
