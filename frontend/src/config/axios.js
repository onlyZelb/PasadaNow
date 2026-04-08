// axios.js — cookie-based auth (matches your HttpOnly JWT cookie setup)
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/",
  withCredentials: true, // ← KEEP THIS — sends the HttpOnly jwt cookie
  headers: { "Content-Type": "application/json" },
});

// No Authorization header needed — the cookie is sent automatically

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
