import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import CommentSection from "../components/CommentSection";
import { AuthContext } from "../context/AuthProvider";
import ReportButton from "../components/ReportButton";
import ActionButton from "../components/ActionButton";
import { FaHeart } from "react-icons/fa";

export default function ThreadDetail() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liking, setLiking] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editImageFile, setEditImageFile] = useState(null);
  const [editCategoryInput, setEditCategoryInput] = useState("");
  const [editSelectedCategory, setEditSelectedCategory] = useState(null);
  const [editTags, setEditTags] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [categories, setCategories] = useState([]);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const actionBtn = "ml-2 text-sm px-2 py-1 rounded border";

  // Validate route id: guard against string 'undefined'/'null' or other invalid values
  const isValidId = (val) => {
    if (!val) return false;
    if (val === "undefined" || val === "null") return false;
    // allow numeric ids (e.g. '12') or uuid-like ids if your app uses them —
    // for now accept digits only to prevent accidental requests with bad params
    return /^\d+$/.test(String(val));
  };

  // Fetch thread
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isValidId(id)) {
          // invalid id in route, nothing to fetch
          setThread(null);
          setLoading(false);
          return;
        }

        const threadRes = await API.get(`/posts/${id}/`);
        setThread(threadRes.data);
        // prefill edit fields
        setEditTitle(threadRes.data.title || '');
        setEditBody(threadRes.data.body || '');
        setEditCategoryInput(threadRes.data.category?.name || '');
        setEditSelectedCategory(threadRes.data.category || null);
        setEditTags(threadRes.data.tags || []);
  // fetch allTags and categories for suggestions
  API.get('/tags/').then(r => setAllTags(r.data)).catch(() => {});
  API.get('/categories/').then(r => setCategories(r.data)).catch(() => {});
        // After loading thread and pre-filling fields, we'll check navigation state in a separate effect
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // After thread loads, allow opening edit mode if navigation requested it (via ?edit=1 or navigation state.openEdit)
  useEffect(() => {
    if (!thread) return;
    try {
      const search = new URLSearchParams(window.location.search);
      const editParam = search.get('edit');
      const navState = (typeof window !== 'undefined' && window.history && window.history.state) ? window.history.state : null;
      const openEditState = navState && navState.state && navState.state.openEdit;
      if (editParam === '1' || openEditState) {
        setEditingPost(true);
      }
    } catch {
      // ignore
    }
  }, [thread]);

  // Comment creation/editing handled by CommentSection component

  // Toggle like
  const handleLikeToggle = async () => {
    if (!user) return alert("คุณต้องล็อกอินก่อนกดไลค์");
    setLiking(true);
    try {
      if (!isValidId(id)) throw new Error('post id missing');
      const res = await API.post(`/posts/${id}/like-toggle/`);
      setThread({ ...thread, liked_by_user: res.data.liked, total_likes: res.data.total_likes });
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการกดไลค์");
    } finally {
      setLiking(false);
    }
  };

  // report navigation handled by ReportButton component


  if (loading) return <p className="text-center mt-10 text-gray-700 dark:text-gray-300">กำลังโหลด...</p>;
  if (!thread) return <p className="text-center mt-10 text-gray-700 dark:text-gray-300">ไม่พบบทความ</p>;

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4 sm:px-6 space-y-6">
      {/* Post Content */}
      <div className="border-b pb-4 mb-6">
        <h1 className="text-3xl font-bold mb-2 text-blue-600 dark:text-blue-400">{thread.title}</h1>
        {/* Category */}
        {thread.category && (
          <div className="mb-2">
            {editingPost ? (
              <span className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-2 py-1 rounded text-sm mr-2 cursor-default opacity-80">
                {thread.category.name}
              </span>
            ) : (
              <ActionButton variant="ghost" size="sm" onClick={() => navigate(`/forum?category=${encodeURIComponent(thread.category.name)}`)} className="mr-2">{thread.category.name}</ActionButton>
            )}
          </div>
        )}
        {/* If editing, show edit form; otherwise show post content */}
        {editingPost ? (
          <form onSubmit={async (e) => { e.preventDefault();
              // submit edit
              if (!isValidId(id)) return alert('post id missing');
              setSubmittingEdit(true);
              try {
                const fd = new FormData();
                fd.append('title', editTitle);
                fd.append('body', editBody);
                if (editImageFile) fd.append('image', editImageFile);
                // category: send id if available, otherwise name
                if (editSelectedCategory && editSelectedCategory.id) fd.append('category', editSelectedCategory.id);
                else if (editCategoryInput) fd.append('category', editCategoryInput);
                // tags: send an array of {name} as JSON string (backend accepts this format)
                if (editTags && editTags.length > 0) {
                  fd.append('tags', JSON.stringify(editTags.map(t => ({ name: t.name }))));
                } else {
                  // explicit empty array to clear tags
                  fd.append('tags', JSON.stringify([]));
                }

                const res = await API.patch(`/posts/${id}/`, fd);
                setThread(res.data);
                setEditingPost(false);
              } catch (err) {
                console.error(err);
                alert('ไม่สามารถบันทึกการแก้ไขได้');
              } finally {
                setSubmittingEdit(false);
              }
            }} className="space-y-3">
            <input className="w-full border rounded px-3 py-2" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            <textarea className="w-full border rounded px-3 py-2 h-40" value={editBody} onChange={(e) => setEditBody(e.target.value)} />
            {/* Category (suggestions + create) */}
            <div>
              <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">หมวดหมู่</label>
              <input
                type="text"
                value={editCategoryInput}
                onChange={(e) => { setEditCategoryInput(e.target.value); setEditSelectedCategory(null); }}
                placeholder="เลือกหมวดหมู่หรือพิมพ์ใหม่"
                className="w-full border rounded-lg px-4 py-2"
              />
              {/* Category suggestions */}
              {editCategoryInput && editCategoryInput.trim() !== '' && !editSelectedCategory && (
                <div className="mt-2 border rounded bg-white dark:bg-gray-700">
                  {categories.filter(c => c.name.toLowerCase().includes(editCategoryInput.trim().toLowerCase())).length > 0 ? (
                    categories
                      .filter(c => c.name.toLowerCase().includes(editCategoryInput.trim().toLowerCase()))
                      .slice(0, 6)
                      .map(c => (
                        <div key={c.id} className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-gray-800 dark:text-gray-100" onClick={() => { setEditSelectedCategory(c); setEditCategoryInput(c.name); }}>
                          {c.name}
                        </div>
                      ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-600">ไม่มีหมวดหมู่ที่ตรงกัน</div>
                  )}
                  <div className="px-3 py-2 border-t flex items-center justify-between">
                    <small className="text-xs text-gray-500 dark:text-gray-300">หรือสร้างหมวดหมู่นี้</small>
                    <button type="button" onClick={async () => {
                      if (!editCategoryInput || !editCategoryInput.trim()) return;
                      try {
                        const res = await API.post('/categories/', { name: editCategoryInput.trim() });
                        setCategories(prev => [res.data, ...prev]);
                        setEditSelectedCategory(res.data);
                      } catch (err) {
                        if (err?.response?.status === 400) {
                          const r = await API.get('/categories/');
                          setCategories(r.data);
                          const pick = r.data.find(c => String(c.name).toLowerCase() === String(editCategoryInput).trim().toLowerCase());
                          if (pick) { setEditSelectedCategory(pick); setEditCategoryInput(pick.name); }
                        } else {
                          console.error(err);
                          alert('ไม่สามารถสร้างหมวดหมู่ได้');
                        }
                      }
                    }} className="text-sm text-blue-400 dark:text-blue-300">สร้าง</button>
                  </div>
                </div>
              )}

              {!editCategoryInput && categories.length > 0 && !editSelectedCategory && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {categories.slice(0, 8).map(c => (
                    <ActionButton key={c.id} variant="ghost" size="sm" onClick={() => { setEditSelectedCategory(c); setEditCategoryInput(c.name); }}>{c.name}</ActionButton>
                  ))}
                </div>
              )}
            </div>

            {/* Tags (same UX as CreatePost) */}
            <div className="mt-3">
              <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-200">แท็ก</label>
              <div className="flex flex-wrap gap-2 mb-1">
                {editTags.map((t) => (
                  <span key={t.name} className="bg-blue-500 text-white px-3 py-1 rounded-full flex items-center gap-1">
                    {t.name}
                    <button type="button" onClick={() => setEditTags(prev => prev.filter(x => x.name !== t.name))} className="ml-2 text-white">×</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                id={`editTagInput-${id}`}
                placeholder="พิมพ์ tag แล้วกด Enter"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = e.target.value.trim();
                    if (!val) return;
                    if (editTags.length >= 5) return alert('สามารถเพิ่มได้ไม่เกิน 5 tag');
                    // If exists in allTags, use that; otherwise try to create via API
                    const existing = allTags.find(a => a.name.toLowerCase() === val.toLowerCase());
                    if (existing) {
                      if (!editTags.find(x => x.name.toLowerCase() === existing.name.toLowerCase())) setEditTags(prev => [...prev, existing]);
                      e.target.value = '';
                      return;
                    }
                    try {
                      const res = await API.post('/tags/', { name: val });
                      const created = res.data;
                      setAllTags(prev => (prev.find(t => t.id === created.id) ? prev : [created, ...prev]));
                      setEditTags(prev => [...prev, created]);
                      e.target.value = '';
                    } catch (err) {
                      console.error(err);
                      const newTag = { id: `new-${val}`, name: val };
                      if (!allTags.find(t => t.name === newTag.name)) setAllTags([newTag, ...allTags]);
                      if (!editTags.find(t => t.name === newTag.name)) setEditTags([...editTags, newTag]);
                      e.target.value = '';
                    }
                  }
                }}
                className="w-full border rounded-lg px-4 py-2 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
              {/* suggestions */}
              <div className="mt-2 flex flex-wrap gap-2">
                {allTags.filter(t => !editTags.find(x => x.name === t.name)).slice(0, 12).map(t => (
                  <ActionButton key={t.id} variant="ghost" size="sm" onClick={() => { if (editTags.length >= 5) return alert('สามารถเพิ่มได้ไม่เกิน 5 tag'); setEditTags(prev => [...prev, t]); }}>{t.name}</ActionButton>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={(e) => setEditImageFile(e.target.files?.[0] || null)} />
              <ActionButton type="submit" variant="primary" className="px-3 py-1" disabled={submittingEdit}>{submittingEdit ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</ActionButton>
              <ActionButton variant="outline" className="px-3 py-1" onClick={() => { setEditingPost(false); }}>ยกเลิก</ActionButton>
              <ActionButton variant="ghost" className="px-3 py-1 text-red-600" onClick={async () => {
                if (!confirm('ยืนยันที่จะลบโพสต์นี้หรือไม่?')) return;
                try {
                  await API.delete(`/posts/${id}/`);
                  navigate('/forum');
                } catch (err) {
                  console.error(err);
                  alert('ไม่สามารถลบโพสต์ได้');
                }
              }}>ลบ</ActionButton>
            </div>
          </form>
        ) : (
          <>
            {/* Post image (accepts either a string URL or an object with a `url` property) */}
            {(thread.image?.url || thread.image) && (
              <img
                src={thread.image?.url || thread.image}
                alt={thread.title}
                className="w-full max-h-96 object-cover rounded mb-3"
              />
            )}

            <p className="text-gray-700 dark:text-gray-300 mb-2">{thread.body}</p>
          </>
        )}

        {/* Tags */}
        {thread.tags?.length > 0 && (
          <div className="mb-2">
            {thread.tags.map((tag) => (
              editingPost ? (
                <span key={tag.id} className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded mr-2 text-sm opacity-80">
                  {tag.name}
                </span>
              ) : (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => navigate(`/forum?tag=${tag.id}`)}
                  className="inline-block bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded mr-2 text-sm hover:opacity-90"
                >
                  {tag.name}
                </button>
              )
            ))}
          </div>
        )}

        {/* Likes & Author */}
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-4">
          <span>โพสต์โดย {thread.user?.username || "Anonymous"}</span>
          <button onClick={handleLikeToggle} disabled={liking} className="flex items-center gap-1">
            <FaHeart
              className={`h-6 w-6 transition-transform duration-200 ${thread.liked_by_user ? "text-red-600 scale-110" : "text-gray-400 hover:text-red-500"}`}
            />
            <span>{thread.total_likes}</span>
          </button>
          {user && (
            <>
              <ReportButton targetId={thread.id} targetType="post" ownerId={thread.user?.id} currentUserId={user?.id} />
              {/* Show Edit button for owner or admin-like users; Delete moved into edit form */}
              {(user?.id === thread.user?.id || user?.is_staff || user?.role === 'admin' || user?.is_superuser) && (
                <>
                  <button onClick={() => { setEditTitle(thread.title || ''); setEditBody(thread.body || ''); setEditingPost(true); }} className={actionBtn}>
                    แก้ไข
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">ความคิดเห็น</h2>
        <CommentSection postId={id} user={user} />
      </div>
    </div>
  );
}
