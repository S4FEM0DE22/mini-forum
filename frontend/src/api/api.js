import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/", // ปรับเป็น backend URL ของคุณ
});

// ใส่ Authorization header อัตโนมัติจาก localStorage
API.interceptors.request.use((config) => {
  // Do not attach Authorization header for token endpoints (login/refresh)
  // This prevents sending a stale/invalid access token when requesting new tokens.
  const url = String(config.url || "").toLowerCase();
  if (url.includes("token/")) {
    // Ensure no Authorization header is present on token endpoints. This overrides
    // any Authorization set in defaults or earlier middleware.
    try {
      if (config.headers) {
        delete config.headers.Authorization;
        delete config.headers.authorization;
      }
    } catch (_) {
      // ignore
    }
  } else {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Global response handler: do not auto-clear auth on 401 to avoid clearing
// localStorage during background requests (for example on page refresh).
// On 401, try to refresh the access token using refresh token and retry once.
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      const refresh = localStorage.getItem("refresh");
      if (!refresh) {
        // No refresh token: let the caller handle sign-out
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue the request until token is refreshed
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const resp = await API.post("token/refresh/", { refresh });
        const newAccess = resp.data.access;
        localStorage.setItem("accessToken", newAccess);
        // Do not set a default Authorization header on the axios instance; rely on
        // the request interceptor to attach access tokens per-request. Setting a
        // default can cause token endpoints to accidentally receive an Authorization
        // header when we do not want that.
        // API.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;
        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return API(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // Let the application handle cleanup on 401 (AuthProvider will clear cached auth on 401)
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
