import { useState, useEffect } from "react";
import API from "../api/api";
import ReportButton from "../components/ReportButton";
import ActionButton from "./ActionButton";

export default function CommentSection({ postId, user }) {
  const [comments, setComments] = useState([]);
  const [body, setBody] = useState("");
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState("");
  const [editImage, setEditImage] = useState(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const isValidId = (val) => {
    if (!val) return false;
    if (val === "undefined" || val === "null") return false;
    return /^\d+$/.test(String(val));
  };

  useEffect(() => {
    (async () => {
      try {
        if (!isValidId(postId)) {
          setComments([]);
          return;
        }
        const res = await API.get(`/comments/?post=${postId}`);
        setComments(res.data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [postId]);

  // If navigated with an edit comment request (?editComment=<id> or navigation state), open that comment in edit mode
  useEffect(() => {
    try {
      const search = new URLSearchParams(window.location.search);
      const editComment = search.get('editComment');
      const navState = (typeof window !== 'undefined' && window.history && window.history.state) ? window.history.state : null;
      const editIdFromState = navState && navState.state && navState.state.editCommentId;
      const targetId = editComment || editIdFromState;
      if (targetId && /^\\d+$/.test(String(targetId))) {
        // open edit mode for that comment once comments loaded
        setEditingId(Number(targetId));
        // prefill edit body if comment already present
        const found = comments.find(c => String(c.id) === String(targetId));
        if (found) setEditBody(found.body || '');
      }
    } catch {
      // ignore
    }
  }, [comments]);

  const handleSubmit = async () => {
    // Allow image-only comments
    if ((!body || !body.trim()) && !image) return alert('กรุณากรอกข้อความหรือเลือกภาพอย่างน้อยหนึ่งอย่าง');
    setSubmitting(true);
    try {
      if (!isValidId(postId)) throw new Error('post id missing');
      const data = new FormData();
      data.append('post', postId);
      data.append('body', body);
      if (image) data.append('image', image);
      await API.post("/comments/", data);
      setBody("");
      setImage(null);
      // refresh comments after submit
      try {
        const r = await API.get(`/comments/?post=${postId}`);
        setComments(r.data);
      } catch (e) {
        console.error(e);
      }
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถส่งคอมเมนต์ได้");
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = async (c) => {
    if (!editBody || !editBody.trim()) return alert('ข้อความคอมเมนต์ต้องไม่ว่าง');
    setSubmittingEdit(true);
    try {
      const fd = new FormData();
      fd.append('body', editBody);
      if (editImage) fd.append('image', editImage);
      const res = await API.patch(`/comments/${c.id}/`, fd);
      setComments(prev => prev.map(x => x.id === c.id ? res.data : x));
      setEditingId(null);
      setEditBody('');
      setEditImage(null);
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถบันทึกคอมเมนต์ได้');
    } finally {
      setSubmittingEdit(false);
    }
  };

  const deleteComment = async (id) => {
    if (!confirm('ยืนยันที่จะลบคอมเมนต์นี้หรือไม่?')) return;
    try {
      await API.delete(`/comments/${id}/`);
      setComments(prev => prev.filter(x => x.id !== id));
    } catch (err) {
      console.error(err);
      alert('ไม่สามารถลบคอมเมนต์ได้');
    }
  };

  const toggleLike = async (c) => {
    try {
      const res = await API.post(`/comments/${c.id}/like-toggle/`);
      // update local comment liked state and count
      const { liked, total_likes } = res.data;
      setComments(prev => prev.map(x => x.id === c.id ? { ...x, liked_by_user: liked, likes_count: total_likes } : x));
    } catch (err) {
      console.error(err);
    }
  };

  

  return (
    <div className="space-y-4">
      {comments.map((c) => (
        <div key={c.id} className="p-2 border rounded bg-white dark:bg-gray-800">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <b>{c.user?.username || "Anonymous"}</b>
                </div>
                <div className="flex items-center gap-2">
                  {/* Like button: icon-only, no background */}
                  <button onClick={() => toggleLike(c)} className="flex items-center gap-1 text-red-500 hover:opacity-80">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill={c.liked_by_user ? "currentColor" : "none"} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.657L10 17.657l-6.828-6.828a4 4 0 010-5.657z" />
                    </svg>
                    <span className="text-xs">{c.likes_count || 0}</span>
                  </button>
                  {user && (
                    <ReportButton targetId={c.id} targetType="comment" ownerId={c.user?.id} currentUserId={user?.id} />
                  )}
                </div>
              </div>

              {editingId === c.id ? (
                  <div className="mt-2 space-y-2">
                  <textarea className="w-full border rounded px-2 py-1" value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                  <input type="file" accept="image/*" onChange={(e) => setEditImage(e.target.files?.[0] || null)} />
                  <div className="flex gap-2 mt-2">
                    <ActionButton variant="primary" onClick={() => saveEdit(c)} disabled={submittingEdit}>{submittingEdit ? 'กำลังบันทึก...' : 'บันทึก'}</ActionButton>
                    <ActionButton variant="outline" onClick={() => { setEditingId(null); setEditBody(''); setEditImage(null); }}>ยกเลิก</ActionButton>
                    {/* Delete allowed only while editing per UX request */}
                    {(user?.id === c.user?.id || user?.is_staff || user?.role === 'admin' || user?.is_superuser) && (
                      <ActionButton variant="ghost" className="text-red-600" onClick={() => deleteComment(c.id)}>ลบ</ActionButton>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-1">
                  <div className="whitespace-pre-wrap">{c.body}</div>
                  {(c.image?.url || c.image) && (
                    <img src={c.image?.url || c.image} alt={`comment-${c.id}`} className="mt-2 max-w-xs rounded border" />
                  )}
                  <div className="mt-2 flex gap-2">
                    {user && (user?.id === c.user?.id || user?.is_staff || user?.role === 'admin' || user?.is_superuser) && (
                      <ActionButton variant="outline" size="sm" onClick={() => { setEditingId(c.id); setEditBody(c.body || ''); setEditImage(null); }}>แก้ไข</ActionButton>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {user && (
        <div className="flex gap-2">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="เขียนคอมเมนต์..."
            className="flex-1 border rounded px-2"
          />
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0] || null)} />
          <ActionButton variant="primary" onClick={handleSubmit} disabled={submitting}>{submitting ? "กำลังส่ง..." : "ส่ง"}</ActionButton>
        </div>
      )}
    </div>
  );
}
