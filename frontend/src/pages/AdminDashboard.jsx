import { useState, useEffect } from "react";
import API from "../../api/api";
import { Link } from "react-router-dom";
import Avatar from "../../components/Avatar";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [uRes, pRes, cRes] = await Promise.all([
          API.get("/users/"),
          API.get("/posts/"),
          API.get("/categories/"),
        ]);
        setUsers(uRes.data);
        setPosts(pRes.data);
        setCategories(cRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <p className="p-8 text-gray-700 dark:text-gray-300">Loading...</p>;

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Admin Panel</h2>
        <nav className="space-y-2">
          <Link to="/admin/dashboard" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Dashboard</Link>
          <Link to="/admin/users" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Users</Link>
          <Link to="/admin/posts" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Posts</Link>
          <Link to="/admin/categories" className="block px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700">Categories</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Users</h3>
            <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-gray-100">{users.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Posts</h3>
            <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-gray-100">{posts.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Categories</h3>
            <p className="mt-2 text-2xl font-bold text-gray-800 dark:text-gray-100">{categories.length}</p>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow mb-8">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Recent Posts</h2>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {posts.slice(0, 5).map((post) => (
              <li key={post.id} className="py-3 flex items-center justify-between">
                <div>
                  <Link to={`/thread/${post.id}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    {post.title}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    by {post.user?.username || "Anonymous"} - {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-semibold px-2 py-1 rounded-full">
                  {post.category?.name || "No Category"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Recent Users</h2>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.slice(-5).reverse().map((u) => (
              <li key={u.id} className="py-3 flex items-center gap-3">
                <Avatar src={u.avatar} size={32} />
                <span className="text-gray-700 dark:text-gray-300">{u.username}</span>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
