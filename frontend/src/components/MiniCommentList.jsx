import { useState, useEffect, useContext } from "react";
import API from "../api/api";
import ReportButton from "./ReportButton";
import { AuthContext } from "../context/AuthProvider";

export default function MiniCommentList({ postId, limit = 2 }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    let mounted = true;
    const fetchComments = async () => {
      try {
        if (!postId) return setComments([]);
        const res = await API.get(`/comments/?post=${postId}`);
        if (!mounted) return;
        setComments(res.data.slice(0, limit));
      } catch (err) {
        console.error('MiniCommentList fetch error', err);
        if (mounted) setComments([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchComments();
    return () => { mounted = false; };
  }, [postId, limit]);

  if (loading) return <p className="text-sm text-gray-500">กำลังโหลดคอมเมนต์...</p>;
  if (!comments.length) return <p className="text-sm text-gray-500">ยังไม่มีคอมเมนต์</p>;

  return (
    <div className="mt-3 space-y-2">
      {comments.map(c => (
        <div key={c.id} className="p-2 bg-gray-50 dark:bg-gray-900 border rounded">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-300"><b>{c.user?.username || 'Anonymous'}</b></div>
              <div className="text-sm text-gray-700 dark:text-gray-200 mt-1 whitespace-pre-wrap">{c.body}</div>
              {(c.image?.url || c.image) && (
                <img src={c.image?.url || c.image} alt={`comment-${c.id}`} className="mt-2 max-w-xs rounded border" />
              )}
            </div>
            <div className="ml-3 flex-shrink-0">
              <ReportButton targetId={c.id} targetType="comment" ownerId={c.user?.id} currentUserId={user?.id} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
