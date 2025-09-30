import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api/api";
import AdminSidebar from "../../components/admin/AdminSidebar";

export default function AdminReport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await API.get("/reports/");
      setReports(res.data);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถโหลดรายงานได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const navigate = useNavigate();

  const handleAction = async (reportId, action) => {
    try {
      const report = reports.find((r) => r.id === reportId);
      if (!report) throw new Error("Report not found");

      // Mark as resolved
      if (action === "resolved") {
        await API.patch(`/reports/${reportId}/`, { resolved: true });
        alert("ดำเนินการสำเร็จ");
        fetchReports();
        return;
      }

      // Delete reported post
      if (action === "delete_post" && report.post) {
        const postId = typeof report.post === 'object' ? report.post.id : report.post;
        if (!postId) throw new Error('No post id');
        // mark report resolved first to avoid cascade delete removing the report before we PATCH it
        await API.patch(`/reports/${reportId}/`, { resolved: true });
        await API.delete(`/posts/${postId}/`);
        alert("โพสต์ถูกลบและรายงานถูกปิดเรียบร้อย");
        fetchReports();
        return;
      }

      // Delete reported comment
      if (action === "delete_comment" && report.comment) {
        const commentId = typeof report.comment === 'object' ? report.comment.id : report.comment;
        if (!commentId) throw new Error('No comment id');
        // mark report resolved first to avoid cascade delete removing the report before we PATCH it
        await API.patch(`/reports/${reportId}/`, { resolved: true });
        await API.delete(`/comments/${commentId}/`);
        alert("คอมเมนต์ถูกลบและรายงานถูกปิดเรียบร้อย");
        fetchReports();
        return;
      }

      // Fallback: only allow server-expected actions ('delete'|'edit')
      if (action === 'delete' || action === 'edit') {
        await API.patch(`/reports/${reportId}/`, { action });
        alert("ดำเนินการสำเร็จ");
        fetchReports();
        return;
      }

      // Perform the action requested by the reporter
      if (action === 'perform') {
        // The report itself contains the desired action in `report.action`.
        const desired = report.action;
        if (desired === 'delete') {
          if (report.report_type === 'post' && report.post) {
            const postId = typeof report.post === 'object' ? report.post.id : report.post;
            if (!postId) throw new Error('No target to delete');
            // mark report resolved first
            await API.patch(`/reports/${reportId}/`, { resolved: true });
            await API.delete(`/posts/${postId}/`);
          } else if (report.report_type === 'comment' && report.comment) {
            const commentId = typeof report.comment === 'object' ? report.comment.id : report.comment;
            if (!commentId) throw new Error('No target to delete');
            // mark report resolved first
            await API.patch(`/reports/${reportId}/`, { resolved: true });
            await API.delete(`/comments/${commentId}/`);
          } else {
            throw new Error('No target to delete');
          }
          alert('ดำเนินการ: ลบเนื้อหา สำเร็จ');
          fetchReports();
          return;
        }

          if (desired === 'edit') {
            // For posts, navigate to the thread and open edit mode so admin can edit in full UI
            if (report.report_type === 'post' && report.post) {
              const postId = typeof report.post === 'object' ? report.post.id : report.post;
              if (!postId) throw new Error('No target to edit');
              // mark report resolved so admin can focus on editing (optional)
              await API.patch(`/reports/${reportId}/`, { resolved: true });
              navigate(`/thread/${postId}`, { state: { openEdit: true } });
              return;
            }
            // For comments, keep existing prompt-based flow (or navigate to thread with comment highlighted)
            if (report.report_type === 'comment' && report.comment) {
              const commentId = typeof report.comment === 'object' ? report.comment.id : report.comment;
              if (!commentId) throw new Error('No target to edit');
              // mark report resolved
              await API.patch(`/reports/${reportId}/`, { resolved: true });
              // navigate to thread page where admin can edit the comment inline (pass comment id in navigation state)
              const postId = report.post ? (typeof report.post === 'object' ? report.post.id : report.post) : null;
              if (postId) {
                navigate(`/thread/${postId}`, { state: { editCommentId: commentId } });
                return;
              }
              // fallback: attempt to patch comment via prompt
              let current = '';
              if (typeof report.comment === 'object' && report.comment.body) {
                current = report.comment.body;
              } else {
                const res = await API.get(`/comments/${commentId}/`);
                current = res.data.body || '';
              }
              const newBody = window.prompt('ใส่ข้อความใหม่สำหรับคอมเมนต์ (ยืนยันเพื่อบันทึก):', current);
              if (!newBody) return; // cancelled
              await API.patch(`/comments/${commentId}/`, { body: newBody });
              await API.patch(`/reports/${reportId}/`, { resolved: true });
              alert('ดำเนินการ: แก้ไขคอมเมนต์ สำเร็จ');
              fetchReports();
              return;
            }
            throw new Error('No target to edit');
          }
      }

      // Delete the report itself (admin/owner)
      if (action === 'delete_report') {
        await API.delete(`/reports/${reportId}/`);
        alert("ลบรายงานเรียบร้อย");
        fetchReports();
        return;
      }

      throw new Error("Invalid action");
    } catch (err) {
      console.error(err);
      alert("ดำเนินการไม่สำเร็จ");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-64"><AdminSidebar /></div>

      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">รายงานทั้งหมด</h1>

        {loading ? (
          <p className="text-gray-700 dark:text-gray-300">กำลังโหลดรายงาน...</p>
        ) : reports.length === 0 ? (
          <p className="text-gray-700 dark:text-gray-300">ยังไม่มีรายงาน</p>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <div
                key={r.id}
                className="p-4 border rounded bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              >
                <p className="text-gray-800 dark:text-gray-100">
                  <b>Type:</b> {r.report_type} | <b>Reason:</b> {r.reason}
                </p>
                <p className="text-gray-600 dark:text-gray-300">
                  <b>Reported by:</b> {r.user?.username || "Anonymous"}
                </p>

                {/* Link ไป content */}
                {/* post link removed per request; keep comment link only */}
                {r.comment && (() => {
                  const commentId = typeof r.comment === 'object' ? r.comment.id : r.comment;
                  if (!commentId) return null;
                  return (
                    <Link
                      to={`/thread/${commentId}`}
                      className="text-blue-600 hover:underline block mt-1"
                    >
                      ไปยังคอมเมนต์ที่ถูกรายงาน
                    </Link>
                  );
                })()}

                <div className="flex gap-2 mt-2">
                  {/* Only show the button that corresponds to the reporter's requested action */}
                  {r.action === 'delete' && r.report_type === 'post' && (r.post) && (
                    <button
                      onClick={() => handleAction(r.id, 'perform')}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      ลบโพสต์ ตามคำขอ
                    </button>
                  )}

                  {r.action === 'delete' && r.report_type === 'comment' && (r.comment) && (
                    <button
                      onClick={() => handleAction(r.id, 'perform')}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      ลบคอมเมนต์ ตามคำขอ
                    </button>
                  )}

                  {r.action === 'edit' && r.report_type === 'post' && (r.post) && (
                    <button
                      onClick={() => handleAction(r.id, 'perform')}
                      className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                    >
                      แก้ไขโพสต์ ตามคำขอ
                    </button>
                  )}

                  {r.action === 'edit' && r.report_type === 'comment' && (r.comment) && (
                    <button
                      onClick={() => handleAction(r.id, 'perform')}
                      className="bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
                    >
                      แก้ไขคอมเมนต์ ตามคำขอ
                    </button>
                  )}

                  {/* If there is no actionable target, show a disabled hint */}
                  {!(
                    (r.action === 'delete' && (r.report_type === 'post' ? r.post : r.comment)) ||
                    (r.action === 'edit' && (r.report_type === 'post' ? r.post : r.comment))
                  ) && (
                    <button disabled className="bg-gray-400 text-white px-3 py-1 rounded opacity-60">
                      ไม่มีเป้าหมายที่ดำเนินการได้
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
