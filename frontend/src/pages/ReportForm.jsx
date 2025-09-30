import { useState, useContext } from "react";
import API from "../api/api";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";

export default function ReportForm() {
  const [reason, setReason] = useState("");
  const [action, setAction] = useState('delete');
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser } = useContext(AuthContext) || {};

  const params = new URLSearchParams(location.search);
  const queryType = params.get("type");
  const queryId = params.get("id");

  const routeParams = useParams();

  // support multiple ways of arriving at the report form:
  // - location.state { postId / commentId }
  // - query params ?type=post&id=123
  // - route param /report/:postId
  const stateIds = location.state || {};
  const postId = stateIds.postId || routeParams.postId || (queryType === "post" ? queryId : null);
  const commentId = stateIds.commentId || (queryType === "comment" ? queryId : null);


  const handleSubmit = async (e) => {
    e.preventDefault();
    // Allow empty reason; backend now accepts empty/null reason
    const token = localStorage.getItem("accessToken");
    if (!token) {
      // Not logged in — prompt the user to login
      if (window.confirm("คุณต้องล็อกอินเพื่อส่งรายงาน จะไปยังหน้าล็อกอินหรือไม่?")) {
        navigate('/login');
      }
      return;
    }

    // Client-side guard: do not allow reporting your own content
    if ((postId && currentUser?.id && String(currentUser.id) === String(location.state?.postIdOwner || '')) ||
        (commentId && currentUser?.id && String(currentUser.id) === String(location.state?.commentIdOwner || ''))) {
      alert('ไม่สามารถรายงานเนื้อหาของตัวเองได้');
      return;
    }

    try {
      await API.post("/reports/", {
        report_type: postId ? "post" : "comment",
        post: postId || null,
        comment: commentId || null,
        reason: reason || '',
        // include the action selected by the user (choices: 'delete'|'edit')
        action,
      });
      alert("ส่งรายงานเรียบร้อยแล้ว");
      navigate(-1);
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 401) {
        if (window.confirm("เซสชันหมดอายุ จะไปยังหน้าล็อกอินหรือไม่?")) {
          navigate('/login');
        }
        return;
      }
      alert("ไม่สามารถส่งรายงานได้");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md relative">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">รายงานเนื้อหา</h1>
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="ปิด"
            title="ปิด"
            className="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white p-1 border rounded-md w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* ลิงก์ไป content */}
        {postId && (
          <p className="mb-2 text-blue-600 hover:underline">
            <Link to={`/thread/${postId}`}>ไปยังโพสต์ที่ถูกรายงาน</Link>
          </p>
        )}
        {commentId && (
          <p className="mb-2 text-blue-600 hover:underline">
            <Link to={`/thread/${commentId}`}>ไปยังคอมเมนต์ที่ถูกรายงาน</Link>
          </p>
        )}

        {!postId && !commentId && (
          <p className="text-red-600 mb-3">ไม่พบเป้าหมายที่ต้องการรายงาน (post หรือ comment)</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-gray-700 dark:text-gray-200 font-medium">
            เหตุผลในการรายงาน
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="กรุณาอธิบายเหตุผล..."
              className="w-full border rounded-lg px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={5}
              required
            />
          </label>

            <label className="block text-gray-700 dark:text-gray-200 font-medium">
              การดำเนินการที่ต้องการ
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 mt-2 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="delete">ลบ (แนะนำเมื่อเนื้อหาไม่เหมาะสม)</option>
                <option value="edit">แก้ไข (แนะนำเมื่อต้องการให้ผู้เขียนแก้ไข)</option>
              </select>
            </label>

          <button
            type="submit"
            disabled={!postId && !commentId}
            className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            ส่งรายงาน
          </button>
        </form>
      </div>
    </div>
  );
}
