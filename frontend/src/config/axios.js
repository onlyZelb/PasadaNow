import axios from "axios";

// Create an instance of axios with custom configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
  // NOTE: withCredentials removed — sending cookies (especially those
  // containing base64 photo data) causes HTTP 431 "Request Header Fields
  // Too Large" on every request. Auth is handled via Authorization header
  // (Bearer token) instead. Only re-enable withCredentials if your backend
  // strictly requires HttpOnly cookies AND you have confirmed cookie sizes
  // are small (< 4 KB total).
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// ── Request interceptor ────────────────────────────────────────────────────
// Attach the JWT token from localStorage as a Bearer header on every request
// so the backend can authenticate without relying on cookies.
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("authToken");

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ───────────────────────────────────────────────────
// Centrally handle 401 (expired / missing token) so every component does
// not need its own redirect logic.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage and redirect to login
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("authToken");
      // Only redirect if not already on the login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
