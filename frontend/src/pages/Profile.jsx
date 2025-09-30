// src/pages/Profile.jsx
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthProvider";
import API from "../api/api";
import { Facebook, Twitter, Instagram, Github } from "lucide-react";
import { Link } from "react-router-dom";
import Avatar from "../components/Avatar";
import ActionButton from "../components/ActionButton";

export default function Profile() {
  const { user, setUser } = useContext(AuthContext);
  const [form, setForm] = useState({
    username: "",
    email: "",
    bio: "",
    avatar: null,
    avatarPreview: "",
    social: { facebook: "", twitter: "", instagram: "", github: "" },
  });
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ posts: 0, comments: 0 });
  const [userPosts, setUserPosts] = useState([]);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await API.get("/users/me/");
        setUser(res.data);
        setForm({
          username: res.data.username || "",
          email: res.data.email || "",
          bio: res.data.bio || "",
          avatar: null,
          avatarPreview: res.data.avatar || "/default-avatar.png",
          social: {
            facebook: res.data.social?.facebook || "",
            twitter: res.data.social?.twitter || "",
            instagram: res.data.social?.instagram || "",
            github: res.data.social?.github || "",
          },
        });

  // Always request posts for the authenticated user only
  const postsRes = await API.get("/posts/", { params: { user: res.data.id } });
  const commentsRes = await API.get("/comments/", { params: { user: res.data.id } });
  // Safety: also filter client-side so even if API returned extra items, we only show the user's posts
  const postsForUser = Array.isArray(postsRes.data) ? postsRes.data.filter(p => p.user && p.user.id === res.data.id) : [];
  const commentsForUser = Array.isArray(commentsRes.data) ? commentsRes.data : [];
  setStats({ posts: postsForUser.length, comments: commentsForUser.length });
  setUserPosts(postsForUser.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    };
    fetchMe();
  }, [setUser]);

  useEffect(() => {
    const interval = setInterval(() => setFade(f => !f), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSocialChange = (e) => setForm({ ...form, social: { ...form.social, [e.target.name]: e.target.value } });
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm({ ...form, avatar: file, avatarPreview: URL.createObjectURL(file) });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("username", form.username);
      data.append("email", form.email);
      data.append("bio", form.bio);
      data.append("social", JSON.stringify(form.social));
      if (form.avatar) data.append("avatar", form.avatar);

      const res = await API.put(`/users/${user.id}/`, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });
      // Backend may not include the social object in the response. Merge
      // the local social values we just saved so the UI updates immediately.
      const updatedUser = { ...res.data };
      if (!updatedUser.social) {
        updatedUser.social = form.social || {};
      }
      // Keep avatar URL if backend didn't return it
      if (!updatedUser.avatar && form.avatarPreview) {
        updatedUser.avatar = form.avatarPreview;
      }
      setUser(updatedUser);
      // Persist to localStorage so the user remains after refresh
      try {
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch {
        // ignore storage errors
      }
      setEditing(false);
      setMessage("อัปเดตข้อมูลเรียบร้อย ✅");
    } catch (err) {
      console.error(err.response?.data || err);
      setMessage("เกิดข้อผิดพลาด ❌");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return <p className="text-center mt-10 text-gray-500 dark:text-gray-400">กรุณาเข้าสู่ระบบก่อน</p>;

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-gray-900 py-10">
      {/* Background Avatar blur + crossfade */}
      <div
        className={`absolute inset-0 bg-cover bg-center filter blur-3xl transition-opacity duration-2000 ${fade ? "opacity-20" : "opacity-10"}`}
        style={{ backgroundImage: `url(${form.avatarPreview})` }}
      />

      <div className="relative max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-10 space-y-8 transition">
        <h1 className="text-3xl font-bold mb-6 text-left text-gray-800 dark:text-gray-100">โปรไฟล์ของฉัน</h1>
        {message && <p className="mb-4 text-green-600 dark:text-green-400 font-medium">{message}</p>}

        {!editing ? (
          <>
            <div className="flex flex-col md:flex-row items-start gap-10">
              <Avatar src={form.avatarPreview} size={140} />
              <div className="flex-1 space-y-3 text-left">
                <p><b>Username:</b> {user.username}</p>
                <p><b>Email:</b> {user.email}</p>
                {user.bio && <p><b>Bio:</b> {user.bio}</p>}

                {/* Social Links */}
                <div className="flex items-center gap-3 mt-2">
                  {user.social?.facebook && <a href={user.social.facebook} target="_blank" rel="noopener noreferrer"><Facebook size={28} className="text-blue-600" /></a>}
                  {user.social?.twitter && <a href={user.social.twitter} target="_blank" rel="noopener noreferrer"><Twitter size={28} className="text-blue-400" /></a>}
                  {user.social?.instagram && <a href={user.social.instagram} target="_blank" rel="noopener noreferrer"><Instagram size={28} className="text-pink-500" /></a>}
                  {user.social?.github && <a href={user.social.github} target="_blank" rel="noopener noreferrer"><Github size={28} className="text-gray-800 dark:text-gray-200" /></a>}
                </div>

                <ActionButton onClick={() => setEditing(true)} className="mt-4" variant="primary">แก้ไขโปรไฟล์</ActionButton>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
              <div className="p-6 bg-blue-100 dark:bg-blue-900 rounded-lg shadow">
                <p className="text-2xl font-bold">{stats.posts}</p>
                <p className="text-sm">โพสต์</p>
              </div>
              <div className="p-6 bg-green-100 dark:bg-green-900 rounded-lg shadow">
                <p className="text-2xl font-bold">{stats.comments}</p>
                <p className="text-sm">ความคิดเห็น</p>
              </div>
            </div>

            {/* Recent Posts */}
            {userPosts.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-left">โพสต์ล่าสุดของฉัน</h2>
                <ul className="space-y-4">
                  {userPosts.map((p) => (
                    <Link to={`/thread/${p.id}`} key={p.id}>
                      <li className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700 shadow-sm hover:shadow-md transition cursor-pointer">
                        <p className="font-semibold text-blue-600">{p.title}</p>
                        <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">{p.body.slice(0, 100)}...</p>
                      </li>
                    </Link>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar src={form.avatarPreview} size={140} />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="border rounded px-3 py-2 w-full md:w-2/3" />
            </div>

            <input type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <textarea name="bio" placeholder="เขียนแนะนำตัว..." value={form.bio} onChange={handleChange} className="w-full border px-3 py-2 rounded-lg" />

            {/* Social Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input type="url" name="facebook" placeholder="Facebook URL" value={form.social.facebook} onChange={handleSocialChange} className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="url" name="twitter" placeholder="Twitter URL" value={form.social.twitter} onChange={handleSocialChange} className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="url" name="instagram" placeholder="Instagram URL" value={form.social.instagram} onChange={handleSocialChange} className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
              <input type="url" name="github" placeholder="GitHub URL" value={form.social.github} onChange={handleSocialChange} className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500" />
            </div>

            <div className="flex gap-4 mt-2">
              <ActionButton type="submit" variant="primary">{submitting ? "กำลังบันทึก..." : "บันทึก"}</ActionButton>
              <ActionButton variant="outline" onClick={() => setEditing(false)}>ยกเลิก</ActionButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
