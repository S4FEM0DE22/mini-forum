import { createContext, useState, useEffect } from "react";
import API from "../api/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // เพิ่ม loading state

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const savedUser = localStorage.getItem("user");
      const token = localStorage.getItem("accessToken");

      // If there's no token, just restore saved user (if any) and finish
      if (!token) {
        if (savedUser && mounted) setUser(JSON.parse(savedUser));
        if (mounted) setLoading(false);
        return;
      }

      // If we have a refresh token, try to refresh access token first to avoid
      // an immediate 401 when accessToken is expired.
      try {
        const refresh = localStorage.getItem("refresh");
        if (refresh) {
          try {
            const r = await API.post("token/refresh/", { refresh }, { headers: { Authorization: undefined } });
            const newAccess = r.data.access;
            localStorage.setItem("accessToken", newAccess);
          } catch (e) {
            // If refresh failed, we'll fall back and let the /users/me/ call handle it
            // (AuthProvider will clear invalid auth on 401 below).
            void e;
          }
        }

        // Validate token by fetching /users/me/
        const res = await API.get("/users/me/");
        if (mounted) {
          // If backend doesn't include social, merge from cached user to avoid losing links on refresh
          let userObj = res.data;
          if ((!userObj.social || Object.keys(userObj.social).length === 0) && savedUser) {
            try {
              const cached = JSON.parse(savedUser);
              if (cached?.social) userObj.social = cached.social;
            } catch (e) {
              // ignore parse errors
              void e;
            }
          }
          setUser(userObj);
          localStorage.setItem("user", JSON.stringify(userObj));
        }
      } catch (err) {
        // If token invalid (401), clear stored auth
        if (err?.response?.status === 401) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          localStorage.removeItem("refresh");
          if (mounted) setUser(null);
        } else if (savedUser && mounted) {
          // Fallback: if /users/me failed for other reasons, restore cached user
          setUser(JSON.parse(savedUser));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
