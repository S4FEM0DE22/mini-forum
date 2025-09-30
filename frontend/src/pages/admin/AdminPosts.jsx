import { useState, useEffect } from "react";
import API from "../../api/api";
import AdminSidebar from "../../components/admin/AdminSidebar";
import { Link } from "react-router-dom";

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงโพสต์ทั้งหมด
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await API.get("/posts/");
        setPosts(res.data);
      } catch (err) {
        console.error(err);
        alert("ไม่สามารถโหลดโพสต์ได้");
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // ลบโพสต์
  const handleDelete = async (postId) => {
    if (!window.confirm("คุณแน่ใจว่าจะลบโพสต์นี้?")) return;
    try {
      await API.delete(`/posts/${postId}/`);
      setPosts(posts.filter((p) => p.id !== postId));
      alert("ลบโพสต์สำเร็จ");
    } catch (err) {
      console.error(err);
      alert("ลบโพสต์ไม่สำเร็จ");
    }
  };

  if (loading) return <p className="p-8 text-gray-700 dark:text-gray-300">Loading posts...</p>;

  // เรียงโพสต์ล่าสุดด้านบน
  const sortedPosts = [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Posts</h1>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedPosts.map((post) => (
            <li key={post.id} className="py-3 flex items-center justify-between">
              <div>
                <Link
                  to={`/thread/${post.id}`}
                  className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {post.title}
                </Link>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  by {post.user?.username || "Anonymous"} | {post.category?.name || "No Category"} |{" "}
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(post.id)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
