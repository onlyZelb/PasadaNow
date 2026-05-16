import axios from "axios";

// FIX: withCredentials removed. Sending cookies on every request to the PHP
// backend causes HTTP 431 "Request Header Fields Too Large" when cookies
// contain large base64 image data. Auth is handled via Authorization header
// (Bearer token from localStorage) instead — same as axios.js.
const phpApi = axios.create({
  baseURL: import.meta.env.VITE_PHP_API_URL || "http://localhost:8081",
  withCredentials: false, // <-- was: true
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Attach JWT token as Bearer header so the PHP backend can still authenticate
phpApi.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("authToken");

  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default phpApi;
