import { useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthProvider";
import Avatar from "./Avatar";
import ActionButton from "./ActionButton";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  // dark mode toggle removed — UI is single theme now

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleCreatePost = () => {
    navigate(user ? "/create-post" : "/login");
  };

  const linkClass = "px-4 py-2 rounded-lg flex items-center gap-2 text-sm no-underline";

  return (
    <>
  <nav className="bg-primary fixed top-0 w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 justify-between">

            {/* Left Menu */}
            <div className="flex space-x-2 items-center">
              <ActionButton variant="ghost" onClick={() => navigate("/")}>หน้าแรก</ActionButton>
              <ActionButton variant="primary" onClick={handleCreatePost}>+ สร้างกระทู้</ActionButton>
              {(user?.is_staff || user?.role === 'admin' || user?.is_superuser) && (
                <ActionButton variant="ghost" onClick={() => navigate("/admin/dashboard")}>Admin</ActionButton>
              )}
            </div>

            {/* Right Menu */}
            <div className="flex space-x-2 items-center">
              {user ? (
                <>
                  <Link to="/profile" className={linkClass}>
                    <div className="inline-flex items-center gap-2 text-white">
                      <Avatar src={user.avatar} size={28} />
                      Hi, {user.username}
                    </div>
                  </Link>
                  <ActionButton variant="ghost" onClick={handleLogout}>Logout</ActionButton>
                </>
              ) : (
                <>
                  <ActionButton variant="ghost" onClick={() => navigate("/login")} className="text-white">Login</ActionButton>
                  <ActionButton variant="ghost" onClick={() => navigate("/register")} className="text-white">Register</ActionButton>
                </>
              )}
              {/* dark mode toggle removed */}
            </div>

          </div>
        </div>
      </nav>

      {/* เว้นเนื้อหาไม่ให้ถูกทับ Navbar */}
      <div style={{ marginTop: "64px" }} />
    </>
  );
}
